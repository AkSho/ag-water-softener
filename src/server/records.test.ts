// Regression tests for validateTracking and in-memory carrier propagation.
// Run: npx tsx src/server/records.test.ts

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateTracking } from "./records";

describe("validateTracking", () => {
  it("classifies Yun Express YT-prefixed numbers", () => {
    // Andrea Roeder's tracking number (defect regression)
    const result = validateTracking("YT2625421605000613");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "Yun Express");
  });

  it("classifies Yun Express lowercase", () => {
    const result = validateTracking("yt2625421605000613");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "Yun Express");
  });

  it("classifies Yun Express with whitespace", () => {
    const result = validateTracking(" YT2625421605000613 ");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "Yun Express");
  });

  it("rejects YT with wrong digit count", () => {
    const result = validateTracking("YT12345678901234"); // 14 digits
    assert.equal(result.valid, false);
  });

  it("classifies DHL 10-digit numbers", () => {
    const result = validateTracking("1234567890");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "DHL");
  });

  it("classifies DHL JD-prefixed numbers", () => {
    const result = validateTracking("JD012345678901234567");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "DHL");
  });

  it("classifies UPS 1Z-prefixed numbers", () => {
    const result = validateTracking("1Z999AA10123456784");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "UPS");
  });

  it("classifies FedEx 12-digit numbers", () => {
    const result = validateTracking("123456789012");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "FedEx");
  });

  it("classifies FedEx 15-digit numbers", () => {
    const result = validateTracking("123456789012345");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "FedEx");
  });

  it("classifies USPS 20-digit numbers starting with 9", () => {
    const result = validateTracking("92345678901234567890");
    assert.equal(result.valid, true);
    assert.equal(result.carrier, "USPS");
  });

  it("rejects invalid formats", () => {
    const result = validateTracking("ABC123");
    assert.equal(result.valid, false);
  });
});
