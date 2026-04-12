import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Preservation Property Tests — DirectMessageEvm ABI Baseline
 *
 * These tests observe the compiled ABI of DirectMessageEvm on UNFIXED code
 * and assert that the external interface (functions, events, errors) is preserved.
 *
 * Observation-first methodology: we read the existing artifact, then write
 * assertions based on what we observe. These tests MUST PASS on unfixed code
 * to establish the baseline that the fix must preserve.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

const ARTIFACT_PATH = path.resolve(
  __dirname,
  "../../artifacts/contracts/examples/DirectMessageEvm.sol/DirectMessageEvm.json"
);

const INTERFACE_ARTIFACT_PATH = path.resolve(
  __dirname,
  "../../artifacts/contracts/examples/DirectMessageEvm.sol/IDirectMessagePod.json"
);

interface AbiEntry {
  type: string;
  name?: string;
  inputs?: Array<{ name: string; type: string; internalType?: string; indexed?: boolean; components?: unknown[] }>;
  outputs?: Array<{ name: string; type: string; internalType?: string; components?: unknown[] }>;
  stateMutability?: string;
  anonymous?: boolean;
}

let abi: AbiEntry[];
let interfaceAbi: AbiEntry[];

beforeAll(() => {
  const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, "utf-8"));
  abi = artifact.abi;

  const interfaceArtifact = JSON.parse(readFileSync(INTERFACE_ARTIFACT_PATH, "utf-8"));
  interfaceAbi = interfaceArtifact.abi;
});

// ── Helper: extract entries by type ──────────────────────────────────────────

function functionEntries(entries: AbiEntry[]): AbiEntry[] {
  return entries.filter((e) => e.type === "function");
}

function eventEntries(entries: AbiEntry[]): AbiEntry[] {
  return entries.filter((e) => e.type === "event");
}

function errorEntries(entries: AbiEntry[]): AbiEntry[] {
  return entries.filter((e) => e.type === "error");
}

// ── Required functions ───────────────────────────────────────────────────────

const REQUIRED_FUNCTIONS = [
  "sendMessage",
  "onMessageReceived",
  "setCotiContract",
  "onDefaultMpcError",
  "requestSenders",
] as const;

const REQUIRED_EVENTS = [
  "MessageDispatched",
  "MessageReply",
  "ErrorRemoteCall",
] as const;

// ── Observed baseline function signatures (from unfixed ABI) ─────────────────

