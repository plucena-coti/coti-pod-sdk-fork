import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Bug Condition Exploration Test — DirectMessageEvm.sol
 *
 * This test encodes the EXPECTED (fixed) behavior:
 *   - DirectMessageEvm inherits PodLib, PodUserSepolia (not PodLibBase)
 *   - Constructor body does NOT contain redundant setInbox / configureCoti calls
 *
 * On UNFIXED code this test MUST FAIL, confirming the bug exists.
 *
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 */

const CONTRACT_PATH = path.resolve(
  __dirname,
  "../../contracts/examples/DirectMessageEvm.sol"
);

describe("Bug Condition — DirectMessageEvm inheritance and constructor", () => {
  const source = readFileSync(CONTRACT_PATH, "utf-8");

  it("should inherit PodLib, PodUserSepolia (not PodLibBase)", () => {
    // Match the contract declaration line: `contract DirectMessageEvm is <parents>`
    const inheritanceMatch = source.match(
      /contract\s+DirectMessageEvm\s+is\s+([^{]+)\{/
    );
    expect(inheritanceMatch).not.toBeNull();

    const inheritanceList = inheritanceMatch![1].trim();

    // The fixed contract must list PodLib (not PodLibBase) alongside PodUserSepolia
    expect(inheritanceList).toMatch(/\bPodLib\b/);
    expect(inheritanceList).not.toMatch(/\bPodLibBase\b/);
    expect(inheritanceList).toMatch(/\bPodUserSepolia\b/);
  });

  it("constructor body should NOT contain redundant setInbox call", () => {
    // Extract the constructor body (everything between the first { and first })
    // Uses [^}]* to handle both multi-line and single-line empty constructors
    const ctorMatch = source.match(
      /constructor\s*\([^)]*\)[^{]*\{([^}]*)\}/
    );
    expect(ctorMatch).not.toBeNull();

    const ctorBody = ctorMatch![1];
    expect(ctorBody).not.toMatch(/setInbox\s*\(/);
  });

  it("constructor body should NOT contain redundant configureCoti call", () => {
    // Extract the constructor body (everything between the first { and first })
    // Uses [^}]* to handle both multi-line and single-line empty constructors
    const ctorMatch = source.match(
      /constructor\s*\([^)]*\)[^{]*\{([^}]*)\}/
    );
    expect(ctorMatch).not.toBeNull();

    const ctorBody = ctorMatch![1];
    expect(ctorBody).not.toMatch(/configureCoti\s*\(/);
  });
});
