import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { ScheduleInput } from "@/lib/message-schedule";

export const getMessageSchedules = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listSchedules } = await import("./messaging/schedules.server");
    return listSchedules(context.userId);
  });

export const saveMessageSchedule = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: ScheduleInput) => data)
  .handler(async ({ data, context }) => {
    const { saveSchedule } = await import("./messaging/schedules.server");
    return saveSchedule(context.userId, data);
  });

export const setMessageScheduleEnabled = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; enabled: boolean }) => {
    if (!data || typeof data.id !== "string" || typeof data.enabled !== "boolean")
      throw new Error("scheduleInvalid");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { setScheduleEnabled } = await import("./messaging/schedules.server");
    return setScheduleEnabled(context.userId, data.id, data.enabled);
  });
