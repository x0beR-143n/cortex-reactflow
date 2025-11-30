import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("en");

export function formatRelative(date: Date | string): string {
  return dayjs(date).fromNow();
}

export function formatFull(date: Date | string, format = "YYYY-MM-DD HH:mm:ss"): string {
  return dayjs(date).format(format);
}