const BASELINE_FUNCTION_SIGNATURES: Record<string, { inputs: string[]; outputs: string[]; stateMutability: string }> = {
  sendMessage: {
    inputs: ["tuple", "address", "uint256"],
    outputs: ["bytes32"],
    stateMutability: "payable",
  },
  onMessageReceived: {
    inputs: ["bytes"],
    outputs: [],
    stateMutability: "nonpayable",
  },
  setCotiContract: {
    inputs: ["address"],
    outputs: [],
    stateMutability: "nonpayable",
  },
  onDefaultMpcError: {
    inputs: ["bytes32"],
    outputs: [],
    stateMutability: "nonpayable",
  },
  requestSenders: {
    inputs: ["bytes32"],
    outputs: ["address"],
    stateMutability: "view",
  },
  configure: {
    inputs: ["address", "address", "uint256"],
    outputs: [],
    stateMutability: "nonpayable",
  },
  inbox: {
    inputs: [],
    outputs: ["address"],
    stateMutability: "view",
  },
  owner: {
    inputs: [],
    outputs: ["address"],
    stateMutability: "view",
  },
  renounceOwnership: {
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  transferOwnership: {
    inputs: ["address"],
    outputs: [],
    stateMutability: "nonpayable",
  },
};

// ── Observed baseline event signatures (from unfixed ABI) ────────────────────

const BASELINE_EVENT_SIGNATURES: Record<string, { paramTypes: string[]; indexed: boolean[] }> = {
  MessageDispatched: {
    paramTypes: ["bytes32", "address", "address"],
    indexed: [true, true, true],
  },
  MessageReply: {
    paramTypes: ["bytes32", "bytes32", "string"],
    indexed: [true, false, false],
  },
  ErrorRemoteCall: {
    paramTypes: ["bytes32", "uint256", "string"],
    indexed: [false, false, false],
  },
  OwnershipTransferred: {
    paramTypes: ["address", "address"],
    indexed: [true, true],
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Preservation — DirectMessageEvm ABI baseline", () => {
  describe("required functions are present in the ABI", () => {
    const fnNames = () => functionEntries(abi).map((e) => e.name);

    it.each(REQUIRED_FUNCTIONS.map((f) => [f]))(
      "ABI contains function: %s",
      (name) => {
        expect(fnNames()).toContain(name);
      }
    );
  });

  describe("required events are present in the ABI", () => {
    const evNames = () => eventEntries(abi).map((e) => e.name);

    it.each(REQUIRED_EVENTS.map((e) => [e]))(
      "ABI contains event: %s",
      (name) => {
        expect(evNames()).toContain(name);
      }
    );
  });

  /**
   * Property: For ALL public/external function entries in the ABI,
   * the function signature, input types, and output types match the observed baseline.
   *
   * **Validates: Requirements 3.1, 3.2, 3.4**
   */
  describe("function signatures are preserved (property-based over all functions)", () => {
    it("for all function entries, input types, output types, and mutability match baseline", () => {
      const fns = functionEntries(abi);
      expect(fns.length).toBeGreaterThan(0);

      for (const fn of fns) {
        const name = fn.name!;
        const baseline = BASELINE_FUNCTION_SIGNATURES[name];
        expect(baseline, `unexpected function "${name}" not in baseline`).toBeDefined();

        const inputTypes = (fn.inputs ?? []).map((i) => i.type);
        const outputTypes = (fn.outputs ?? []).map((o) => o.type);

        expect(inputTypes, `${name} input types`).toEqual(baseline.inputs);
        expect(outputTypes, `${name} output types`).toEqual(baseline.outputs);
        expect(fn.stateMutability, `${name} mutability`).toBe(baseline.stateMutability);
      }
    });

    it("no extra or missing functions compared to baseline", () => {
      const fnNames = functionEntries(abi).map((e) => e.name).sort();
      const baselineNames = Object.keys(BASELINE_FUNCTION_SIGNATURES).sort();
      expect(fnNames).toEqual(baselineNames);
    });
  });

  /**
   * Property: For ALL event entries in the ABI,
   * the event name and parameter types match the observed baseline.
   *
   * **Validates: Requirements 3.2, 3.5**
   */
  describe("event signatures are preserved (property-based over all events)", () => {
    it("for all event entries, parameter types and indexed flags match baseline", () => {
      const events = eventEntries(abi);
      expect(events.length).toBeGreaterThan(0);

      for (const ev of events) {
        const name = ev.name!;
        const baseline = BASELINE_EVENT_SIGNATURES[name];
        expect(baseline, `unexpected event "${name}" not in baseline`).toBeDefined();

        const paramTypes = (ev.inputs ?? []).map((i) => i.type);
        const indexedFlags = (ev.inputs ?? []).map((i) => i.indexed ?? false);

        expect(paramTypes, `${name} param types`).toEqual(baseline.paramTypes);
        expect(indexedFlags, `${name} indexed flags`).toEqual(baseline.indexed);
      }
    });

    it("no extra or missing events compared to baseline", () => {
      const evNames = eventEntries(abi).map((e) => e.name).sort();
      const baselineNames = Object.keys(BASELINE_EVENT_SIGNATURES).sort();
      expect(evNames).toEqual(baselineNames);
    });
  });

  /**
   * The IDirectMessagePod interface selector for receiveMessage(gtString,address)
   * must be present in the compiled artifacts.
   *
   * **Validates: Requirements 3.1**
   */
  describe("IDirectMessagePod interface selector", () => {
    it("interface artifact contains receiveMessage function", () => {
      const fns = functionEntries(interfaceAbi);
      const receiveMsg = fns.find((f) => f.name === "receiveMessage");
      expect(receiveMsg).toBeDefined();
      expect(receiveMsg!.inputs).toHaveLength(2);
      // First param is gtString (tuple), second is address
      expect(receiveMsg!.inputs![0].type).toBe("tuple");
      expect(receiveMsg!.inputs![1].type).toBe("address");
    });

    it("receiveMessage selector is referenced in DirectMessageEvm source", () => {
      const source = readFileSync(
        path.resolve(__dirname, "../../contracts/examples/DirectMessageEvm.sol"),
        "utf-8"
      );
      expect(source).toContain("IDirectMessagePod.receiveMessage.selector");
    });
  });

  /**
   * The contract exposes the same external interface regardless of whether
   * PodLibBase or PodLib is inherited — the ABI surface is identical.
   *
   * **Validates: Requirements 3.3, 3.4, 3.5**
   */
  describe("ABI surface is independent of PodLibBase vs PodLib inheritance", () => {
    it("PodLibBase-provided functions are present (onDefaultMpcError, configure, inbox, owner)", () => {
      const fnNames = functionEntries(abi).map((e) => e.name);
      expect(fnNames).toContain("onDefaultMpcError");
      expect(fnNames).toContain("configure");
      expect(fnNames).toContain("inbox");
      expect(fnNames).toContain("owner");
    });

    it("ErrorRemoteCall event from PodLibBase is present", () => {
      const evNames = eventEntries(abi).map((e) => e.name);
      expect(evNames).toContain("ErrorRemoteCall");
    });

    it("error types from the inheritance chain are present", () => {
      const errNames = errorEntries(abi).map((e) => e.name);
      expect(errNames).toContain("OnlyInbox");
      expect(errNames).toContain("OwnableInvalidOwner");
      expect(errNames).toContain("OwnableUnauthorizedAccount");
    });

    it("receive() fallback is present", () => {
      const receiveEntry = abi.find((e) => e.type === "receive");
      expect(receiveEntry).toBeDefined();
      expect(receiveEntry!.stateMutability).toBe("payable");
    });
  });
});
