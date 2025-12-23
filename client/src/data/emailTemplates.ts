// نماذج إيميلات جاهزة للاستخدام
export interface EmailTemplate {
  id: string;
  name: string;
  nameNo: string;
  category: string;
  categoryNo: string;
  subject: string;
  body: string;
  description: string;
  descriptionNo: string;
}

export const prebuiltTemplates: EmailTemplate[] = [
  // Cold Outreach - التواصل البارد
  {
    id: "cold-intro-1",
    name: "Professional Introduction",
    nameNo: "Profesjonell introduksjon",
    category: "Cold Outreach",
    categoryNo: "Kald kontakt",
    subject: "Samarbeidsmulighet med {{company_name}}",
    body: `Hei {{contact_name}},

Jeg håper denne e-posten finner deg vel. Mitt navn er {{sender_name}} fra {{sender_company}}.

Jeg tok kontakt fordi jeg la merke til at {{company_name}} gjør imponerende arbeid innen {{industry}}. Vi hjelper bedrifter som dere med å [beskriv verdi/løsning].

Jeg vil gjerne dele noen ideer om hvordan vi kan hjelpe {{company_name}} med å [spesifikt resultat].

Har du 15 minutter til en kort samtale denne uken?

Med vennlig hilsen,
{{sender_name}}
{{sender_company}}
{{sender_phone}}`,
    description: "A professional first contact email for B2B outreach",
    descriptionNo: "En profesjonell førstegangs e-post for B2B-kontakt"
  },
  {
    id: "cold-intro-2",
    name: "Value Proposition",
    nameNo: "Verdiforslag",
    category: "Cold Outreach",
    categoryNo: "Kald kontakt",
    subject: "Øk {{company_name}}s [resultat] med 30%",
    body: `Hei {{contact_name}},

Jeg ser at {{company_name}} er aktiv i {{industry}}-bransjen, og jeg tror vi kan hjelpe dere med å oppnå bedre resultater.

Vi har hjulpet lignende bedrifter med å:
• Øke [metrikk] med 30%
• Redusere [kostnad/tid] med 25%
• Forbedre [prosess] betydelig

Jeg vil gjerne vise deg hvordan vi kan gjøre det samme for {{company_name}}.

Er du tilgjengelig for en 10-minutters samtale denne uken?

Beste hilsen,
{{sender_name}}`,
    description: "Focus on specific value and results",
    descriptionNo: "Fokus på spesifikk verdi og resultater"
  },
  
  // Follow-up - Oppfølging
  {
    id: "followup-1",
    name: "Gentle Follow-up",
    nameNo: "Vennlig oppfølging",
    category: "Follow-up",
    categoryNo: "Oppfølging",
    subject: "Re: Samarbeidsmulighet med {{company_name}}",
    body: `Hei {{contact_name}},

Jeg ville bare følge opp min forrige e-post. Jeg forstår at du sikkert har mye å gjøre.

Jeg tror fortsatt at vi kan tilføre verdi til {{company_name}}, spesielt når det gjelder [spesifikt område].

Hvis timingen ikke er riktig akkurat nå, setter jeg pris på om du kan gi meg beskjed, så kan vi eventuelt ta kontakt igjen senere.

Med vennlig hilsen,
{{sender_name}}`,
    description: "A polite follow-up after no response",
    descriptionNo: "En høflig oppfølging etter ingen svar"
  },
  {
    id: "followup-2",
    name: "Second Follow-up",
    nameNo: "Andre oppfølging",
    category: "Follow-up",
    categoryNo: "Oppfølging",
    subject: "Siste forsøk - {{company_name}}",
    body: `Hei {{contact_name}},

Jeg har sendt et par e-poster tidligere, men har ikke hørt fra deg. Jeg vil ikke være til bry, så dette blir min siste oppfølging.

Hvis du er interessert i å lære mer om hvordan vi kan hjelpe {{company_name}}, er jeg her.

Hvis ikke, ønsker jeg deg alt godt!

Beste hilsen,
{{sender_name}}`,
    description: "Final follow-up before closing the loop",
    descriptionNo: "Siste oppfølging før avslutning"
  },

  // Meeting Request - Møteforespørsel
  {
    id: "meeting-1",
    name: "Meeting Request",
    nameNo: "Møteforespørsel",
    category: "Meeting",
    categoryNo: "Møte",
    subject: "Kort møte - {{company_name}} & {{sender_company}}",
    body: `Hei {{contact_name}},

Jeg vil gjerne invitere deg til et kort møte for å diskutere hvordan {{sender_company}} kan hjelpe {{company_name}} med [spesifikt mål].

Foreslåtte tidspunkter:
• [Dag 1] kl. [tid]
• [Dag 2] kl. [tid]
• [Dag 3] kl. [tid]

Møtet vil ta ca. 20 minutter, og vi kan gjøre det via Teams, Zoom eller telefon - hva som passer best for deg.

Gi meg beskjed om noen av disse tidene fungerer, eller foreslå gjerne et annet tidspunkt.

Med vennlig hilsen,
{{sender_name}}
{{sender_phone}}`,
    description: "Request a meeting with specific time slots",
    descriptionNo: "Be om et møte med spesifikke tidspunkter"
  },

  // Partnership - Partnerskap
  {
    id: "partnership-1",
    name: "Partnership Proposal",
    nameNo: "Partnerskapsforslag",
    category: "Partnership",
    categoryNo: "Partnerskap",
    subject: "Partnerskapsmulighet mellom {{company_name}} og {{sender_company}}",
    body: `Hei {{contact_name}},

Jeg representerer {{sender_company}}, og vi er imponert over arbeidet {{company_name}} gjør i {{industry}}.

Vi ser et potensielt partnerskap som kan være gjensidig fordelaktig:

For {{company_name}}:
• [Fordel 1]
• [Fordel 2]

For {{sender_company}}:
• [Fordel 1]
• [Fordel 2]

Jeg vil gjerne utforske dette nærmere med deg. Har du tid til en samtale neste uke?

Med vennlig hilsen,
{{sender_name}}
{{sender_title}}
{{sender_company}}`,
    description: "Propose a business partnership",
    descriptionNo: "Foreslå et forretningspartnerskap"
  },

  // Thank You - Takk
  {
    id: "thankyou-1",
    name: "Thank You After Meeting",
    nameNo: "Takk etter møte",
    category: "Thank You",
    categoryNo: "Takk",
    subject: "Takk for møtet, {{contact_name}}!",
    body: `Hei {{contact_name}},

Tusen takk for at du tok deg tid til å møte meg i dag. Det var veldig nyttig å lære mer om {{company_name}} og deres behov.

Som diskutert, her er en oppsummering av neste steg:
• [Punkt 1]
• [Punkt 2]
• [Punkt 3]

Jeg sender over [dokument/forslag] innen [dato].

Ikke nøl med å ta kontakt hvis du har spørsmål i mellomtiden.

Beste hilsen,
{{sender_name}}`,
    description: "Thank you email after a meeting",
    descriptionNo: "Takke-e-post etter et møte"
  },

  // Referral - Henvisning
  {
    id: "referral-1",
    name: "Referral Request",
    nameNo: "Henvisningsforespørsel",
    category: "Referral",
    categoryNo: "Henvisning",
    subject: "Kjenner du noen som kan ha nytte av dette?",
    body: `Hei {{contact_name}},

Jeg håper alt er bra med deg og {{company_name}}.

Vi har nylig hjulpet flere bedrifter i {{industry}} med å [oppnå resultat], og jeg lurer på om du kjenner noen som kan ha nytte av våre tjenester?

Vi tilbyr [kort beskrivelse av tjeneste/produkt], og det fungerer spesielt godt for bedrifter som [målgruppe].

Hvis du har noen i nettverket ditt som kan være interessert, setter jeg stor pris på en introduksjon.

Takk på forhånd!

Med vennlig hilsen,
{{sender_name}}`,
    description: "Ask for referrals from existing contacts",
    descriptionNo: "Be om henvisninger fra eksisterende kontakter"
  },

  // Re-engagement - Gjenopptakelse
  {
    id: "reengagement-1",
    name: "Re-engagement",
    nameNo: "Gjenopptakelse av kontakt",
    category: "Re-engagement",
    categoryNo: "Gjenopptakelse",
    subject: "Det er en stund siden, {{contact_name}}",
    body: `Hei {{contact_name}},

Det er en stund siden vi snakket sist, og jeg ville bare sjekke inn og se hvordan det går med {{company_name}}.

Siden sist har vi [ny utvikling/produkt/tjeneste], som jeg tror kan være relevant for dere.

Jeg vil gjerne høre hva som er nytt hos dere og se om det er noe vi kan hjelpe med.

Har du tid til en kort prat?

Beste hilsen,
{{sender_name}}`,
    description: "Reconnect with old contacts",
    descriptionNo: "Gjenopprett kontakt med gamle kontakter"
  },

  // Product Launch - Produktlansering
  {
    id: "launch-1",
    name: "Product Launch Announcement",
    nameNo: "Produktlanseringsannonsering",
    category: "Announcement",
    categoryNo: "Kunngjøring",
    subject: "Nyhet: [Produktnavn] - Perfekt for {{company_name}}",
    body: `Hei {{contact_name}},

Spennende nyheter! Vi har nettopp lansert [produktnavn], og jeg tror det kan være svært relevant for {{company_name}}.

[Produktnavn] hjelper bedrifter med å:
✓ [Fordel 1]
✓ [Fordel 2]
✓ [Fordel 3]

Som en av våre verdsatte kontakter, vil jeg gjerne tilby deg [spesialtilbud/demo/prøveperiode].

Interessert i å lære mer?

Med vennlig hilsen,
{{sender_name}}`,
    description: "Announce a new product or service",
    descriptionNo: "Kunngjør et nytt produkt eller tjeneste"
  },

  // Event Invitation - Arrangementsinvitasjon
  {
    id: "event-1",
    name: "Event Invitation",
    nameNo: "Arrangementsinvitasjon",
    category: "Event",
    categoryNo: "Arrangement",
    subject: "Invitasjon: [Arrangementsnavn] - {{company_name}}",
    body: `Hei {{contact_name}},

Du er invitert til [arrangementsnavn]!

📅 Dato: [dato]
🕐 Tid: [tid]
📍 Sted: [sted/online]

Dette arrangementet er perfekt for deg hvis du ønsker å:
• [Læringsmål 1]
• [Læringsmål 2]
• Nettverke med andre i {{industry}}

Plassene er begrenset, så registrer deg i dag!

[Link til registrering]

Håper å se deg der!

Beste hilsen,
{{sender_name}}`,
    description: "Invite contacts to an event",
    descriptionNo: "Inviter kontakter til et arrangement"
  },

  // Case Study - Kundehistorie
  {
    id: "casestudy-1",
    name: "Case Study Share",
    nameNo: "Deling av kundehistorie",
    category: "Content",
    categoryNo: "Innhold",
    subject: "Hvordan [Kundenavn] oppnådde [resultat] - Relevant for {{company_name}}?",
    body: `Hei {{contact_name}},

Jeg ville dele en suksesshistorie som jeg tror kan være relevant for {{company_name}}.

[Kundenavn], en bedrift i {{industry}}, sto overfor [utfordring]. Ved å implementere vår løsning, oppnådde de:

📈 [Resultat 1 med tall]
💰 [Resultat 2 med tall]
⏱️ [Resultat 3 med tall]

Jeg har vedlagt hele kundehistorien, og vil gjerne diskutere hvordan vi kan oppnå lignende resultater for {{company_name}}.

Har du 15 minutter til en samtale?

Med vennlig hilsen,
{{sender_name}}`,
    description: "Share a relevant case study",
    descriptionNo: "Del en relevant kundehistorie"
  }
];

export const templateCategories = [
  { id: "all", name: "All Templates", nameNo: "Alle maler" },
  { id: "Cold Outreach", name: "Cold Outreach", nameNo: "Kald kontakt" },
  { id: "Follow-up", name: "Follow-up", nameNo: "Oppfølging" },
  { id: "Meeting", name: "Meeting", nameNo: "Møte" },
  { id: "Partnership", name: "Partnership", nameNo: "Partnerskap" },
  { id: "Thank You", name: "Thank You", nameNo: "Takk" },
  { id: "Referral", name: "Referral", nameNo: "Henvisning" },
  { id: "Re-engagement", name: "Re-engagement", nameNo: "Gjenopptakelse" },
  { id: "Announcement", name: "Announcement", nameNo: "Kunngjøring" },
  { id: "Event", name: "Event", nameNo: "Arrangement" },
  { id: "Content", name: "Content", nameNo: "Innhold" },
];
