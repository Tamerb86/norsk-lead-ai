import { describe, expect, it } from "vitest";
import { buildReplyAddress, parseReplyAddress } from "./services/replyAddress";

describe("replyAddress", () => {
  it("round-trips a tenant + lead through build/parse", () => {
    const addr = buildReplyAddress(42, 1337);
    const parsed = parseReplyAddress(addr);
    expect(parsed).toEqual({ userId: 42, leadId: 1337 });
  });

  it("parses an address wrapped in a display name", () => {
    const addr = buildReplyAddress(7, 99);
    const parsed = parseReplyAddress(`"Ola Nordmann" <${addr}>`);
    expect(parsed).toEqual({ userId: 7, leadId: 99 });
  });

  it("is case-insensitive on the address", () => {
    const addr = buildReplyAddress(3, 5).toUpperCase();
    expect(parseReplyAddress(addr)).toEqual({ userId: 3, leadId: 5 });
  });

  it("rejects a forged token (different lead id, same token)", () => {
    const addr = buildReplyAddress(42, 1337);
    // Swap the lead id but keep the original HMAC token -> must fail.
    const forged = addr.replace("42-1337-", "42-1338-");
    expect(parseReplyAddress(forged)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const addr = buildReplyAddress(10, 20);
    const tampered = addr.replace(/-([0-9a-f]{16})@/, "-0000000000000000@");
    expect(parseReplyAddress(tampered)).toBeNull();
  });

  it("rejects non-reply addresses", () => {
    expect(parseReplyAddress("someone@example.com")).toBeNull();
    expect(parseReplyAddress("")).toBeNull();
    expect(parseReplyAddress("reply+garbage@example.com")).toBeNull();
  });
});
