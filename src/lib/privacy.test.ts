import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, maskName, maskPhone } from "./privacy.ts";

test("phones show only the country code and the last two digits", () => {
  assert.equal(maskPhone("+12015550101"), "+1 ••• ••• ••01");
  assert.equal(maskPhone("+525555550103"), "+52 ••• ••• ••03");
  assert.ok(!maskPhone("+12015550101").includes("555"));
  assert.equal(maskPhone(""), "••••");
});

test("names keep the first name and initials", () => {
  assert.equal(maskName("Ana María López"), "Ana M. L.");
  assert.equal(maskName("  José  "), "José");
  assert.equal(maskName("Lucía ángel"), "Lucía Á.");
  assert.equal(maskName(""), "");
});

test("CSV cells never start a formula and quotes are doubled", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell("+12015550101"), `"'+12015550101"`);
  assert.equal(csvCell("@SUM(1)"), `"'@SUM(1)"`);
  assert.equal(csvCell("-1"), `"'-1"`);
  assert.equal(csvCell("Ana"), `"Ana"`);
});

test("a manager's Admin tab carries shortened names and nothing else personal", async () => {
  const { shapeOverview } = await import("./admin-shape.ts");
  const input = {
    registrations: [
      {
        id: 1,
        name: "Ana María López",
        email: "ana@example.com",
        phone: "+12015550101",
        address: "Calle 1",
        locale: "es",
        created_at: "2026-09-26T00:00:00Z",
      },
    ],
    users: [
      {
        id: "u1",
        name: "Pedro Ruiz",
        email: "pedro@example.com",
        createdAt: "2026-09-26T00:00:00Z",
      },
    ],
    peopleByUser: new Map([["u1", 3]]),
    schedulesByUser: new Map<string, number>(),
    roleOf: () => null,
  };
  const manager = shapeOverview({ ...input, owner: false });
  assert.equal(manager.masked, true);
  assert.deepEqual(
    { ...manager.registrations[0], createdAt: undefined },
    {
      id: 1,
      name: "Ana M. L.",
      email: "",
      phone: "",
      address: "",
      locale: "es",
      createdAt: undefined,
    },
  );
  assert.equal(manager.accounts[0].name, "Pedro R.");
  assert.equal(manager.accounts[0].email, "");
  assert.ok(!JSON.stringify(manager).match(/example\.com|555|Calle|López|Ruiz/));

  const owner = shapeOverview({ ...input, owner: true });
  assert.equal(owner.masked, false);
  assert.equal(owner.registrations[0].phone, "+12015550101");
  assert.equal(owner.accounts[0].email, "pedro@example.com");
});
