import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/play")({
  component: () => <div style={{ padding: 24 }}>Play — coming next</div>,
});
