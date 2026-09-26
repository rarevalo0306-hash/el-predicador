import { maskName } from "./privacy.ts";
import type { AdminOverview } from "./admin.ts";

type RegistrationRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  locale: string;
  created_at: string | Date;
};

type UserRow = { id: string; name: string | null; email: string; createdAt: string | Date };

/**
 * What the Admin tab receives. The owner gets everything; a manager gets
 * shortened names only ("Ana M. L."), with no email, phone or address, so
 * those never leave the server for them.
 */
export function shapeOverview(input: {
  owner: boolean;
  registrations: RegistrationRow[];
  users: UserRow[];
  peopleByUser: Map<string, number>;
  schedulesByUser: Map<string, number>;
  roleOf: (id: string) => "owner" | "manager" | null;
}): AdminOverview {
  const masked = !input.owner;
  const iso = (value: string | Date) => new Date(value).toISOString();
  return {
    registrations: input.registrations.map((row) => ({
      id: row.id,
      name: masked ? maskName(row.name) : row.name,
      email: masked ? "" : row.email,
      phone: masked ? "" : row.phone,
      address: masked ? "" : row.address,
      locale: row.locale,
      createdAt: iso(row.created_at),
    })),
    accounts: input.users.map((row) => ({
      id: row.id,
      name: masked ? maskName(row.name ?? "") : (row.name ?? ""),
      email: masked ? "" : row.email,
      createdAt: iso(row.createdAt),
      people: input.peopleByUser.get(row.id) ?? 0,
      schedules: input.schedulesByUser.get(row.id) ?? 0,
      role: input.roleOf(row.id),
    })),
    owner: input.owner,
    masked,
  };
}
