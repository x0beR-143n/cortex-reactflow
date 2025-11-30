import type { FlowEdge } from "./FlowEdgeType";
import type { FlowNode } from "./FlowNodeType";

export interface Flow {
    id: string;
    name: string;
    description: string;
    status: "active" | "inactive";
    created_at: Date;
    updated_at: Date;
    nodes: FlowNode[] | [];
    edges: FlowEdge[] | [];
}


