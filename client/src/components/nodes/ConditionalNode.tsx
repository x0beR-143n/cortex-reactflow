import type React from "react";
import {
  addEdge,
  Handle,
  Position,
  useNodeId,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Modal, Textarea, Button, Stack, Group, Text } from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import { GitBranch } from "lucide-react";
import toast from "react-hot-toast";
import { generateUUID } from "../../utils/uuid";
import { collectDescendantsAndParent } from "../../utils/flow";
import { useDeletedNodesStore } from "../../store/flowStore";

interface ConditionalNodeData {
  script: string;
  error: null | string;
  isDone: null | boolean;
  isError: null | boolean;
  [key: string]: unknown;
}

type ConditionalNodeType = Node<ConditionalNodeData, "conditionalNode">;

const DEFAULT_SCRIPT = "function edit(data) {}";

const ConditionalNode: React.FC<NodeProps<ConditionalNodeType>> = ({ data, isConnectable }) => {
  const nodeId = useNodeId();
  const { setNodes, getEdges, deleteElements, getNode, setEdges} = useReactFlow();

  const [opened, setOpened] = useState(false);
  const [scriptText, setScriptText] = useState<string>(data?.script ?? DEFAULT_SCRIPT);

  const addDeleted = useDeletedNodesStore((s) => s.addDeleted);

  const { bgColor, borderColor } = useMemo(() => {
    if (data?.isError === true) {
      return { bgColor: "bg-red-900", borderColor: "border-red-400" };
    }
    if (data?.isDone === true) {
      return { bgColor: "bg-emerald-900", borderColor: "border-emerald-400" };
    }
    if (data?.isDone === null && data?.isError === null ) {
        return { bgColor: "bg-gray-900", borderColor: "border-yellow-400" };
    }
    return { bgColor: "bg-gray-900", borderColor: "border-yellow-400" };
  }, [data?.isError, data?.isDone]);

  const updateNodeData = useCallback(
    (newScript: string) => {
      if (!nodeId) return;
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...(node.data as ConditionalNodeData),
                  script: newScript,
                },
              }
            : node
        )
      );
    },
    [nodeId, setNodes]
  );

  const handleOpen = () => setOpened(true);

  const handleCancel = () => {
    // Khôi phục về script đã lưu
    setScriptText(data?.script ?? DEFAULT_SCRIPT);
    setOpened(false);
  };

  const handleSave = () => {
    const trimmed = scriptText?.trim();
    updateNodeData(trimmed.length ? trimmed : DEFAULT_SCRIPT);
    setOpened(false);
  };

  const handleDelete = useCallback(() => {
    if (!nodeId) return;

    const edges = getEdges();
    const { ids: toDelete, parentId } = collectDescendantsAndParent(nodeId, edges);
    if(parentId) {
      const parentPosition = getNode(parentId)?.position;
      if(parentPosition) {
        addDeleted(toDelete);
        const plustNodeID = generateUUID();
        deleteElements({
          nodes: toDelete.map((id) => ({ id })),
        });
        setNodes(nds => [
          ... nds,
          {
            id: plustNodeID,
            type: "plusNode",
            position: {x: parentPosition.x + 88, y: parentPosition.y + 160},
            data: {},
          },
        ]) 
        setEdges(eds => addEdge({ id: generateUUID(), source: parentId, target: plustNodeID, sourceHandle: null, targetHandle: null }, eds));
      }
    } else {
      toast.error("Can not delete node " + data.label)
    }
    setOpened(false);
  }, [nodeId, getEdges, getNode, addDeleted, deleteElements, setNodes, setEdges, data.label]);

  return (
    <>
      <div className="relative">
        {/* Handles for connections */}
        <Handle type="target" position={Position.Top} className="opacity-0" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Bottom} className="opacity-0" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Right} className="opacity-0" isConnectable={isConnectable} />
        <Handle type="target" position={Position.Left} className="opacity-0" isConnectable={isConnectable} />

        {/* Node content */}
        <div
          className={`${bgColor} border-2 ${borderColor} rounded-lg px-4 py-3 min-w-52 hover:bg-gray-700 transition-colors cursor-pointer`}
          onClick={handleOpen}
          title="Edit script"
        >
          <div className="flex gap-3 items-center">
            <GitBranch className="text-white"/>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{data?.label as React.ReactNode}</div>
              <div className="text-gray-400 text-xs truncate">
                CONDITIONAL-NODE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: edit script */}
      <Modal
        opened={opened}
        onClose={handleCancel}
        title="Edit Script"
        centered
        size="lg"
        overlayProps={{ backgroundOpacity: 0.6, blur: 4, color: "#000" }}
      >
        <Stack gap="md">
          <Textarea
            label="Script to return a boolean value"
            placeholder="Nhập script của bạn..."
            autosize
            minRows={8}
            maxRows={20}
            value={scriptText}
            onChange={(e) => setScriptText(e.currentTarget.value)}
            styles={{
              input: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" },
            }}
          />
          <Text c={"red"}>
              {data?.error}
          </Text>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="filled" color="red" onClick={handleDelete}>
              Delete
            </Button>
            <Button color="violet" onClick={handleSave}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default ConditionalNode;
