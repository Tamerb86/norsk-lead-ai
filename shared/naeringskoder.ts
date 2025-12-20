// Common Norwegian Industry Codes (Næringskoder) with descriptions
// Based on Standard Industrial Classification (SN2007/NACE)

export const COMMON_NAERINGSKODER = [
  // Technology & IT
  { code: "62.010", name: "Programmeringstjenester", description: "Utvikling av programvare og applikasjoner" },
  { code: "62.020", name: "Konsulentvirksomhet tilknyttet informasjonsteknologi", description: "IT-rådgivning og konsulentvirksomhet" },
  { code: "63.110", name: "Databehandling, hosting og tilknyttede tjenester", description: "Webhotell, datalagring og skybaserte tjenester" },
  
  // Business Services
  { code: "70.220", name: "Bedriftsrådgivning", description: "Forretningsrådgivning og strategisk konsulentvirksomhet" },
  { code: "69.201", name: "Regnskapsføring", description: "Regnskapstjenester og bokføring" },
  { code: "69.202", name: "Revisjon", description: "Revisjonstjenester og økonomisk kontroll" },
  { code: "82.990", name: "Andre forretningsmessige tjenester", description: "Diverse forretningstjenester" },
  
  // Construction
  { code: "41.200", name: "Oppføring av bygninger", description: "Bygging av boliger og næringsbygg" },
  { code: "43.220", name: "Rørleggerarbeid, VVS-arbeid", description: "Sanitær, varme og ventilasjonsarbeid" },
  { code: "43.210", name: "Elektrisk installasjonsarbeid", description: "Elektriske installasjoner og vedlikehold" },
  { code: "43.110", name: "Riving av bygninger og andre konstruksjoner", description: "Rivingsarbeid og grunnarbeid" },
  
  // Trade
  { code: "46.900", name: "Uspesifisert engroshandel", description: "Generell engroshandel" },
  { code: "47.910", name: "Detaljhandel via post eller Internett", description: "Netthandel og e-handel" },
  { code: "47.190", name: "Butikkhandel med bredt vareutvalg ellers", description: "Dagligvarebutikker og kiosker" },
  
  // Real Estate
  { code: "68.200", name: "Utleie av egen eller leid fast eiendom", description: "Utleie av boliger og næringslokaler" },
  { code: "68.100", name: "Kjøp og salg av egen fast eiendom", description: "Eiendomsmegling og -utvikling" },
  { code: "68.320", name: "Eiendomsforvaltning", description: "Forvaltning av eiendommer" },
  
  // Professional Services
  { code: "71.121", name: "Teknisk konsulentvirksomhet", description: "Ingeniørtjenester og teknisk rådgivning" },
  { code: "71.122", name: "Bygningsteknisk konsulentvirksomhet", description: "Arkitekttjenester og byggeprosjektering" },
  { code: "69.101", name: "Juridisk tjenesteyting", description: "Advokatvirksomhet og juridisk rådgivning" },
  
  // Food & Hospitality
  { code: "56.101", name: "Restaurantvirksomhet", description: "Restauranter og serveringssteder" },
  { code: "56.102", name: "Gatekjøkken og kafeteriavirksomhet", description: "Hurtigmat og kaféer" },
  { code: "56.210", name: "Catering for enkeltarrangementer", description: "Catering og matservering" },
  
  // Transportation
  { code: "49.410", name: "Godstransport på veg", description: "Lastebiltransport og varetransport" },
  { code: "49.320", name: "Drosjebiltransport", description: "Taxitjenester" },
  
  // Health & Care
  { code: "86.101", name: "Sykehusvirksomhet", description: "Sykehus og medisinske tjenester" },
  { code: "86.210", name: "Allmennlegetjenester", description: "Fastleger og allmennpraksis" },
  { code: "86.230", name: "Tannhelsetjenester", description: "Tannleger og tannklinikker" },
  { code: "87.101", name: "Sykehjem", description: "Pleie- og omsorgstjenester" },
  
  // Education
  { code: "85.100", name: "Barnehager", description: "Barnehager og førskolevirksomhet" },
  { code: "85.510", name: "Undervisning innen idrett og rekreasjon", description: "Treningssentre og idrettsundervisning" },
  
  // Marketing & Media
  { code: "73.110", name: "Reklamebyråer", description: "Reklame og markedsføring" },
  { code: "73.120", name: "Formidling av reklameplass og -tid", description: "Annonsemegling" },
  { code: "58.190", name: "Annen utgivelsesvirksomhet", description: "Forlag og publisering" },
  
  // Manufacturing
  { code: "25.110", name: "Produksjon av metallkonstruksjoner", description: "Metallarbeider og konstruksjoner" },
  { code: "16.230", name: "Produksjon av andre byggevarer av tre", description: "Treproduksjon og snekkerarbeid" },
  
  // Personal Services
  { code: "96.021", name: "Frisering og annen skjønnhetspleie", description: "Frisører og skjønnhetssalonger" },
  { code: "95.220", name: "Reparasjon av husholdningsvarer og varer til personlig bruk", description: "Reparasjonstjenester" },
] as const;

export type Naeringskode = typeof COMMON_NAERINGSKODER[number];
