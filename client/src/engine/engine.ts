import type { Edge, Node } from "@xyflow/react";
import { runConditionNode, runScriptNode } from "./nodeRunner";

export type FlowEvents = {
  onStart?: (nodeId: string) => void;
  onDone?: (nodeId: string) => void;
  onError?: (nodeId: string, error: unknown) => void;
  onEdgeTraverse?: (edgeId: string) => void;
};

export type RunOptions = {
  stepLimit?: number;
  parseJsonValues?: boolean; // parse "14" -> 14, "true" -> true, '{"a":1}' -> object
  timeoutMs?: number;      
};

export type RunResult = { data: unknown; endNodeId: string | null };

function parseMaybeJSON(v: string): unknown {
  try { return JSON.parse(v); } catch { return v; }
}

function fieldsToObject(fields?: { key: string; value: string }[], parse = true): Record<string, unknown> {
  return (fields ?? []).reduce((acc, f) => {
    if (!f?.key) return acc;
    acc[f.key] = parse ? parseMaybeJSON(f.value) : f.value;
    return acc;
  }, {} as Record<string, unknown>);
}

function getNodeById(nodes: Node[], id?: string | null): Node | null {
  return id ? (nodes.find(n => n.id === id) ?? null) : null;
}

// tim tat ca cac canh co source = fromID
function outgoing(edges: Edge[], fromId: string): Edge[] {
  return edges.filter(e => e.source === fromId);
}

// Node bình thường: tim tat ca canh bat dau tu fromId, roi chon ra canh hop li nhat
function chooseNextNormal(edges: Edge[], fromId: string): Edge | undefined {
  const outs = outgoing(edges, fromId);
  return outs.find(e => !(e.data as { branch?: string })?.branch) ?? outs[0];
}

// Conditional: chọn edge có branch tương ứng
type BranchEdgeData = { branch?: string };

function chooseBranch(edges: Edge[], fromId: string, branch: 'true'|'false'): Edge | undefined {
  const outs = outgoing(edges, fromId);
  return outs.find(e => (e.data as BranchEdgeData)?.branch === branch);
}

export async function runFlow(snapshot: { nodes: Node[]; edges: Edge[] }, _events: FlowEvents = {}, options: RunOptions = {}): Promise<RunResult> {
  // limit
  const stepLimit = options.stepLimit ?? 100;
  const parse = options.parseJsonValues ?? true;

  // Tìm start node
  let current: Node | null = snapshot.nodes[0];
  if (!current) return { data: null, endNodeId: null };

  // Lấy object đầu vào từ StartNode.data.fields
  const fields = (current.data as Record<string, unknown>)?.fields as { key: string; value: string }[] | undefined;
  let data: Record<string, unknown> = fieldsToObject(fields, parse);

  let endNodeId: string | null = current.id;

  if (current.type === 'startNode') {
    const eFromStart = chooseNextNormal(snapshot.edges, current.id);
    if (!eFromStart) {
      console.warn("[RUN] No outgoing edge from start node.");
      return { data, endNodeId: current.id };
    }
    current = getNodeById(snapshot.nodes, eFromStart.target);
    endNodeId = current?.id ?? endNodeId;
  }

  // Vòng chạy: Script / Conditional / Output
  for (let steps = 0; steps < stepLimit && current; steps++) {

    if (current.type === "outputNode") {
      return { data, endNodeId: current.id };
    }

    if (current.type === "scriptNode") {
      try {
        const script = (current.data as Record<string, unknown>)?.script as string | undefined;
        data = await runScriptNode(script, data);
        _events.onDone?.(current.id); 
      } catch (err) {
        _events.onError?.(current.id, err); 
        throw err; 
      }
      const e = chooseNextNormal(snapshot.edges, current.id);
      if (!e) break;
      current = getNodeById(snapshot.nodes, e.target);
      endNodeId = current?.id ?? endNodeId;
      continue;
    }

    if (current.type === "conditionalNode") {
      const id = current.id;
      try {
        const script = (current.data as Record<string, unknown>)?.script as string | undefined;
        const ok = await runConditionNode(script, data);
        _events.onDone?.(current.id);
        const e = chooseBranch(snapshot.edges, current.id, ok ? 'true' : 'false');
        if (!e) throw new Error(`Conditional ${current.id} missing branch "${ok ? 'true' : 'false'}"`);
        current = getNodeById(snapshot.nodes, e.target);
        endNodeId = current?.id ?? endNodeId;
      } catch (err) {
        _events.onError?.(id, err); 
        throw err;
      }
      continue;
    }
  }

  // Nếu thoát vòng lặp mà chưa gặp outputNode
  console.warn("Flow ended without reaching outputNode. Last node:", endNodeId);
  return { data, endNodeId };
}
