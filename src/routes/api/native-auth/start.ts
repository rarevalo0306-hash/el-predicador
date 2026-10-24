import { createFileRoute } from "@tanstack/react-router";
import { startNativeAuth } from "@/lib/auth/native-auth.server";
export const Route = createFileRoute("/api/native-auth/start")({
  server: { handlers: { GET: ({ request }) => startNativeAuth(request) } },
});
