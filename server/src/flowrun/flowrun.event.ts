export const FLOWRUN_EVENTS = {
  RUN_UPSERT: 'flowrun.upsert',   // khi tạo/cập nhật 1 bản ghi FlowRun
  RUN_DELETE: 'flowrun.delete',   // (nếu có xóa)
  RUN_PROGRESS: 'flowrun.progress',
  NODE_EVENT: 'flowrun.node',
  RUN_FINISHED: 'flowrun.finished',
} as const;