/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FieldData, FieldType } from "../components/ui/StartNodeRunModal";
import type { Edge, Node } from "@xyflow/react";
import type { FlowNode } from "../interfaces/FlowNodeType";
import type { FlowEdge } from "../interfaces/FlowEdgeType";

export function objectToFields(obj?: Record<string, unknown> | null): FieldData[] {
  if (!obj || typeof obj !== "object") return [];

  return Object.entries(obj).filter(([key]) => key !== "label")
  .map(([key, value]) => {
    let type: FieldType = "string";
    let v: string | number | boolean = "";

    if (typeof value === "number") {
      type = "number";
      v = value;
    } else if (typeof value === "boolean") {
      type = "boolean";
      v = value;
    } else {
      type = "string";
      v = String(value ?? "");
    }

    return { key, type, value: v };
  });
}

export function toXY(pos: Record<string, unknown>) {
    // chấp nhận các trường hợp: object hợp lệ, json string, null
    if (pos && typeof pos === 'object' && typeof pos.x === 'number' && typeof pos.y === 'number') {
    return { x: pos.x, y: pos.y };
    }
    if (typeof pos === 'string') {
    try {
        const p = JSON.parse(pos);
        if (p && typeof p.x === 'number' && typeof p.y === 'number') return { x: p.x, y: p.y };
    } catch { /* empty */ }
    }
    return { x: 0, y: 0 }; // fallback
}

const fieldsToObject = (fs: FieldData[]) =>
    fs.reduce<Record<string, string | number | boolean>>((acc, cur) => {
      if (cur.key) acc[cur.key] = cur.value;
      return acc;
    }, {});

/** ---- NEW: helper loại bỏ field session ---- */
function stripSessionFields(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const { error, isDone, isError, ...rest } = data as Record<string, unknown>;
  return rest;
}

/** ---- convert nodes (lọc error/isDone/isError ở data) ---- */
export function convertReactFlowNodes(nodes: Node[], flow_id: string): FlowNode[] {
  return nodes.map((n) => {
    // startNode: chuyển fields[] => object
    if (n.type === "startNode") {
      const fields = (n.data as any)?.fields || [];
      const dataObj = fieldsToObject(fields);
      return {
        id: n.id,
        flow_id,
        label: "start-node",
        nodeType: n.type,
        position: n.position ? toXY(n.position as any) : { x: 0, y: 0 },
        data: dataObj, // start-node không có 3 field session nên giữ nguyên
      };
    }

    // node khác: lọc 3 field session khỏi data
    const rawData = (n.data && typeof n.data === "object") ? n.data : {};
    const cleanData = stripSessionFields(rawData);

    return {
      id: n.id,
      flow_id,
      label: (n.data as any)?.label ?? "",
      nodeType: n.type ?? "",
      position: n.position ? toXY(n.position as any) : { x: 0, y: 0 },
      data: cleanData,
    };
  });
}

export function convertReactFlowEdges(edges: Edge[], flow_id: string): FlowEdge[] {
  return edges.map((e) => ({
    id: e.id,
    flow_id: flow_id,
    data: (e.data && typeof e.data === "object") ? e.data : {},
    source_node_id: e.source,
    target_node_id: e.target,
  }));
}