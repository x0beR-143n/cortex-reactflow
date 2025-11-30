import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { SquareMenu } from 'lucide-react';
import type { FieldData } from '../ui/StartNodeRunModal';

interface StartNodeData {
  fields: FieldData[];
  [key: string]: unknown;
}

type StartNodeType = Node<StartNodeData>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StartNode: React.FC<NodeProps<StartNodeType>> = ({ data, isConnectable }) => {

  return (
    <div className="relative">
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="opacity-0" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} className="opacity-0" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} className="opacity-0" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} className="opacity-0" isConnectable={isConnectable} />

      {/* Content */}
      <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg px-4 py-3 min-w-52 hover:bg-gray-700 transition-colors cursor-default nodrag nopan">
        <div className="flex items-center gap-3">
          <SquareMenu className="text-white" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-white text-sm font-medium">start-node</div>
            </div>
            <div className="text-gray-400 text-xs">START-NODE</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartNode;
