import test from "node:test";
import assert from "node:assert/strict";
import {formatCaptureDate,REPORT_TIMEZONE} from "../lib/signal/reporting-time.ts";

test("captured near midnight UTC remains the previous Pacific calendar date",()=>{
  assert.equal(REPORT_TIMEZONE,"America/Los_Angeles");
  assert.equal(formatCaptureDate("2026-11-20T00:39:00Z"),"Nov 19, 2026");
});
test("capture date is deterministic through Pacific daylight-saving changes",()=>{
  assert.equal(formatCaptureDate("2026-07-01T01:00:00Z"),"Jun 30, 2026");
  assert.equal(formatCaptureDate("2026-12-01T07:00:00Z"),"Nov 30, 2026");
});
test("invalid capture timestamp cannot masquerade as a real date",()=>{
  assert.equal(formatCaptureDate("not-a-timestamp"),"Capture date unavailable");
});
