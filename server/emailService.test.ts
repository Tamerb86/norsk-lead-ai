import { describe, it, expect } from "vitest";
import { sendEmail, sendBulkEmails, testSendGridConnection } from "./emailService";

describe("Email Service", () => {
  describe("sendEmail - without API key", () => {
    it("should return error when SENDGRID_API_KEY is not set", async () => {
      // Clear env var
      const originalKey = process.env.SENDGRID_API_KEY;
      delete process.env.SENDGRID_API_KEY;

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("SENDGRID_API_KEY missing");

      // Restore env var
      if (originalKey) process.env.SENDGRID_API_KEY = originalKey;
    });

    it("should return error for invalid email address", async () => {
      const result = await sendEmail({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email address");
    });

    it("should return error for empty email address", async () => {
      const result = await sendEmail({
        to: "",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email address");
    });
  });

  describe("sendBulkEmails - without API key", () => {
    it("should handle empty array", async () => {
      const results = await sendBulkEmails([]);
      expect(results).toHaveLength(0);
    });

    it("should return errors for all emails when API key is missing", async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      delete process.env.SENDGRID_API_KEY;

      const emails = [
        {
          to: "test1@example.com",
          subject: "Test 1",
          html: "<p>Test 1</p>",
        },
        {
          to: "test2@example.com",
          subject: "Test 2",
          html: "<p>Test 2</p>",
        },
      ];

      const results = await sendBulkEmails(emails);

      expect(results).toHaveLength(2);
      expect(results.every((r) => !r.success)).toBe(true);
      expect(results.every((r) => r.error?.includes("SENDGRID_API_KEY"))).toBe(true);

      if (originalKey) process.env.SENDGRID_API_KEY = originalKey;
    });

    it("should handle mix of valid and invalid emails", async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      delete process.env.SENDGRID_API_KEY;

      const emails = [
        {
          to: "valid@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        },
        {
          to: "invalid-email",
          subject: "Test",
          html: "<p>Test</p>",
        },
      ];

      const results = await sendBulkEmails(emails);

      expect(results).toHaveLength(2);
      // Both should fail due to missing API key
      expect(results.every((r) => !r.success)).toBe(true);

      if (originalKey) process.env.SENDGRID_API_KEY = originalKey;
    });
  });

  describe("testSendGridConnection", () => {
    it("should return error when API key is missing", async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      delete process.env.SENDGRID_API_KEY;

      const result = await testSendGridConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain("SENDGRID_API_KEY missing");

      if (originalKey) process.env.SENDGRID_API_KEY = originalKey;
    });
  });

  describe("Email validation", () => {
    it("should reject emails without @ symbol", async () => {
      const result = await sendEmail({
        to: "notanemail",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email");
    });

    it("should reject emails without domain", async () => {
      const result = await sendEmail({
        to: "test@",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email");
    });

    it("should reject emails without local part", async () => {
      const result = await sendEmail({
        to: "@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email");
    });
  });
});
