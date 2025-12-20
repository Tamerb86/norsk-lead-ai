import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Building2, FileText } from "lucide-react";

export default function Terms() {
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Vilkår og betingelser
            </h1>
            <p className="text-gray-600">
              Sist oppdatert: {new Date().toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-8 prose prose-blue max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Avtaleforhold</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Disse vilkårene regulerer din bruk av NorskLeads-tjenesten levert av <strong>Nexify CRM systems AS</strong> 
                (organisasjonsnummer 936300278), heretter kalt "Nexify", "vi", "oss" eller "vår". 
                Ved å registrere deg og bruke tjenesten aksepterer du disse vilkårene i sin helhet.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. Tjenestebeskrivelse</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                NorskLeads er en SaaS-plattform (Software as a Service) for B2B lead generering som gir tilgang til:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>Søk i norske bedriftsdata fra offentlige registre</li>
                <li>Verktøy for å opprette og administrere e-postkampanjer</li>
                <li>CRM-funksjonalitet for å administrere leads og kundeforhold</li>
                <li>Analyse og rapportering av kampanjeresultater</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. Registrering og konto</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For å bruke tjenesten må du:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>Være minst 18 år eller representere en juridisk enhet</li>
                <li>Oppgi korrekt og fullstendig informasjon ved registrering</li>
                <li>Holde påloggingsinformasjon konfidensiell</li>
                <li>Varsle oss umiddelbart ved mistanke om uautorisert bruk</li>
                <li>Være ansvarlig for all aktivitet på din konto</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. Abonnement og betaling</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.1 Abonnementsplaner</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Vi tilbyr ulike abonnementsplaner med forskjellige funksjoner og priser. 
                Prisene er oppgitt i norske kroner (NOK) eksklusiv merverdiavgift (mva).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 Fakturering</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>Abonnementet faktureres månedlig eller årlig, avhengig av valgt plan</li>
                <li>Betaling forfaller ved starten av hver fakturaperiode</li>
                <li>Ved manglende betaling kan tjenesten suspenderes etter 14 dager</li>
                <li>Vi aksepterer betaling via kredittkort, Vipps, og faktura (kun for Enterprise)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Prisendringer</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi forbeholder oss retten til å endre priser med minst 30 dagers varsel. 
                Prisendringer gjelder fra neste faktureringsperiode. Hvis du ikke aksepterer 
                prisendringen, kan du si opp abonnementet før endringen trer i kraft.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. Prøveperiode</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Nye kunder kan få tilgang til en 14-dagers gratis prøveperiode. Ingen kredittkort 
                kreves for å starte prøveperioden. Etter prøveperiodens utløp må du velge en 
                betalingsplan for å fortsette å bruke tjenesten.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. Oppsigelse og refusjon</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.1 Oppsigelse fra din side</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>Du kan si opp abonnementet når som helst via innstillinger i kontoen din</li>
                <li>Oppsigelsen trer i kraft ved slutten av gjeldende faktureringsperiode</li>
                <li>Du har tilgang til tjenesten frem til oppsigelsen trer i kraft</li>
                <li>Ingen refusjon gis for ubrukt tid i gjeldende periode</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.2 Oppsigelse fra vår side</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi kan si opp avtalen med umiddelbar virkning hvis du bryter disse vilkårene, 
                inkludert men ikke begrenset til misbruk av tjenesten, manglende betaling, 
                eller ulovlig aktivitet.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. Akseptabel bruk</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Du forplikter deg til å:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Bruke tjenesten i samsvar med gjeldende lover og forskrifter</li>
                <li>Respektere mottakeres rett til å reservere seg mot markedsføring</li>
                <li>Følge GDPR og norsk personvernlovgivning</li>
                <li>Ikke sende spam eller uønsket e-post</li>
                <li>Ikke bruke tjenesten til ulovlige eller skadelige formål</li>
                <li>Ikke forsøke å få uautorisert tilgang til systemene våre</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Brudd på disse reglene kan føre til umiddelbar suspensjon eller avslutning av kontoen din.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. Immaterielle rettigheter</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Alle immaterielle rettigheter til tjenesten, inkludert men ikke begrenset til 
                programvare, design, tekst, grafikk, og varemerker, eies av Nexify eller våre 
                lisensgivere. Du får en begrenset, ikke-eksklusiv, ikke-overførbar lisens til 
                å bruke tjenesten i samsvar med disse vilkårene.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. Dine data</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Du beholder alle rettigheter til data du laster opp eller oppretter i tjenesten. 
                Du gir oss en begrenset lisens til å behandle disse dataene for å levere tjenesten. 
                Vi vil ikke dele eller selge dine data til tredjeparter uten ditt samtykke, med 
                unntak av det som er nødvendig for å levere tjenesten eller som påkrevd av loven.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">10. Datasikkerhet og backup</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi implementerer bransjestandarder for sikkerhet og tar regelmessige backups av data. 
                Vi kan imidlertid ikke garantere 100% sikkerhet eller mot datatap. Du er ansvarlig 
                for å ta egne backups av kritiske data.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">11. Tjenestetilgjengelighet</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi streber etter høy oppetid, men kan ikke garantere at tjenesten alltid vil være 
                tilgjengelig. Vi forbeholder oss retten til å utføre vedlikehold, som kan medføre 
                midlertidig nedetid. Vi vil varsle om planlagt vedlikehold når det er mulig.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">12. Ansvarsbegrensning</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Tjenesten leveres "som den er" uten garantier av noen art. Vi er ikke ansvarlige for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>Indirekte tap, inkludert tapt fortjeneste eller goodwill</li>
                <li>Tap som følge av nedetid eller datatap</li>
                <li>Tap forårsaket av tredjeparter eller eksterne faktorer</li>
                <li>Tap som overstiger beløpet du har betalt for tjenesten de siste 12 månedene</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Denne ansvarsbegrensningen gjelder i den utstrekning det er tillatt av norsk lov.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">13. Endringer i vilkårene</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Vi kan oppdatere disse vilkårene fra tid til annen. Ved vesentlige endringer vil 
                vi varsle deg via e-post eller gjennom tjenesten minst 30 dager før endringene 
                trer i kraft. Fortsatt bruk av tjenesten etter at endringene har trådt i kraft 
                betyr at du aksepterer de nye vilkårene.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">14. Tvisteløsning og lovvalg</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Disse vilkårene er underlagt norsk lov. Tvister skal søkes løst i minnelighet. 
                Hvis en minnelig løsning ikke er mulig, skal tvisten avgjøres av norske domstoler 
                med Oslo tingrett som verneting.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">15. Kontaktinformasjon</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Hvis du har spørsmål om disse vilkårene, kan du kontakte oss:
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Nexify CRM systems AS</strong><br />
                Organisasjonsnummer: 936300278<br />
                E-post: <a href="mailto:kontakt@nexify.no" className="text-blue-600 hover:underline">kontakt@nexify.no</a><br />
                Telefon: +47 XXX XX XXX<br />
                Adresse: Oslo, Norge
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
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
