import { createFileRoute } from "@tanstack/react-router";
import { completeNativeAuth } from "@/lib/auth/native-auth.server";
export const Route = createFileRoute("/api/native-auth/complete")({
  server: { handlers: { GET: ({ request }) => completeNativeAuth(request) } },
});
