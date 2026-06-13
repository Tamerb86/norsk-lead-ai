import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Building2, Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    NorskLeads
                  </h1>
                  <p className="text-xs text-gray-600">by Nexify CRM systems AS</p>
                </div>
              </div>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Kom i gang
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Personvernserklæring
            </h1>
            <p className="text-gray-600">
              Sist oppdatert: {new Date().toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-8 prose prose-blue max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Behandlingsansvarlig</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                <strong>Nexify CRM systems AS</strong><br />
                Organisasjonsnummer: 936300278<br />
                Adresse: Oslo, Norge<br />
                E-post: kontakt@nexify.no
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                Nexify CRM systems AS er behandlingsansvarlig for behandlingen av personopplysninger 
                som beskrevet i denne personvernerklæringen.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. Hvilke personopplysninger samler vi inn?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vi samler inn følgende typer personopplysninger:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Kontoinformasjon:</strong> Navn, e-postadresse, telefonnummer, bedriftsnavn</li>
                <li><strong>Brukeraktivitet:</strong> Søkehistorikk, kampanjer opprettet, leads administrert</li>
                <li><strong>Teknisk informasjon:</strong> IP-adresse, nettlesertype, enhetsinformasjon</li>
                <li><strong>Betalingsinformasjon:</strong> Faktureringsadresse (betalingsdetaljer håndteres av tredjepartsleverandører)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. Formål med behandlingen</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vi behandler personopplysninger for følgende formål:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>Levere og administrere tjenesten NorskLeads</li>
                <li>Behandle betalinger og fakturering</li>
                <li>Kommunisere med deg om tjenesten</li>
                <li>Forbedre og utvikle tjenesten</li>
                <li>Oppfylle juridiske forpliktelser</li>
                <li>Forebygge svindel og misbruk</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. Rettslig grunnlag</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Behandlingen av personopplysninger er basert på:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Avtale:</strong> Nødvendig for å oppfylle avtalen med deg (GDPR art. 6(1)(b))</li>
                <li><strong>Samtykke:</strong> For markedsføring og nyhetsbrev (GDPR art. 6(1)(a))</li>
                <li><strong>Legitime interesser:</strong> For å forbedre tjenesten og forebygge misbruk (GDPR art. 6(1)(f))</li>
                <li><strong>Juridisk forpliktelse:</strong> For å oppfylle regnskapsloven og andre lover (GDPR art. 6(1)(c))</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. Deling av personopplysninger</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vi deler personopplysninger med:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Betalingsleverandører:</strong> For å behandle betalinger (f.eks. Stripe, Vipps)</li>
                <li><strong>E-posttjenester:</strong> For å sende kampanjer (f.eks. SendGrid)</li>
                <li><strong>Analysetjenester:</strong> For å forstå bruk av tjenesten</li>
                <li><strong>Offentlige myndigheter:</strong> Ved juridisk krav</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi selger aldri personopplysninger til tredjeparter.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. Overføring til tredjeland</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Personopplysninger lagres primært i Norge/EU. Ved bruk av enkelte tredjepartstjenester 
                (f.eks. skytjenester) kan data overføres til USA eller andre land. Vi sikrer at slike 
                overføringer skjer i samsvar med GDPR, inkludert bruk av standardavtaleklausuler (SCC) 
                og andre godkjente overføringsmekanismer.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. Lagringstid</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi lagrer personopplysninger så lenge det er nødvendig for formålene beskrevet i denne 
                erklæringen, eller så lenge loven krever det. Kontoinformasjon slettes når kontoen 
                avsluttes, med unntak av informasjon vi er pålagt å oppbevare (f.eks. regnskapsinformasjon 
                i 5 år etter regnskapsloven).
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. Dine rettigheter</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Du har følgende rettigheter etter GDPR:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Innsyn:</strong> Rett til å få kopi av dine personopplysninger</li>
                <li><strong>Retting:</strong> Rett til å rette uriktige opplysninger</li>
                <li><strong>Sletting:</strong> Rett til å få slettet personopplysninger ("retten til å bli glemt")</li>
                <li><strong>Begrensning:</strong> Rett til å begrense behandlingen</li>
                <li><strong>Dataportabilitet:</strong> Rett til å motta data i strukturert format</li>
                <li><strong>Protest:</strong> Rett til å protestere mot behandling basert på legitime interesser</li>
                <li><strong>Tilbaketrekking av samtykke:</strong> Når behandling er basert på samtykke</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                For å utøve dine rettigheter, kontakt oss på <a href="mailto:kontakt@nexify.no" className="text-blue-600 hover:underline">kontakt@nexify.no</a>
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Sikkerhet</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi implementerer passende tekniske og organisatoriske sikkerhetstiltak for å beskytte 
                personopplysninger mot uautorisert tilgang, endring, avsløring eller ødeleggelse. 
                Dette inkluderer kryptering, tilgangskontroll, og regelmessige sikkerhetsvurderinger.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">10. Informasjonskapsler (cookies)</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi bruker informasjonskapsler for å forbedre brukeropplevelsen, analysere bruk av 
                tjenesten, og for markedsføringsformål. Du kan administrere cookie-innstillinger 
                i nettleseren din. Vær oppmerksom på at enkelte funksjoner kan bli begrenset hvis 
                du blokkerer cookies.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">11. Klagerett</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Hvis du mener at behandlingen av dine personopplysninger er i strid med 
                personvernlovgivningen, har du rett til å klage til Datatilsynet:
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                <strong>Datatilsynet</strong><br />
                Postboks 458 Sentrum, 0105 Oslo<br />
                Telefon: 22 39 69 00<br />
                E-post: postkasse@datatilsynet.no<br />
                Nettside: <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.datatilsynet.no</a>
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">12. Endringer i personvernerklæringen</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi kan oppdatere denne personvernerklæringen fra tid til annen. Ved vesentlige endringer 
                vil vi varsle deg via e-post eller gjennom tjenesten. Vi oppfordrer deg til å gjennomgå 
                denne erklæringen regelmessig.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">13. Kontakt oss</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Hvis du har spørsmål om denne personvernerklæringen eller hvordan vi behandler 
                personopplysninger, kan du kontakte oss:
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Nexify CRM systems AS</strong><br />
                E-post: <a href="mailto:kontakt@nexify.no" className="text-blue-600 hover:underline">kontakt@nexify.no</a><br />
                Telefon: +47 XXX XX XXX<br />
                Adresse: Oslo, Norge
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-muted-foreground py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© 2025 Nexify CRM systems AS (Org.nr: 936300278). Alle rettigheter reservert.</p>
          <div className="mt-2 space-x-4">
            <Link href="/about" className="hover:text-white">Om oss</Link>
            <Link href="/privacy" className="hover:text-white">Personvern</Link>
            <Link href="/terms" className="hover:text-white">Vilkår</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
