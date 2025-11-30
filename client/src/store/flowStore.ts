import { create } from "zustand"

type DeletedNodesState = {
  // set các nodeId đã xoá trong phiên hiện tại
  deletedNodeIds: Set<string>

  // Thêm 1 hoặc nhiều nodeId vào danh sách xoá 
  addDeleted: (ids: string[] | string) => void

  // Lấy mảng id để gửi API 
  toArray: () => string[]

  // Reset sau khi Save thành công 
  clear: () => void
}

export const useDeletedNodesStore = create<DeletedNodesState>((set, get) => ({
  deletedNodeIds: new Set<string>(),

  addDeleted: (ids) =>
    set((s) => {
      const arr = Array.isArray(ids) ? ids : [ids]
      for (const id of arr) s.deletedNodeIds.add(id)
      return s
    }),

  toArray: () => Array.from(get().deletedNodeIds),

  clear: () => set({ deletedNodeIds: new Set<string>() }),
}))

/** Dùng ngoài React component khi cần */
export const getDeletedNodeIds = () =>
  Array.from(useDeletedNodesStore.getState().deletedNodeIds)
