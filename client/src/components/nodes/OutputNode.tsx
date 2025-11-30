import type React from "react";
import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import { SquareTerminal } from "lucide-react";

const OutputNode: React.FC<NodeProps> = ({ data, isConnectable }) => {

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
          className="bg-gray-900 border-2 border-pink-400 rounded-lg px-4 py-3 min-w-52 hover:bg-gray-700 transition-colors cursor-pointer"
          title="Edit script"
        >
          <div className="flex items-center gap-3">
            <SquareTerminal className="text-white" />
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{data?.label as React.ReactNode}</div>
              <div className="text-gray-400 text-xs truncate">
                OUTPUT-NODE
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OutputNode;
