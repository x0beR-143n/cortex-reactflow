import { Card, Group, Stack, Text, Badge, ActionIcon, Divider, Tooltip, Box } from "@mantine/core";
import { Info, GitBranch, Boxes, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Flow } from "../../interfaces/FlowType"; // chỉnh lại path nếu khác
import { formatFull } from "../../utils/day";

type Props = {
  flow: Flow;
};


export default function FlowInfoCard({ flow }: Props) {
  const navigate = useNavigate();

  const nodeCount = flow.nodes?.length ?? 0;
  const edgeCount = flow.edges?.length ?? 0;

  const COLORS = {
    bgGradient: "linear-gradient(180deg, #111418 0%, #171B21 100%)",
    border: "#2A2F37",
    hoverShadow: "0 0 18px rgba(0,0,0,0.45)",
    text: "#E8EAED",
    textDim: "#A7ADB7",
    chipBorder: "#343A46",
    chipBg: "#1B2027",
    success: "#10B981", // Active
    inactive: "#6B7280", // Inactive
  } as const;

  const statusStyles =
    flow.status === "active"
      ? { background: COLORS.success, color: "#052d22" }
      : { background: COLORS.inactive, color: "#0f1115" };

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        width: 360,
        backdropFilter: "blur(6px)",
        background: COLORS.bgGradient,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.text,
        transition: "box-shadow 0.25s ease-in-out",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = COLORS.hoverShadow;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group gap="xs">
          {/* Back button */}
          <Tooltip label="Back">
            <ActionIcon
              variant="subtle"
              aria-label="back"
              onClick={() => navigate("/")}
              style={{ color: COLORS.text }}
            >
              <ArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>

        <Group gap="6">
          <Info size={18} />
          <Text fw={700} size="sm" style={{ color: COLORS.textDim }}>
            Flow overview
          </Text>
        </Group>
        </Group>
      </Group>

      {/* Title + status */}
      <Group justify="space-between" align="center">
        <Text fw={800} size="lg" lineClamp={1}>
          {flow.name}
        </Text>
        <Badge
          variant="filled"
          radius="sm"
          style={{
            ...statusStyles,
            textTransform: "capitalize",
            padding: "2px 8px",
          }}
        >
          {flow.status}
        </Badge>
      </Group>

      {/* Description */}
      {flow.description && (
        <Text mt={6} size="sm" style={{ color: COLORS.textDim }} lineClamp={3}>
          {flow.description}
        </Text>
      )}

      <Divider my="sm" style={{ borderColor: COLORS.border }} />

      {/* Stats */}
      <Group gap="sm" wrap="nowrap">
        <Box
          style={{
            flex: 1,
            borderRadius: 8,
            padding: "10px 12px",
            border: `1px solid ${COLORS.chipBorder}`,
            background: COLORS.chipBg,
          }}
        >
          <Group gap={8}>
            <Boxes size={18} />
            <Text size="xs" style={{ color: COLORS.textDim }}>
              Nodes
            </Text>
          </Group>
          <Text mt={4} fw={700}>
            {nodeCount}
          </Text>
        </Box>

        <Box
          style={{
            flex: 1,
            borderRadius: 8,
            padding: "10px 12px",
            border: `1px solid ${COLORS.chipBorder}`,
            background: COLORS.chipBg,
          }}
        >
          <Group gap={8}>
            <GitBranch size={18} />
            <Text size="xs" style={{ color: COLORS.textDim }}>
              Edges
            </Text>
          </Group>
          <Text mt={4} fw={700}>
            {edgeCount}
          </Text>
        </Box>
      </Group>

      {/* Dates */}
      <Stack gap={6} mt="sm">
        <Group gap={6} style={{ color: COLORS.textDim }}>
          <Clock size={16} />
          <Text size="xs">Created:</Text>
          <Text size="xs" fw={600} style={{ color: COLORS.text }}>
            {formatFull(flow.created_at)}
          </Text>
        </Group>
        <Group gap={6} style={{ color: COLORS.textDim }}>
          <Clock size={16} />
          <Text size="xs">Updated:</Text>
          <Text size="xs" fw={600} style={{ color: COLORS.text }}>
            {formatFull(flow.updated_at)}
          </Text>
        </Group>
        <Text size="xs" style={{ color: COLORS.textDim }} mt={2} title={flow.id}>
          ID: <Text span fw={600} style={{ color: COLORS.text }}>{flow.id}</Text>
        </Text>
      </Stack>
    </Card>
  );
}
