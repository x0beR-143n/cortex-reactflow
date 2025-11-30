import React from "react";
import { ActionIcon, Group, Paper, Text, Tooltip, ScrollArea, Code } from "@mantine/core";
import { X, CheckCircle2 } from "lucide-react";

type Props = {
  data: unknown | null;           // end data truyền vào
  onClose?: () => void;           // callback khi bấm đóng
  title?: string;                 // tuỳ chọn
};

const RunResultCard: React.FC<Props> = ({ data, onClose, title = "Run Result" }) => {
  if (data == null) return null;

  let pretty = "";
  try {
    // nếu server trả object - pretty print
    pretty = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  } catch {
    pretty = String(data);
  }

  return (
    <Paper
      shadow="lg"
      radius="md"
      p="sm"
      className="fixed bottom-4 right-4 z-50 max-w-[520px] w-[90vw] sm:w-[520px] bg-[#0b0b0b] border border-white/10"
    >
      <Group justify="space-between" align="center" mb="xs">
        <Group gap={8}>
          <CheckCircle2 size={18} className="text-green-400" />
          <Text fw={600} c="white">{title}</Text>
        </Group>
        <Tooltip label="Close">
          <ActionIcon variant="subtle" color="gray" onClick={onClose}>
            <X size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <ScrollArea.Autosize mah={260}>
        <Code
          block
          className="text-[12px] leading-5"
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {pretty}
        </Code>
      </ScrollArea.Autosize>
    </Paper>
  );
};

export default RunResultCard;
