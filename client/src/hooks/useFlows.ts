import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFlows, getFlowById, saveFlow, saveFlowWithDeletion } from "../api/flow";
import type { Flow } from "../interfaces/FlowType";
import type { FlowNode } from "../interfaces/FlowNodeType";
import type { FlowEdge } from "../interfaces/FlowEdgeType";

export const useFlows = () =>
  useQuery<Flow[]>({
    queryKey: ["flows"],
    queryFn: getFlows,
  });

export const useFlow = (id: string | undefined) =>
  useQuery<Flow>({
    queryKey: ["flow", id],
    queryFn: () => getFlowById(id!),
    enabled: !!id,
  });

type SaveVars = { convertedNodes: FlowNode[]; convertedEdges: FlowEdge[] };

export const useSaveFlow = () => {
  const qc = useQueryClient();

  return useMutation<{ ok: boolean }, Error, SaveVars>({
    mutationFn: ({ convertedNodes, convertedEdges }) => saveFlow(convertedNodes, convertedEdges),

    onSuccess: (_res, vars) => {
      const flowId = vars.convertedNodes?.[0]?.flow_id ?? vars.convertedEdges?.[0]?.flow_id;
      // refresh flow detail (nếu đang mở) và list flows
      if (flowId) qc.invalidateQueries({ queryKey: ["flow", flowId] });
      qc.invalidateQueries({ queryKey: ["flows"] });
    },
  });
};

type SaveWithDeletionVars = {
  convertedNodes: FlowNode[];
  convertedEdges: FlowEdge[];   
  toDelete: string[];           
};

export const useSaveFlowWithDeletion = () => {
  const qc = useQueryClient();

  return useMutation<{ ok: boolean }, Error, SaveWithDeletionVars>({
    mutationFn: ({ convertedNodes, convertedEdges, toDelete }) =>
      saveFlowWithDeletion(convertedNodes, convertedEdges, toDelete),

    onSuccess: (_res, vars) => {
      const flowId =
        vars.convertedNodes?.[0]?.flow_id ??
        vars.convertedEdges?.[0]?.flow_id;

      if (flowId) qc.invalidateQueries({ queryKey: ["flow", flowId] });
      qc.invalidateQueries({ queryKey: ["flows"] });
    },
  });
};