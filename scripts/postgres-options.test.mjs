import assert from "node:assert/strict";
import { X509Certificate } from "node:crypto";
import test from "node:test";
import pg from "pg";
import { postgresConnectionOptions, SUPABASE_ROOT_CA } from "./postgres-options.mjs";

test("pg retains the official CA and certificate verification with sslmode=require", () => {
  const raw = "postgresql://postgres.example:pass%40word%23@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&application_name=auth";
  const client = new pg.Client(postgresConnectionOptions(raw));
  assert.equal(client.connectionParameters.ssl.ca, SUPABASE_ROOT_CA);
  assert.equal(client.connectionParameters.ssl.rejectUnauthorized, true);
  assert.equal(client.connectionParameters.password, "pass@word#");
  assert.equal(client.connectionParameters.user, "postgres.example");
  assert.equal(client.connectionParameters.host, "aws-0-us-east-1.pooler.supabase.com");
  assert.equal(client.connectionParameters.application_name, "auth");
});

test("trusts the public Supabase root certificate, which has not expired", () => {
  const cert = new X509Certificate(SUPABASE_ROOT_CA);
  assert.equal(cert.ca, true);
  assert.equal(cert.fingerprint256, "80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA");
  assert.ok(Date.now() < Date.parse(cert.validTo));
});

test("verifies TLS for direct and transaction pooler Supabase connections", () => {
  for (const host of ["db.example.supabase.co:5432", "aws-1-eu-west-1.pooler.supabase.com:6543"]) {
    const client = new pg.Client(postgresConnectionOptions(`postgresql://postgres:pass@${host}/postgres?sslmode=require`));
    assert.equal(client.connectionParameters.ssl.ca, SUPABASE_ROOT_CA);
    assert.equal(client.connectionParameters.ssl.rejectUnauthorized, true);
  }
});

test("preserves other database providers and explicit certificate configuration", () => {
  for (const raw of [
    "postgresql://user:pass@localhost:5432/app",
    "postgresql://user:pass@db.example.net/app?sslmode=require",
    "postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com.evil.test/app?sslmode=require",
    "postgresql://postgres:pass@db.example.supabase.co/postgres?sslmode=verify-full&sslrootcert=/custom/ca.crt",
  ]) {
    assert.deepEqual(postgresConnectionOptions(raw), { connectionString: raw });
  }
});

test("invalid connection strings produce an error without disclosing credentials", () => {
  assert.throws(() => postgresConnectionOptions("not-a-url-secret"), {
    message: "DATABASE_URL must be a valid PostgreSQL connection URL.",
  });
});
