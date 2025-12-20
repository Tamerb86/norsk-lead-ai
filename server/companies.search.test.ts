import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Companies Search with Advanced Filters", () => {
  beforeAll(async () => {
    // Ensure database is connected
    const database = await db.getDb();
    expect(database).toBeDefined();
  });

  it("should search companies by name", async () => {
    const result = await db.searchCompanies({
      query: "Equinor",
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    expect(Array.isArray(result.companies)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it("should filter companies with email", async () => {
    const result = await db.searchCompanies({
      hasEmail: true,
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // All returned companies should have email
    result.companies.forEach((company) => {
      expect(company.epostadresse).toBeTruthy();
    });
  });

  it("should filter companies with phone", async () => {
    const result = await db.searchCompanies({
      hasPhone: true,
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // All returned companies should have phone
    result.companies.forEach((company) => {
      expect(company.telefon).toBeTruthy();
    });
  });

  it("should filter companies with website", async () => {
    const result = await db.searchCompanies({
      hasWebsite: true,
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // All returned companies should have website
    result.companies.forEach((company) => {
      expect(company.hjemmeside).toBeTruthy();
    });
  });

  it("should filter companies by organization form", async () => {
    const result = await db.searchCompanies({
      organisasjonsform: "AS",
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // All returned companies should have AS in their organization form
    result.companies.forEach((company) => {
      expect(company.organisasjonsform).toContain("AS");
    });
  });

  it("should filter companies by minimum employees", async () => {
    const minEmployees = 100;
    const result = await db.searchCompanies({
      minEmployees,
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // All returned companies should have at least minEmployees
    result.companies.forEach((company) => {
      if (company.antallAnsatte !== null) {
        expect(company.antallAnsatte).toBeGreaterThanOrEqual(minEmployees);
      }
    });
  });

  it("should filter companies by maximum employees", async () => {
    const maxEmployees = 50;
    const result = await db.searchCompanies({
      maxEmployees,
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // All returned companies should have at most maxEmployees
    result.companies.forEach((company) => {
      if (company.antallAnsatte !== null) {
        expect(company.antallAnsatte).toBeLessThanOrEqual(maxEmployees);
      }
    });
  });

  it("should filter companies by employee range", async () => {
    const minEmployees = 10;
    const maxEmployees = 100;
    const result = await db.searchCompanies({
      minEmployees,
      maxEmployees,
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // All returned companies should be within the range
    result.companies.forEach((company) => {
      if (company.antallAnsatte !== null) {
        expect(company.antallAnsatte).toBeGreaterThanOrEqual(minEmployees);
        expect(company.antallAnsatte).toBeLessThanOrEqual(maxEmployees);
      }
    });
  });

  it("should sort companies by name ascending", async () => {
    const result = await db.searchCompanies({
      sortBy: "name",
      sortOrder: "asc",
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // Check if companies are sorted by name
    if (result.companies.length > 1) {
      for (let i = 0; i < result.companies.length - 1; i++) {
        const current = result.companies[i].navn || "";
        const next = result.companies[i + 1].navn || "";
        expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
      }
    }
  });

  it("should sort companies by employees descending", async () => {
    const result = await db.searchCompanies({
      sortBy: "employees",
      sortOrder: "desc",
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // Check if companies are sorted by employees (descending)
    if (result.companies.length > 1) {
      for (let i = 0; i < result.companies.length - 1; i++) {
        const current = result.companies[i].antallAnsatte || 0;
        const next = result.companies[i + 1].antallAnsatte || 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it("should combine multiple filters", async () => {
    const result = await db.searchCompanies({
      hasEmail: true,
      hasPhone: true,
      minEmployees: 10,
      organisasjonsform: "AS",
      sortBy: "employees",
      sortOrder: "desc",
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    
    // All returned companies should meet all criteria
    result.companies.forEach((company) => {
      expect(company.epostadresse).toBeTruthy();
      expect(company.telefon).toBeTruthy();
      if (company.antallAnsatte !== null) {
        expect(company.antallAnsatte).toBeGreaterThanOrEqual(10);
      }
      expect(company.organisasjonsform).toContain("AS");
    });
  });

  it("should respect limit parameter", async () => {
    const limit = 5;
    const result = await db.searchCompanies({
      limit,
    });

    expect(result).toBeDefined();
    expect(result.companies).toBeDefined();
    expect(result.companies.length).toBeLessThanOrEqual(limit);
  });

  it("should return total count", async () => {
    const result = await db.searchCompanies({
      limit: 5,
    });

    expect(result).toBeDefined();
    expect(result.total).toBeDefined();
    expect(typeof result.total).toBe("number");
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});
