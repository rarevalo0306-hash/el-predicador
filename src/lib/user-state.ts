import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { CloudPayload } from "@/lib/store";
import { parsePayload } from "@/lib/user-state-parse";

export const getMyState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string }>`
      select payload from preacher_state where user_id = ${context.userId} limit 1
    `;
    return parsePayload(rows[0]?.payload);
  });

const MAX_CLOUD_BYTES = 200_000;

export const saveMyState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CloudPayload) => {
    if (!data || typeof data !== "object") {
      throw new Error("invalid payload");
    }
    const payload = JSON.stringify(data);
    if (payload.length > MAX_CLOUD_BYTES) {
      throw new Error("payload too large");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const normalized = parsePayload(JSON.stringify(data)) ?? data;
    const payload = JSON.stringify(normalized);
    if (payload.length > MAX_CLOUD_BYTES) {
      throw new Error("payload too large");
    }
    await sql`
      insert into preacher_state (user_id, payload, updated_at)
      values (${context.userId}, ${payload}, now())
      on conflict (user_id)
      do update set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true as const };
  });
