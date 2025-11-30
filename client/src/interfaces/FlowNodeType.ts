export interface FlowNode {
    id: string;
    flow_id: string;
    label: string;
    nodeType: string;
    position: Record<string, unknown>;
    data: Record<string, unknown>;
}