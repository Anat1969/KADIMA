import { STATUS_MAP } from "@/lib/constants";
import type { TaskStatus } from "@/lib/types";

export default function Badge({ status }: { status: TaskStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span className={"inline-block px-2 py-0.5 rounded text-xs font-medium " + s.fg + " " + s.bg}>
      {s.label}
    </span>
  );
}
