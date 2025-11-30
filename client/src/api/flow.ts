import { api } from ".";
import type { FlowEdge } from "../interfaces/FlowEdgeType";
import type { FlowNode } from "../interfaces/FlowNodeType";
import type { Flow } from "../interfaces/FlowType";

export async function getFlows(): Promise<Flow[]> {
  const res = await api.get<Flow[]>("/flows");
  return res.data;
}

export async function getFlowById(id: string): Promise<Flow> {
  const res = await api.get<Flow>(`/flows/${id}`);
  return res.data;
}

export async function saveFlow(nodes: FlowNode[], edges: FlowEdge[]) {
  const saveGraphDTO = {nodes: nodes, edges: edges};
  try {
    const res = await api.post<{ ok: boolean }>("/flows/save", saveGraphDTO);
    return res.data; // { ok: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ??
      err?.message ??
      "Save flow failed";
    throw new Error(msg);
  }
}

export async function saveFlowWithDeletion(nodes: FlowNode[], edges: FlowEdge[], toDelete: string[]) {
  const saveFlowWithDeletionDTO = {nodes: nodes, edges: edges, node_id_delete: toDelete};
  try {
    const res = await api.post<{ ok: boolean }>("/flows/save-delete", saveFlowWithDeletionDTO);
    return res.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ??
      err?.message ??
      "Save flow failed";
    throw new Error(msg);
  }
}