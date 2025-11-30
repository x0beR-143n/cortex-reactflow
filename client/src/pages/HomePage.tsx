import { Link } from "react-router-dom";
import { useFlows } from "../hooks/useFlows";
import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  Anchor,
  Box,
} from "@mantine/core";
import { formatRelative } from "../utils/day";

export default function HomePage() {
  const { data, isLoading, isError, error, refetch } = useFlows();

  if (isLoading) {
    return (
    <Box
      h="100vh"
      bg="black"
      display="flex"
			style={{
				justifyContent: "center",
				alignItems: "center",
			}}
    >
      <Loader color="violet" />
    </Box>
    );
  }

  if (isError) {
    return (
    <Box
			h="100vh"
			bg="black"
			c="white"
			display="flex"
			style={{
				justifyContent: "center",
				alignItems: "center",
				flexDirection: "column",
			}}
    >
			<Text c="red">{error?.message ?? "Failed to load flows"}</Text>
			<Button variant="light" color="violet" onClick={() => refetch()}>
					Try again
			</Button>
    </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Stack align="center" mt="lg" c="white">
        <Text c="dimmed">No flows yet</Text>
        <Button variant="light" color="violet" onClick={() => refetch()}>
          Reload
        </Button>
      </Stack>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0C0F2F] to-black p-6">
      <Stack gap="md" w={"85%"} m={"auto"}>
        <Group justify="space-between">
          <Title order={3} c="violet.4">
            Flows
          </Title>
          <Button variant="light" color="violet" onClick={() => refetch()}>
            Refresh
          </Button>
        </Group>

        <Stack gap="md">
          {data.map((f) => (
            <Card
              key={f.id}
              radius="lg"
              p="md"
              className="border border-[#222] shadow-lg transition-transform duration-300 hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(94, 33, 255, 0.25) 0%, rgba(0, 212, 255, 0.15) 100%)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Group justify="space-between" align="start">
                <div>
                  <Anchor
                    component={Link}
                    to={`/flow/${f.id}`}
                    fw={600}
                    fz="lg"
                    c="white"
                  >
                    {f.name}
                  </Anchor>
                  <Text c="gray.4" size="sm" lineClamp={1}>
                    {f.description}
                  </Text>
                </div>

                <Badge
                  color={f.status === "active" ? "teal" : "gray"}
                  variant="light"
                >
                  {f.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </Group>

              <Group gap="xl" mt="sm">
                <Text size="sm" c="gray.5">
                  Created: {formatRelative(f.created_at)}
                </Text>
                <Text size="sm" c="gray.5">
                  Updated: {formatRelative(f.updated_at)}
                </Text>

                <Button
                  ml="auto"
                  size="xs"
                  variant="gradient"
                  gradient={{ from: "violet", to: "cyan" }}
                  component={Link}
                  to={`/flow/${f.id}`}
                >
                  Open
                </Button>

                <Button
                  size="xs"
                  variant="gradient"
                  gradient={{ from: "red", to: "red" }}
                >
                  Delete
                </Button>
              </Group>
            </Card>
          ))}
        </Stack>
      </Stack>
    </div>
  );
}
