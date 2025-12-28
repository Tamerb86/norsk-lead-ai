/**
 * Brreg API Integration Service
 * 
 * Integrates with the Norwegian Business Registry (Brønnøysundregistrene)
 * API: https://data.brreg.no/enhetsregisteret/api
 * 
 * Features:
 * - Search companies by name, org number, industry, location
 * - Get company details including roles/management
 * - Sync and update company data
 * - Get recent updates/changes
 */

const BRREG_BASE_URL = 'https://data.brreg.no/enhetsregisteret/api';

// Types for Brreg API responses
export interface BrregEnhet {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: {
    kode: string;
    beskrivelse: string;
  };
  hjemmeside?: string;
  epostadresse?: string;
  telefon?: string;
  mobil?: string;
  forretningsadresse?: {
    land: string;
    landkode: string;
    postnummer: string;
    poststed: string;
    adresse: string[];
    kommune: string;
    kommunenummer: string;
  };
  postadresse?: {
    land: string;
    landkode: string;
    postnummer: string;
    poststed: string;
    adresse: string[];
    kommune: string;
    kommunenummer: string;
  };
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  naeringskode2?: {
    kode: string;
    beskrivelse: string;
  };
  naeringskode3?: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte?: number;
  stiftelsesdato?: string;
  registreringsdatoEnhetsregisteret?: string;
  konkurs?: boolean;
  underAvvikling?: boolean;
  underTvangsavviklingEllerTvangsopplosning?: boolean;
  registrertIMvaregisteret?: boolean;
  registrertIForetaksregisteret?: boolean;
  registrertIFrivillighetsregisteret?: boolean;
  sisteInnsendteAarsregnskap?: string;
  institusjonellSektorkode?: {
    kode: string;
    beskrivelse: string;
  };
  _links?: {
    self: { href: string };
    roller?: { href: string };
  };
}

export interface BrregRolle {
  type: {
    kode: string;
    beskrivelse: string;
  };
  person?: {
    fodselsdato?: string;
    navn: {
      fornavn: string;
      mellomnavn?: string;
      etternavn: string;
    };
  };
  enhet?: {
    organisasjonsnummer: string;
    organisasjonsform: {
      kode: string;
      beskrivelse: string;
    };
    navn: string[];
  };
  fratraadt?: boolean;
  rekkefolge?: number;
}

export interface BrregRolleGruppe {
  type: {
    kode: string;
    beskrivelse: string;
  };
  sistEndret: string;
  roller: BrregRolle[];
}

export interface BrregSearchResult {
  _embedded?: {
    enheter: BrregEnhet[];
  };
  _links?: {
    self: { href: string };
    first?: { href: string };
    last?: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface BrregSearchParams {
  navn?: string;
  organisasjonsnummer?: string;
  kommunenummer?: string;
  organisasjonsform?: string;
  naeringskode?: string;
  fraRegistreringsdatoEnhetsregisteret?: string;
  tilRegistreringsdatoEnhetsregisteret?: string;
  fraAntallAnsatte?: number;
  tilAntallAnsatte?: number;
  konkurs?: boolean;
  size?: number;
  page?: number;
  sort?: string;
}

/**
 * Search for companies in Brreg
 */
export async function searchBrregCompanies(params: BrregSearchParams): Promise<BrregSearchResult> {
  const queryParams = new URLSearchParams();
  
  if (params.navn) queryParams.append('navn', params.navn);
  if (params.organisasjonsnummer) queryParams.append('organisasjonsnummer', params.organisasjonsnummer);
  if (params.kommunenummer) queryParams.append('kommunenummer', params.kommunenummer);
  if (params.organisasjonsform) queryParams.append('organisasjonsform', params.organisasjonsform);
  if (params.naeringskode) queryParams.append('naeringskode', params.naeringskode);
  if (params.fraRegistreringsdatoEnhetsregisteret) queryParams.append('fraRegistreringsdatoEnhetsregisteret', params.fraRegistreringsdatoEnhetsregisteret);
  if (params.tilRegistreringsdatoEnhetsregisteret) queryParams.append('tilRegistreringsdatoEnhetsregisteret', params.tilRegistreringsdatoEnhetsregisteret);
  if (params.fraAntallAnsatte !== undefined) queryParams.append('fraAntallAnsatte', params.fraAntallAnsatte.toString());
  if (params.tilAntallAnsatte !== undefined) queryParams.append('tilAntallAnsatte', params.tilAntallAnsatte.toString());
  if (params.konkurs !== undefined) queryParams.append('konkurs', params.konkurs.toString());
  if (params.size) queryParams.append('size', params.size.toString());
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.sort) queryParams.append('sort', params.sort);

  const url = `${BRREG_BASE_URL}/enheter?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Brreg API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching Brreg:', error);
    throw error;
  }
}

/**
 * Get a specific company by organization number
 */
export async function getBrregCompany(orgNr: string): Promise<BrregEnhet | null> {
  const url = `${BRREG_BASE_URL}/enheter/${orgNr}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Brreg API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching company from Brreg:', error);
    throw error;
  }
}

