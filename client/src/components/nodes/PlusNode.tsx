import { useState } from 'react';
import { Modal, Button, Stack, TextInput } from '@mantine/core';
import {
  addEdge,
  Handle, Position, 
  useReactFlow, 
  type NodeProps,
} from '@xyflow/react';
import { Plus, GitBranch, Code2, SquareTerminal, Bot } from 'lucide-react';
import { generateUUID } from '../../utils/uuid';

export default function PlusNode({id,  isConnectable }: NodeProps) {
  const [opened, setOpened] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const { getNode, getEdges, setNodes, setEdges } = useReactFlow();
  
  /* 
  Cac action can lam: 
  - Duyet qua mang tim PLusNode de lay vi tri, roi set cho no 1 vi tri moi la y + 100
  - Tao 1 node moi co vi tri bang vi tri cua plus node 
  - Xoa edge co target la plus node -> Luu lai source node nay
  - Tao edge moi co source la source node vua luu, target la node moi tao
  - Tao 1 egde moi co source la node vua tao, target la plus node
  */
  const onCreateNewNode = (nodeType: string) => {
    const uuid = generateUUID();
    const trimmed = newNodeLabel.trim();

    // Lấy vị trí hiện tại của PlusNode
    const me = getNode(id);
    const basePos = me?.position ?? {x : 0, y: 0};

    // Dich Plusnode xuong y + 100
    setNodes(nds =>
      nds.map(n =>
        n.id === id
          ? { ...n, position: { x: basePos.x, y: basePos.y + 150 } }
          : n
      )
    );

    // Tao 1 node moi tai vi tri cua Plusnode
    setNodes(nds => [
      ... nds,
      {
        id: uuid,
        type: nodeType,
        position: {x: basePos.x - 89, y: basePos.y},
        data: {label: trimmed, error: null, isDone: null, isError: null},
      },
    ])

    // Xoa edge co target la plusnode va luu lai id cua source
    const edges = getEdges();
    const incoming = edges.find(e=> e.target === id);
    const sourceSaved = incoming?.source;

    setEdges(eds => eds.filter(e => e.target !== id));

    // them canh moi la sourceSaved => newnode
    if (sourceSaved) {
      setEdges(eds => addEdge({ id: generateUUID(), source: sourceSaved, target: uuid, sourceHandle: null, targetHandle: null }, eds));
    }

    // Thêm edge newNode -> plusNode
    setEdges(eds => addEdge({ id: generateUUID(), source: uuid, target: id, sourceHandle: null, targetHandle: null }, eds));
    
    // Reset state & đóng modal
    setOpened(false);
    setNewNodeLabel('');
  }

  /* 
  Cac action can lam khi tao node conditional
  - xoa plus node hien tai va canh link voi plus node
  - chen conditional node vao vi tri hien tai cua plus node
  - tao 2 script node moi, id cua moi cai la id cua conditionalnode id - false va conditonalnode id - true voi vi tri la x - 100 va x + 100 con y +150 ca 2 cai
  - tao 2 edge moi co cung source la conditional node va target la 2 script node moi tao
  - tao tiep 2 edge nua moi 1 script node vua tao link den 1 plus node moi
  */
  const onCreateNewNodeConditional = (nodeType: string) => {
    const uuid = generateUUID();
    const trimmed = newNodeLabel.trim();

    const me = getNode(id);
    const basePos = me?.position ?? {x: 0, y: 0};

    // Xoa edge co target la plusnode va luu lai id cua source
    const edges = getEdges();
    const incoming = edges.find(e=> e.target === id);
    const sourceSaved = incoming?.source;

    // xoa di plus node hien tai va canh link voi plus node
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.target !== id));

    // chen conditional node vao plus node hien tai
    setNodes(nds => [
      ... nds,
      {
        id: uuid,
        type: nodeType,
        position: {x: basePos.x - 89, y: basePos.y},
        data: {label: trimmed, error: null, isDone: null, isError: null},
      },
    ])

    // them canh moi la sourceSaved => newnode
    if (sourceSaved) {
      setEdges(eds => addEdge({ id: generateUUID(), source: sourceSaved, target: uuid, sourceHandle: null, targetHandle: null }, eds));
    }

    // them 2 script node moi vao mang node
    const false_node_id =  generateUUID();
    const true_node_id = generateUUID();
    
    setNodes(nds => [
      ... nds,
      {
        id: false_node_id,
        type: "scriptNode",
        position: {x: basePos.x - 267, y: basePos.y + 150},
        data: {label: trimmed + "-false", error: null, isDone: null, isError: null},
      },
      {
        id: true_node_id,
        type: "scriptNode",
        position: {x: basePos.x + 89, y: basePos.y + 150},
        data: {label: trimmed + "-true", error: null, isDone: null, isError: null},
      },
    ])

    // thêm edge từ conditional -> 2 script node
    setEdges(eds => addEdge({ id: generateUUID(), source: uuid, target: false_node_id, sourceHandle: null, targetHandle: null, data: { branch: 'false' }}, eds));
    setEdges(eds => addEdge({ id: generateUUID(), source: uuid, target: true_node_id,  sourceHandle: null, targetHandle: null, data: { branch: 'true' }}, eds));

    // tạo 2 plus node mới dưới 2 script node
    const false_plus_id = generateUUID();
    const true_plus_id  = generateUUID();

    setNodes(nds => [
      ... nds,
      {
        id: false_plus_id,
        type: "plusNode",
        position: {x: basePos.x - 267 + 89, y: basePos.y + 300},
        data: {},
      },
      {
        id: true_plus_id,
        type: "plusNode",
        position: {x: basePos.x + 89 + 89, y: basePos.y + 300},
        data: {},
      },
    ])

    // nối 2 script node với plus node tương ứng
    setEdges(eds => addEdge({ id: generateUUID(), source: false_node_id, target: false_plus_id, sourceHandle: null, targetHandle: null }, eds));
    setEdges(eds => addEdge({ id: generateUUID(), source: true_node_id,  target: true_plus_id,  sourceHandle: null, targetHandle: null }, eds));

    // Reset state & đóng modal
    setOpened(false);
    setNewNodeLabel('');
  }

  return (
    <>
      <div className="relative">
        <Handle type="target" position={Position.Top} className="opacity-0" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Bottom} className="opacity-0" isConnectable={isConnectable} />
        <Handle type="source" position={Position.Right} className="opacity-0" isConnectable={isConnectable} />
        <Handle type="target" position={Position.Left} className="opacity-0" isConnectable={isConnectable} />

        <div
          className="w-8 h-8 bg-gray-900 border-2 border-cyan-400 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
          onClick={() => setOpened(true)}
          title="Add new node"
        >
          <Plus className="text-white" size={16} />
        </div>
      </div>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="New node"
        centered
        size="sm"
        overlayProps={{ backgroundOpacity: 0.6, blur: 4, color: '#000' }}
      >
        <Stack gap="sm">
          <TextInput
            label="Enter label for your node"
            placeholder="Input node label"
            value={newNodeLabel}
            onChange={(event) => setNewNodeLabel(event.currentTarget.value)}
          />
          <Button
            fullWidth
            variant="subtle"
            className="justify-start bg-gray-800/60 hover:bg-gray-800 border border-gray-700"
            leftSection={<GitBranch size={18} />}
            onClick={() => {onCreateNewNodeConditional('conditionalNode')}}
          >
            Conditional
          </Button>

          <Button
            fullWidth
            variant="subtle"
            className="justify-start bg-gray-800/60 hover:bg-gray-800 border border-gray-700"
            leftSection={<Code2 size={18} />}
            onClick={() => {onCreateNewNode('scriptNode')}}
          >
            Script
          </Button>

          <Button
            fullWidth
            variant="subtle"
            className="justify-start bg-gray-800/60 hover:bg-gray-800 border border-gray-700"
            leftSection={<Bot size={18} />}
            onClick={() => {onCreateNewNode('aiNode')}}
          >
            AI
          </Button>

          <Button
            fullWidth
            variant="subtle"
            className="justify-start bg-gray-800/60 hover:bg-gray-800 border border-gray-700"
            leftSection={<SquareTerminal size={18} />}
            onClick={() => {onCreateNewNode('outputNode')}}
          >
            Output
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
