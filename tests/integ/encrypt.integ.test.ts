/**
 * Integration tests for CotiPodCrypto.encrypt.
 * Run with: npm run test:integ
 * Requires network access to the PoD encryption service (testnet).
 */

import { describe, it, expect } from "vitest";
import { CotiPodCrypto, DataType } from "@coti/pod-sdk";

const NETWORK = "testnet";

describe("CotiPodCrypto.encrypt (integration)", () => {
  it("encrypts bool true", async () => {
    const result = await CotiPodCrypto.encrypt("true", NETWORK, DataType.Bool);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
    expect(typeof (result as { signature: string }).signature).toBe("string");
    const ct = (result as { ciphertext: string | bigint }).ciphertext;
    expect(ct === undefined || typeof ct === "string" || typeof ct === "bigint").toBe(true);
  });

  it("encrypts bool false", async () => {
    const result = await CotiPodCrypto.encrypt("false", NETWORK, DataType.Bool);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });

  it("encrypts uint8", async () => {
    const result = await CotiPodCrypto.encrypt("255", NETWORK, DataType.Uint8);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });

  it("encrypts uint16", async () => {
    const result = await CotiPodCrypto.encrypt("65535", NETWORK, DataType.Uint16);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });

  it("encrypts uint32", async () => {
    const result = await CotiPodCrypto.encrypt("4294967295", NETWORK, DataType.Uint32);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });

  it("encrypts uint64 (default type)", async () => {
    const result = await CotiPodCrypto.encrypt("18446744073709551615", NETWORK, DataType.Uint64);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });

  it("encrypts uint64 when dataType omitted", async () => {
    const result = await CotiPodCrypto.encrypt("42", NETWORK);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });

  it("encrypts uint128", async () => {
    const result = await CotiPodCrypto.encrypt("1", NETWORK, DataType.Uint128);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });

  it("encrypts uint256", async () => {
    const result = await CotiPodCrypto.encrypt("1", NETWORK, DataType.Uint256);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });

  it("encrypts string", async () => {
    const result = await CotiPodCrypto.encrypt("hello", NETWORK, DataType.String);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
    const ct = (result as { ciphertext: { value: string[] }; signature: string[] });
    expect(Array.isArray(ct.ciphertext.value)).toBe(true);
    expect(Array.isArray(ct.signature)).toBe(true);
    expect(ct.signature.length).toBe(ct.ciphertext.value.length);
  });

  it("encrypts empty string", async () => {
    const result = await CotiPodCrypto.encrypt("", NETWORK, DataType.String);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
    const ct = (result as { ciphertext: { value: string[] }; signature: string[] });
    expect(Array.isArray(ct.ciphertext.value)).toBe(true);
    expect(Array.isArray(ct.signature)).toBe(true);
  });

  it("encrypts with custom service URL", async () => {
    const baseUrl = "https://fullnode.testnet.coti.io/pod-encryption";
    const result = await CotiPodCrypto.encrypt("0", baseUrl, DataType.Uint64);
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("signature");
  });
});