/**
 * Get roles/management for a company
 */
export async function getBrregCompanyRoles(orgNr: string): Promise<BrregRolleGruppe[]> {
  const url = `${BRREG_BASE_URL}/enheter/${orgNr}/roller`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Brreg API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.rollegrupper || [];
  } catch (error) {
    console.error('Error fetching company roles from Brreg:', error);
    throw error;
  }
}

/**
 * Get recent updates from Brreg
 */
export async function getBrregUpdates(params: {
  dato?: string;
  oppdateringsid?: number;
  size?: number;
}): Promise<any> {
  const queryParams = new URLSearchParams();
  
  if (params.dato) queryParams.append('dato', params.dato);
  if (params.oppdateringsid) queryParams.append('oppdateringsid', params.oppdateringsid.toString());
  if (params.size) queryParams.append('size', params.size.toString());

  const url = `${BRREG_BASE_URL}/oppdateringer/enheter?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Brreg API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching updates from Brreg:', error);
    throw error;
  }
}

/**
 * Convert Brreg company data to our internal format
 */
export function convertBrregToCompany(brreg: BrregEnhet): {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform: string | null;
  hjemmeside: string | null;
  epostadresse: string | null;
  telefon: string | null;
  forretningsadresse: string | null;
  poststed: string | null;
  postnummer: string | null;
  kommune: string | null;
  fylke: string | null;
  naeringskode: string | null;
  naeringsbeskrivelse: string | null;
  antallAnsatte: number | null;
  stiftelsesdato: string | null;
  konkurs: boolean;
  underAvvikling: boolean;
} {
  // Build full address
  let fullAddress = null;
  if (brreg.forretningsadresse?.adresse) {
    fullAddress = brreg.forretningsadresse.adresse.filter(a => a).join(', ');
  }

  // Map kommunenummer to fylke (first 2 digits)
  let fylke = null;
  if (brreg.forretningsadresse?.kommunenummer) {
    const kommuneNr = brreg.forretningsadresse.kommunenummer;
    fylke = mapKommuneToFylke(kommuneNr);
  }

  return {
    organisasjonsnummer: brreg.organisasjonsnummer,
    navn: brreg.navn,
    organisasjonsform: brreg.organisasjonsform?.kode || null,
    hjemmeside: brreg.hjemmeside || null,
    epostadresse: brreg.epostadresse || null,
    telefon: brreg.telefon || brreg.mobil || null,
    forretningsadresse: fullAddress,
    poststed: brreg.forretningsadresse?.poststed || null,
    postnummer: brreg.forretningsadresse?.postnummer || null,
    kommune: brreg.forretningsadresse?.kommune || null,
    fylke: fylke,
    naeringskode: brreg.naeringskode1?.kode || null,
    naeringsbeskrivelse: brreg.naeringskode1?.beskrivelse || null,
    antallAnsatte: brreg.antallAnsatte ?? null,
    stiftelsesdato: brreg.stiftelsesdato || null,
    konkurs: brreg.konkurs || false,
    underAvvikling: brreg.underAvvikling || brreg.underTvangsavviklingEllerTvangsopplosning || false,
  };
}

/**
 * Map kommune number to fylke name
 */
function mapKommuneToFylke(kommuneNr: string): string {
  const fylkeKode = kommuneNr.substring(0, 2);
  
  const fylkeMap: Record<string, string> = {
    '03': 'Oslo',
    '11': 'Rogaland',
    '15': 'Møre og Romsdal',
    '18': 'Nordland',
    '21': 'Svalbard',
    '30': 'Viken',
    '34': 'Innlandet',
    '38': 'Vestfold og Telemark',
    '42': 'Agder',
    '46': 'Vestland',
    '50': 'Trøndelag',
    '54': 'Troms og Finnmark',
    '31': 'Østfold',
    '32': 'Akershus',
    '33': 'Buskerud',
    '39': 'Vestfold',
    '40': 'Telemark',
    '55': 'Troms',
    '56': 'Finnmark',
  };

  return fylkeMap[fylkeKode] || 'Ukjent';
}

/**
 * Extract CEO/Daglig leder from roles
 */
export function extractCEO(rollegrupper: BrregRolleGruppe[]): {
  navn: string;
  tittel: string;
} | null {
  for (const gruppe of rollegrupper) {
    for (const rolle of gruppe.roller) {
      if (rolle.type.kode === 'DAGL' && rolle.person && !rolle.fratraadt) {
        const navn = rolle.person.navn;
        const fullNavn = [navn.fornavn, navn.mellomnavn, navn.etternavn]
          .filter(n => n)
          .join(' ');
        return {
          navn: fullNavn,
          tittel: rolle.type.beskrivelse,
        };
      }
    }
  }
  return null;
}

/**
 * Extract board members from roles
 */
export function extractBoardMembers(rollegrupper: BrregRolleGruppe[]): Array<{
  navn: string;
  rolle: string;
}> {
  const members: Array<{ navn: string; rolle: string }> = [];
  
  for (const gruppe of rollegrupper) {
    if (gruppe.type.kode === 'STYR') {
      for (const rolle of gruppe.roller) {
        if (rolle.person && !rolle.fratraadt) {
          const navn = rolle.person.navn;
          const fullNavn = [navn.fornavn, navn.mellomnavn, navn.etternavn]
            .filter(n => n)
            .join(' ');
          members.push({
            navn: fullNavn,
            rolle: rolle.type.beskrivelse,
          });
        }
      }
    }
  }
  
  return members;
}

/**
 * Enrich company data from Brreg
 */
export async function enrichCompanyFromBrreg(orgNr: string): Promise<{
  company: ReturnType<typeof convertBrregToCompany>;
  ceo: ReturnType<typeof extractCEO>;
  boardMembers: ReturnType<typeof extractBoardMembers>;
} | null> {
  try {
    const [company, rollegrupper] = await Promise.all([
      getBrregCompany(orgNr),
      getBrregCompanyRoles(orgNr),
    ]);

    if (!company) {
      return null;
    }

    return {
      company: convertBrregToCompany(company),
      ceo: extractCEO(rollegrupper),
      boardMembers: extractBoardMembers(rollegrupper),
    };
  } catch (error) {
    console.error('Error enriching company from Brreg:', error);
    return null;
  }
}

/**
 * Search and import new companies from Brreg
 */
export async function searchAndImportFromBrreg(params: BrregSearchParams): Promise<{
  total: number;
  companies: ReturnType<typeof convertBrregToCompany>[];
}> {
  const result = await searchBrregCompanies(params);
  
  const companies = result._embedded?.enheter?.map(convertBrregToCompany) || [];
  
  return {
    total: result.page?.totalElements || 0,
    companies,
  };
}
