// Available template variables for email personalization
export const TEMPLATE_VARIABLES = [
  {
    key: "{{company_name}}",
    label: "Bedriftsnavn",
    description: "Navnet på bedriften",
    example: "Acme Solutions AS",
  },
  {
    key: "{{contact_name}}",
    label: "Kontaktnavn",
    description: "Navnet på kontaktpersonen",
    example: "Ola Nordmann",
  },
  {
    key: "{{industry}}",
    label: "Bransje",
    description: "Bedriftens bransje/næringskode",
    example: "IT-konsulentvirksomhet",
  },
  {
    key: "{{org_number}}",
    label: "Org.nummer",
    description: "Organisasjonsnummer",
    example: "123456789",
  },
  {
    key: "{{email}}",
    label: "E-post",
    description: "Bedriftens e-postadresse",
    example: "post@acme.no",
  },
  {
    key: "{{phone}}",
    label: "Telefon",
    description: "Bedriftens telefonnummer",
    example: "+47 12 34 56 78",
  },
  {
    key: "{{website}}",
    label: "Nettside",
    description: "Bedriftens nettside",
    example: "www.acme.no",
  },
  {
    key: "{{city}}",
    label: "By",
    description: "Bedriftens by/kommune",
    example: "Oslo",
  },
  {
    key: "{{county}}",
    label: "Fylke",
    description: "Bedriftens fylke",
    example: "Oslo",
  },
  {
    key: "{{founded_year}}",
    label: "Stiftelsesår",
    description: "Året bedriften ble stiftet",
    example: "2020",
  },
];

// Sample data for preview
export const SAMPLE_DATA = {
  company_name: "Acme Solutions AS",
  contact_name: "Ola Nordmann",
  industry: "IT-konsulentvirksomhet",
  org_number: "123456789",
  email: "post@acme.no",
  phone: "+47 12 34 56 78",
  website: "www.acme.no",
  city: "Oslo",
  county: "Oslo",
  founded_year: "2020",
};

// Replace variables in text with sample data
export const replaceVariables = (text: string, data: Record<string, string> = SAMPLE_DATA): string => {
  let result = text;
  
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

// Highlight variables in text for visual feedback
export const highlightVariables = (text: string): string => {
  let result = text;
  
  TEMPLATE_VARIABLES.forEach(variable => {
    const regex = new RegExp(`(${variable.key.replace(/[{}]/g, '\\$&')})`, 'g');
    result = result.replace(regex, `<span class="bg-blue-100 text-blue-800 px-1 rounded">$1</span>`);
  });
  
  return result;
};

// Validate template text for missing or invalid variables
export const validateTemplate = (text: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const variablePattern = /{{([^}]+)}}/g;
  
  const validKeys = TEMPLATE_VARIABLES.map(v => v.key.replace(/[{}]/g, ''));
  
  let match;
  while ((match = variablePattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const key = match[1];
    
    if (!validKeys.includes(key)) {
      errors.push(`Ugyldig variabel: ${fullMatch}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
