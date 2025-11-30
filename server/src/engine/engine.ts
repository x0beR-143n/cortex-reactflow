// engine/engine.ts
import { CreateEdgeDto } from "src/edges/dto/create-edge.dto";
import { CreateFlownodeDto } from "src/flownode/dto/create-flownode.dto";
import { FlowNodeType } from "src/flownode/flownode.enum";
import { runScriptNode, runConditionNode, runAINode } from "./nodeRunner";

type JsonObj = Record<string, unknown>;

export type FlowProgressEvent =
  | { type: "run:started"; flowId?: string; startData: JsonObj }
  | { type: "node:started"; nodeId: string; nodeType: FlowNodeType; step: number }
  | { type: "node:succeeded"; nodeId: string; nodeType: FlowNodeType; step: number; data: JsonObj }
  | { type: "node:failed"; nodeId: string; nodeType: FlowNodeType; step: number; error: string }
  | { type: "run:finished"; status: "success" | "failed"; result?: JsonObj; error?: string };

export async function runFlow(
  nodes: CreateFlownodeDto[],
  edges: CreateEdgeDto[],
  opts?: { onEvent?: (e: FlowProgressEvent) => void }
): Promise<Record<string, any>> {
  const onEvent = opts?.onEvent ?? (() => {});

  if (!nodes?.length) {
    onEvent({ type: "run:finished", status: "failed", error: "nodes is empty" });
    throw new Error("nodes is empty");
  }

  const startNode =
    nodes[0]?.nodeType === FlowNodeType.startNode
      ? nodes[0]
      : nodes.find((n) => n.nodeType === FlowNodeType.startNode);

  if (!startNode) {
    onEvent({ type: "run:finished", status: "failed", error: "No start node found" });
    throw new Error("No start node found");
  }

  let data = startNode.data as JsonObj;
  if (!isObject(data)) {
    onEvent({ type: "run:finished", status: "failed", error: "start node data must be an object" });
    throw new Error("start node data must be an object");
  }

  onEvent({ type: "run:started", flowId: startNode.flow_id, startData: data });

  let current: CreateFlownodeDto | undefined = chooseNextNodeNormal(nodes, edges, startNode.id);
  const step_limit = 50;
  let steps = 0;

  while (current) {
    if (++steps > step_limit) {
      const err = `Exceeded stepLimit=${step_limit}`;
      onEvent({ type: "run:finished", status: "failed", error: err });
      throw new Error(err);
    }

    const nodeId = current.id;
    const nodeType = current.nodeType;

    try {
      onEvent({ type: "node:started", nodeId, nodeType, step: steps });

      switch (nodeType) {
        case FlowNodeType.scriptNode: {
          const script: string = current.data?.script as string;
          const out = await runScriptNode(script, data);
          data = out;
          onEvent({ type: "node:succeeded", nodeId, nodeType, step: steps, data: data });

          current = ensureNextOrThrow(chooseNextNodeNormal(nodes, edges, nodeId), nodeId);
          continue;
        }

        case FlowNodeType.conditionalNode: {
          const script: string = current.data?.script as string;
          const ok = await runConditionNode(script, data);

          onEvent({ type: "node:succeeded", nodeId, nodeType, step: steps, data: { ...data, __branch: ok } });

          current = ensureNextOrThrow(
            chooseNextNodeConditional(nodes, edges, nodeId, ok ? "true" : "false"),
            nodeId
          );
          continue;
        }

        case FlowNodeType.aiNode: {
          const prompt: string = (current.data?.script as string) ?? "";
          const resultField: string = (current.data?.result_field as string) ?? "";
          const out = await runAINode(data, prompt, resultField);
          data = out;
          onEvent({ type: "node:succeeded", nodeId, nodeType, step: steps, data: data });

          current = ensureNextOrThrow(chooseNextNodeNormal(nodes, edges, nodeId), nodeId);
          continue;
        }

        case FlowNodeType.outputNode: {
          onEvent({ type: "run:finished", status: "success", result: data });
          return data as Record<string, any>;
        }

        default: {
          // skip node lạ: vẫn báo succeed “nhảy qua”
          onEvent({ type: "node:succeeded", nodeId, nodeType, step: steps, data: data });
          current = chooseNextNodeNormal(nodes, edges, nodeId);
          if (!current) {
            const err = "Can not get next node";
            onEvent({ type: "run:finished", status: "failed", error: err });
            throw new Error(err);
          }
          continue;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onEvent({ type: "node:failed", nodeId, nodeType, step: steps, error: msg });
      onEvent({ type: "run:finished", status: "failed", error: `[FlowError][${nodeType}][${nodeId}] ${msg}` });
      throw new Error(`[FlowError][${nodeType}][${nodeId}] ${msg}`);
    }
  }

  onEvent({ type: "run:finished", status: "success", result: data });
  return data as Record<string, any>;
}

function chooseNextNodeNormal(nodes: CreateFlownodeDto[], edges: CreateEdgeDto[], currentNodeID: string) {
  const currentEdge = edges.find((edge) => edge.source_node_id === currentNodeID);
  const nextNodeID = currentEdge?.target_node_id;
  return nodes.find((node) => node.id === nextNodeID);
}

function chooseNextNodeConditional(
  nodes: CreateFlownodeDto[],
  edges: CreateEdgeDto[],
  currentNodeID: string,
  branch: string
) {
  const e = edges.find((edge) => edge.source_node_id === currentNodeID && edge.data?.branch === branch);
  const nextNodeID = e?.target_node_id;
  return nodes.find((node) => node.id === nextNodeID);
}

function isObject(v: any): v is JsonObj {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function ensureNextOrThrow<T>(n: T | undefined, currentId: string): T {
  if (!n) throw new Error(`Can not get next node - current id: ${currentId}`);
  return n;
}
