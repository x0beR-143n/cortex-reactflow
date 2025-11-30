export interface FlowEdge {
    id: string;
    flow_id: string;
    data: Record<string, unknown>;
    source_node_id: string;
    target_node_id: string;
}