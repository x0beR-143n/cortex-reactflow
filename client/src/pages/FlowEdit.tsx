/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { Box, Button, Loader, Text } from "@mantine/core";
import { Play, Save } from "lucide-react";

import StartNode from "../components/nodes/StartNode";
import PlusNode from "../components/nodes/PlusNode";
import ScriptNode from "../components/nodes/ScriptNode";
import ConditionalNode from "../components/nodes/ConditionalNode";
import AINode from "../components/nodes/AINode";
import OutputNode from "../components/nodes/OutputNode";

import StartNodeRunModal, { type FieldData } from "../components/ui/StartNodeRunModal";
import { useFlow, useSaveFlowWithDeletion } from "../hooks/useFlows";
import { useParams } from "react-router-dom";
import type { FlowNode } from "../interfaces/FlowNodeType";
import { convertReactFlowEdges, convertReactFlowNodes, objectToFields, toXY } from "../utils/object_to_data";
import FlowInfoCard from "../components/ui/FlowInfoCard";
import { generateUUID } from "../utils/uuid";
import toast from "react-hot-toast";
import { useDeletedNodesStore } from "../store/flowStore";
import { socket } from "../socket/socket";
import RunResultCard from "../components/ui/RunResultCard";

const nodeTypes = {
  startNode: StartNode,
  plusNode: PlusNode,
  scriptNode: ScriptNode,
  conditionalNode: ConditionalNode,
  outputNode: OutputNode,
  aiNode: AINode,
};

const startNodeUUID = generateUUID();
const plusNodeUUID = generateUUID();
const edgeUUID = generateUUID();

const initialNodes: Node[] = [
  { id: startNodeUUID, type: "startNode", position: { x: 0, y: 0 }, data: {} },
  { id: plusNodeUUID, type: "plusNode", position: { x: 89, y: 160 }, data: {} },
];

const initialEdges: Edge[] = [{ id: edgeUUID, source: startNodeUUID, target: plusNodeUUID }];

