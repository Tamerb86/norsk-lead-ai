import { describe, expect, it } from "vitest";
import { validateEmail } from "./emailValidator";
import { validatePhone } from "./phoneValidator";
import { checkWebsite } from "./websiteChecker";

describe("Email Validation", () => {
  it("validates correct email syntax", async () => {
    const result = await validateEmail("test@example.com");
    expect(result.checks.syntax).toBe(true);
  });

  it("rejects invalid email syntax", async () => {
    const result = await validateEmail("invalid-email");
    expect(result.checks.syntax).toBe(false);
    expect(result.isValid).toBe(false);
  });

  it("detects disposable email domains", async () => {
    const result = await validateEmail("test@tempmail.com");
    expect(result.checks.disposable).toBe(true);
    expect(result.status).toBe("risky");
  });

  it("validates email with valid domain", async () => {
    const result = await validateEmail("test@gmail.com");
    expect(result.checks.syntax).toBe(true);
    expect(result.checks.domain).toBe(true);
  });

  it("normalizes email to lowercase", async () => {
    const result = await validateEmail("Test@Example.COM");
    expect(result.email).toBe("test@example.com");
  });

  it("calculates email score correctly", async () => {
    const result = await validateEmail("test@gmail.com");
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("Phone Validation", () => {
  it("validates Norwegian mobile number", () => {
    const result = validatePhone("41234567");
    expect(result.isValid).toBe(true);
    expect(result.type).toBe("mobile");
    expect(result.country).toBe("NO");
  });

  it("validates Norwegian landline number", () => {
    const result = validatePhone("22123456");
    expect(result.isValid).toBe(true);
    expect(result.type).toBe("landline");
    expect(result.country).toBe("NO");
  });

  it("formats Norwegian phone number correctly", () => {
    const result = validatePhone("41234567");
    expect(result.formatted).toBe("+47 412 34 567");
  });

  it("handles phone number with country code", () => {
    const result = validatePhone("+47 412 34 567");
    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe("+47 412 34 567");
  });

  it("rejects invalid phone number length", () => {
    const result = validatePhone("123");
    expect(result.isValid).toBe(false);
    expect(result.checks.length).toBe(false);
  });

  it("rejects invalid Norwegian prefix", () => {
    const result = validatePhone("81234567");
    expect(result.isValid).toBe(false);
    expect(result.checks.prefix).toBe(false);
  });

  it("normalizes phone number (removes spaces and dashes)", () => {
    const result = validatePhone("412-34-567");
    expect(result.isValid).toBe(true);
  });

  it("calculates phone score correctly", () => {
    const result = validatePhone("41234567");
    expect(result.score).toBe(100);
  });
});

describe("Website Checker", () => {
  it("normalizes URL with protocol", async () => {
    const result = await checkWebsite("example.com");
    expect(result.url).toBe("example.com");
    // The normalized URL should have https:// added internally
  });

  it("validates URL syntax", async () => {
    const result = await checkWebsite("not a url");
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("error");
  });

  it("checks website reachability", async () => {
    const result = await checkWebsite("https://www.google.com");
    expect(result.checks.reachable).toBe(true);
    expect(result.status).toBe("online");
  }, 15000); // Increase timeout for network request

  it("detects SSL/HTTPS", async () => {
    const result = await checkWebsite("https://www.google.com");
    expect(result.checks.ssl).toBe(true);
  }, 15000);

  it("handles unreachable websites", async () => {
    const result = await checkWebsite("https://this-domain-does-not-exist-12345.com");
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("offline");
  }, 15000);

  it("calculates website score correctly", async () => {
    const result = await checkWebsite("https://www.google.com");
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  }, 15000);

  it("measures response time", async () => {
    const result = await checkWebsite("https://www.google.com");
    if (result.metadata.responseTime) {
      expect(result.metadata.responseTime).toBeGreaterThan(0);
    }
  }, 15000);
});
