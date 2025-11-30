import type { Edge } from "@xyflow/react";

/*
Thu thập các node con của 1 node theo hướng source -> target
- Bất đầu từ start id
- Duyệt theo cạnh edge.source -> edge.target
- Trả về 1 mảng nodeID gồm cả startID để xóa
*/
export function collectDescendantsAndParent(
  startId: string,
  edges: Edge[]
): { ids: string[]; parentId: string | null } {
  const outMap = new Map<string, string[]>(); // source -> [target...]
  const inMap  = new Map<string, string[]>(); // target -> [source...]

  for (const e of edges) {
    if (!outMap.has(e.source)) outMap.set(e.source, []);
    outMap.get(e.source)!.push(e.target);

    if (!inMap.has(e.target)) inMap.set(e.target, []);
    inMap.get(e.target)!.push(e.source);
  }

  // Lấy parentId (nếu có nhiều parent, lấy cái đầu tiên)
  const parents = inMap.get(startId) ?? [];
  const parentId = parents.length > 0 ? parents[0] : null;

  // Thu thập descendants (DFS stack), không cần visited vì đồ thị là DAG
  const ids: string[] = [];
  const stack: string[] = [startId];

  while (stack.length) {
    const id = stack.pop()!;
    ids.push(id);

    const children = outMap.get(id);
    if (children && children.length > 0) {
      for (const child of children) stack.push(child);
    }
  }

  return { ids, parentId };
} 