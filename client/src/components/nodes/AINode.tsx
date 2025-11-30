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
import { Modal, Textarea, Button, Stack, Group, TextInput, Text} from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import { Bot } from "lucide-react";
import { collectDescendantsAndParent } from "../../utils/flow";
import { generateUUID } from "../../utils/uuid";
import toast from "react-hot-toast";
import { useDeletedNodesStore } from "../../store/flowStore";

interface AINodeData {
  script: string;
  result_field: string;
  error: null | string;
  isDone: null | boolean;
  isError: null | boolean;
  [key: string]: unknown;
}

type AINodeType = Node<AINodeData, "scriptNode">;

const AINode: React.FC<NodeProps<AINodeType>> = ({ data, isConnectable }) => {
  const nodeId = useNodeId();
  const { setNodes, getEdges, deleteElements, getNode, setEdges} = useReactFlow();

  const [opened, setOpened] = useState(false);
  const [scriptText, setScriptText] = useState<string>(data?.script ?? "");
  const [fieldName, setFieldName] = useState<string>(data?.result_field ?? "");

  const addDeleted = useDeletedNodesStore((s) => s.addDeleted);

  // Chọn màu border theo trạng thái

  const { bgColor, borderColor } = useMemo(() => {
    if (data?.isError === true) {
      return { bgColor: "bg-red-900", borderColor: "border-red-400" };
    }
    if (data?.isDone === true) {
      return { bgColor: "bg-emerald-900", borderColor: "border-emerald-400" };
    }
    if (data?.isDone === null && data?.isError === null ) {
        return { bgColor: "bg-gray-900", borderColor: "border-orange-400" };
    }
    return { bgColor: "bg-gray-900", borderColor: "border-orange-400" };
  }, [data?.isError, data?.isDone]);

  const updateNodeData = useCallback(
    (newScript: string, fieldname: string) => {
      if (!nodeId) return;
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...(node.data as AINodeData),
                  script: newScript,
                  result_field: fieldname,
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
    setScriptText(data?.script ?? "");
    setFieldName(data?.result_field ?? ""); 
    setOpened(false);
  };

  const handleSave = () => {
    const trimmed = scriptText?.trim();
    const fieldnametrimmed = fieldName?.trim();
    updateNodeData(trimmed.length ? trimmed : "", fieldnametrimmed.length ? fieldnametrimmed : "");
    setOpened(false);
  };

  const handleDelete = useCallback(() => {
    if (!nodeId) return;

    const edges = getEdges();
    const { ids: toDelete, parentId } = collectDescendantsAndParent(nodeId, edges);
    if(parentId) {
      addDeleted(toDelete);
      const parentPosition = getNode(parentId)?.position;
      if(parentPosition) {
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
  }, [nodeId, getEdges, addDeleted, getNode, deleteElements, setNodes, setEdges, data.label]);

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
            <Bot className="text-white"/>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{data?.label as React.ReactNode}</div>
              <div className="text-gray-400 text-xs truncate">
                AI-NODE
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
            label="Tell AI to do something with your data"
            placeholder="Prompt your script here"
            autosize
            minRows={5}
            maxRows={10}
            value={scriptText}
            onChange={(e) => setScriptText(e.currentTarget.value)}
          />
          <TextInput
            label="Field name"
            description="Decide the field where the result will be stored"
            placeholder=""
            onChange={(event) => setFieldName(event.currentTarget.value)}
            value={fieldName}
          />
          <Text c={"red"}>
              {data?.error}
          </Text>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="filled" color="red" onClick={handleDelete}>Delete</Button>
             <Button color="violet" onClick={handleSave}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default AINode;
