import assert from "node:assert/strict";
import { test } from "node:test";
import { apiBibleProblem } from "./api-bible-problem.ts";

test("names which condition for API.Bible is missing", () => {
  assert.equal(apiBibleProblem(new Error("api-bible-missing")), "missing-key");
  assert.equal(apiBibleProblem(new Error("api-bible-http:401")), "rejected-key");
  assert.equal(apiBibleProblem(new Error("api-bible-http:403")), "rejected-key");
  assert.equal(apiBibleProblem(new Error("api-bible-license:lbla")), "no-license-lbla");
  assert.equal(apiBibleProblem(new Error("api-bible-license:nasb20")), "no-license-nasb20");
  assert.equal(apiBibleProblem(new Error("api-bible-http:429")), "limit");
});

test("anything else from API.Bible is a plain outage", () => {
  assert.equal(apiBibleProblem(new Error("api-bible-http:500")), "unavailable");
  assert.equal(apiBibleProblem(new Error("api-bible-http:404")), "unavailable");
});

test("errors that are not from API.Bible are left alone", () => {
  assert.equal(apiBibleProblem(new Error("lsm-pending")), null);
  assert.equal(apiBibleProblem(new Error("fetch failed")), null);
  assert.equal(apiBibleProblem("api-bible-missing"), null);
  assert.equal(apiBibleProblem(undefined), null);
});