export default function FlowEdit() {
  const { id } = useParams<{ id: string }>();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Modal open + initial fields lấy từ start-node
  const [runModalOpen, setRunModalOpen] = useState(false);
  
  //zustand 
  const toArray = useDeletedNodesStore((s) => s.toArray);
  const store_deletion_clear = useDeletedNodesStore((s) => s.clear);

  const [runResult, setRunResult] = useState<any | null>(null);

  const startNodeFields: FieldData[] | null = useMemo(() => {
    const start = nodes.find((n) => n.type === "startNode");
    return start?.data.fields as FieldData[];
  }, [nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  const handleRunClick = () => {
    setRunModalOpen(true);
  }

  const commitFieldsToStartNode = (cleaned: FieldData[]) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.type === "startNode" ? { ...n, data: { ...(n.data || {}), fields: cleaned } } : n
      )
    );
  };

  const { data, isLoading, isError, error, refetch } = useFlow(id);

  useEffect(() => {
    if (!data) {
      return;
    };

    if(data.nodes.length === 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      return;
    }

    // Convert nodes từ backend sang ReactFlow
    const parsedNodes: Node[] = data.nodes.map((n: FlowNode) => {
      const baseData = {
        ...(n && typeof n.data === 'object' && n.data !== null ? n.data : {}),
        label: n.label ?? '',
      };
      const baseDataNormalNode = {
         ...(n && typeof n.data === 'object' && n.data !== null ? n.data : {}),
        label: n.label ?? '',
        isError: null,
        isDone: null,
        error: null,
      }
      // startNode → xử lý riêng
      if (n.nodeType === "startNode") {
        return {
          id: n.id,
          type: n.nodeType,
          position: toXY(n.position),
          data: {
            // ví dụ: ép fields từ object về FieldData[]
            fields: objectToFields(baseData),
          },
        };
      }
      return {
        id: n.id,
        type: n.nodeType,
        position: toXY(n.position),
        data: baseDataNormalNode,
      };
    });

    // Convert edges từ backend sang ReactFlow
    const parsedEdges: Edge[] = data.edges.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      data: e.data || {},
    }));

    setNodes(parsedNodes);
    setEdges(parsedEdges);
  }, [data]);

  const { mutate, isPending} = useSaveFlowWithDeletion();

  const resetAllNodeStatuses = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) =>
        n.type === "startNode"
          ? n
          : {
              ...n,
              data: {
                ...(n.data || {}),
                isDone: null,
                isError: null,
                error: "",
              },
            }
      )
    );
  }, [setNodes]);

  // cập nhật trạng thái cho 1 node theo id
  const setNodeStatus = useCallback(
    (nodeId: string, patch: { isDone?: boolean | null; isError?: boolean | null; error?: string }) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...(n.data || {}),
                  ...(patch.isDone !== undefined ? { isDone: patch.isDone } : {}),
                  ...(patch.isError !== undefined ? { isError: patch.isError } : {}),
                  ...(patch.error !== undefined ? { error: patch.error } : {}),
                },
              }
            : n
        )
      );
    },
    [setNodes]
  );

  const handleSubmit = async (start_data: Record<string, unknown>) => {
    // 1️⃣ Kết nối socket như cũ...
    if (!socket.connected) {
      await new Promise<void>((resolve, reject) => {
        const onConnect = () => { socket.off('connect_error', onError); resolve(); };
        const onError = (err: any) => { socket.off('connect', onConnect); reject(err); };
        socket.once('connect', onConnect);
        socket.once('connect_error', onError);
        socket.connect();
      });
    }

    if (!id) return;

    // 2️⃣ Chuẩn bị payload như cũ
    const convertedNodes = convertReactFlowNodes(nodes, id);
    const convertedEdges = convertReactFlowEdges(edges, id);
    convertedNodes[0].data = start_data;
    const payload = { nodes: convertedNodes, edges: convertedEdges };

    // 👉 reset trạng thái phiên cho tất cả node trước khi run
    resetAllNodeStatuses();
    setRunResult(null);

    // 3️⃣ Lắng nghe realtime và CẬP NHẬT STATE node
    socket.once("run:started", () => {
      
    });

    socket.on("node:started", (e: { nodeId: string }) => {
      // node bắt đầu: clear lỗi & done
      setNodeStatus(e.nodeId, { isDone: null, isError: null, error: "" });
    });

    socket.on("node:succeeded", (e: { nodeId: string }) => {
      setNodeStatus(e.nodeId, { isDone: true, isError: false, error: "" });
    });

    socket.on("node:failed", (e: { nodeId: string; error?: string }) => {
      setNodeStatus(e.nodeId, { isDone: false, isError: true, error: e?.error ?? "Unknown error" });
    });

    socket.once("run:finished", (data) => {
      // lưu toàn bộ payload hoặc data.result nếu server bọc bên trong
      setRunResult((data && (data.result ?? data)) ?? null);

      socket.off("node:started");
      socket.off("node:succeeded");
      socket.off("node:failed");
      socket.disconnect();
    });

    // 4️⃣ Gửi yêu cầu chạy flow
    socket.emit(
      "run:start",
      payload,
      (ack?: { ok: boolean; runId?: string; message?: string }) => {
        if (ack && !ack.ok) {
          toast.error(ack.message ?? "Start failed");
        } else {
          // optional: toast.success(`Run started: ${ack?.runId}`);
        }
      }
    );
  };

  const handleSave = () => {
    toast.loading('Saving...');
    const toDelete = toArray();
    
    if(id) {
      const convertedNodes = convertReactFlowNodes(nodes, id);
      const convertedEdges = convertReactFlowEdges(edges, id);
      mutate(
        { convertedNodes, convertedEdges, toDelete },
        {
          onSuccess: () => {
            toast.dismiss(); // tắt toast loading cũ
            toast.success('Flow saved successfully!');
            store_deletion_clear();
          },
          onError: (err) => {
            toast.dismiss();
            toast.error(err.message ?? 'Save failed!');
          },
        }
      );
    }
  };


  if (isLoading) {
    return (
    <Box
      h="100vh"
      bg="black"
      display="flex"
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Loader color="violet" />
    </Box>
    );
  }

  if (isError) {
    return (
    <Box
      h="100vh"
      bg="black"
      c="white"
      display="flex"
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Text c="red">{error?.message ?? "Failed to load flows"}</Text>
      <Button variant="light" color="violet" onClick={() => refetch()}>
          Try again
      </Button>
    </Box>
    );
  }

  return (
    <div className="w-full h-screen bg-[#242424] relative">
      <div className="absolute left-[80%] top-4 z-10 flex gap-x-5">
        <Button color="cyan" size="md" className="flex items-center" onClick={handleRunClick}>
          <Play size={14} className="mr-2" />
          Run
        </Button>
        <Button color="violet" size="md" className="flex items-center" onClick={handleSave} disabled={isPending} >
          <Save size={14} className="mr-2" />
          Save
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls
          style={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            boxShadow: "none",
          }}
        />
      </ReactFlow>

      <StartNodeRunModal
        opened={runModalOpen}
        initialFields={startNodeFields} // field ban đầu nếu từ db đã tồn tại dữ liệu từ trước
        onClose={() => setRunModalOpen(false)}
        onSkip={() => {
          // xử lý run withou values ở đây
          setRunModalOpen(false);
        }}
        onSubmit={(cleaned, objectified) => {
          // lưu vào start-node trong mảng nodes
          commitFieldsToStartNode(cleaned);
          // đóng modal
          setRunModalOpen(false);
          
          handleSubmit(objectified);
        }}
      />
      {data !== undefined && (
        <FlowInfoCard
          flow={data}
        />
      )}
      <RunResultCard data={runResult} onClose={() => setRunResult(null)} />
    </div>
  );
}
