import { createFileRoute } from "@tanstack/react-router";
import { exchangeNativeAuth } from "@/lib/auth/native-auth.server";
export const Route = createFileRoute("/api/native-auth/exchange")({
  server: { handlers: { POST: ({ request }) => exchangeNativeAuth(request) } },
});
