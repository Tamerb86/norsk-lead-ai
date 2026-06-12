import { describe, expect, it } from "vitest";
import {
  classifyReply,
  stripQuotedReply,
  isTerminalCategory,
  REPLY_CATEGORIES,
} from "./services/replyClassifier";

describe("classifyReply", () => {
  it("detects Norwegian unsubscribe with highest priority", () => {
    const r = classifyReply("Vennligst fjern meg fra listen, ikke kontakt meg igjen.");
    expect(r.category).toBe(REPLY_CATEGORIES.UNSUBSCRIBE);
    expect(r.sentiment).toBe("negative");
    expect(r.suggestedAction).toBe("stop_unsubscribe");
  });

  it("detects English interest", () => {
    const r = classifyReply("This sounds great, tell me more!");
    expect(r.category).toBe(REPLY_CATEGORIES.INTERESTED);
    expect(r.sentiment).toBe("positive");
    expect(r.suggestedAction).toBe("draft_reply");
  });

  it("detects Norwegian meeting request", () => {
    const r = classifyReply("La oss møtes neste uke for en demo?");
    expect(r.category).toBe(REPLY_CATEGORIES.MEETING_REQUEST);
    expect(r.suggestedAction).toBe("draft_meeting");
  });

  it("detects pricing questions in Norwegian", () => {
    const r = classifyReply("Hva koster dette? Kan dere sende et tilbud?");
    expect(r.category).toBe(REPLY_CATEGORIES.PRICING);
  });

  it("detects not-interested", () => {
    const r = classifyReply("Nei takk, vi har allerede en leverandør.");
    expect(r.category).toBe(REPLY_CATEGORIES.NOT_INTERESTED);
    expect(r.suggestedAction).toBe("stop_not_interested");
  });

  it("returns neutral for unrecognized content", () => {
    const r = classifyReply("xyzzy plover");
    expect(r.category).toBe(REPLY_CATEGORIES.NEUTRAL);
    expect(r.suggestedAction).toBe("review");
  });

  it("prioritizes unsubscribe over interest when both present", () => {
    const r = classifyReply("Interesting, but please unsubscribe me.");
    expect(r.category).toBe(REPLY_CATEGORIES.UNSUBSCRIBE);
  });

  it("handles empty input safely", () => {
    const r = classifyReply("");
    expect(r.category).toBe(REPLY_CATEGORIES.NEUTRAL);
  });
});

describe("isTerminalCategory", () => {
  it("flags negative categories as terminal", () => {
    expect(isTerminalCategory(REPLY_CATEGORIES.UNSUBSCRIBE)).toBe(true);
    expect(isTerminalCategory(REPLY_CATEGORIES.NOT_INTERESTED)).toBe(true);
    expect(isTerminalCategory(REPLY_CATEGORIES.SPAM)).toBe(true);
    expect(isTerminalCategory(REPLY_CATEGORIES.BOUNCE)).toBe(true);
  });
  it("does not flag positive/neutral categories", () => {
    expect(isTerminalCategory(REPLY_CATEGORIES.INTERESTED)).toBe(false);
    expect(isTerminalCategory(REPLY_CATEGORIES.MEETING_REQUEST)).toBe(false);
    expect(isTerminalCategory(REPLY_CATEGORIES.NEUTRAL)).toBe(false);
  });
});

describe("stripQuotedReply", () => {
  it("strips English quoted history", () => {
    const body = "Yes, sounds good!\n\nOn Mon, Jan 1 2026, Ola wrote:\n> original message\n> more quoted";
    const stripped = stripQuotedReply(body);
    expect(stripped).toBe("Yes, sounds good!");
    expect(stripped).not.toContain("original message");
  });

  it("strips Norwegian quoted history (skrev:)", () => {
    const body = "Ja, gjerne!\n\nOla Nordmann skrev:\n> opprinnelig melding";
    const stripped = stripQuotedReply(body);
    expect(stripped).toBe("Ja, gjerne!");
  });

  it("strips Outlook Fra: header block", () => {
    const body = "Takk for informasjonen.\n\nFra: salg@firma.no\nSendt: 1. januar\n> ...";
    const stripped = stripQuotedReply(body);
    expect(stripped).toBe("Takk for informasjonen.");
  });

  it("returns the body unchanged when there is no quote", () => {
    expect(stripQuotedReply("Just a plain reply")).toBe("Just a plain reply");
  });
});
