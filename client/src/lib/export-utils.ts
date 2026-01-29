/**
 * Export utilities for exporting data to various formats
 */

export interface Company {
  id: number;
  name: string;
  orgNr?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  poststed?: string;
  employees?: number;
  industry?: string;
  [key: string]: any;
}

/**
 * Export companies to CSV format
 */
export function exportCompaniesToCSV(companies: Company[], filename: string = 'companies.csv'): void {
  if (companies.length === 0) {
    console.warn('No companies to export');
    return;
  }

  // Get all unique keys from all companies
  const allKeys = new Set<string>();
  companies.forEach(company => {
    Object.keys(company).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...companies.map(company =>
      headers.map(header => {
        const value = company[header];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export companies to JSON format
 */
export function exportCompaniesToJSON(companies: Company[], filename: string = 'companies.json'): void {
  const jsonContent = JSON.stringify(companies, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export companies to Excel format (XLSX)
 * Note: This is a simple implementation. For more advanced Excel features,
 * consider using a library like xlsx or exceljs
 */
export function exportCompaniesToExcel(companies: Company[], filename: string = 'companies.xlsx'): void {
  // For now, export as CSV with .xlsx extension
  // In production, you should use a proper Excel library
  exportCompaniesToCSV(companies, filename.replace('.xlsx', '.csv'));
}
