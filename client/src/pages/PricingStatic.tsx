import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Search, CheckCircle2 } from "lucide-react";

// Static pricing plans
const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Basic",
    priceMonthly: 499,
    popular: false,
    features: [
      "500 søk per måned",
      "100 e-poster per måned",
      "Grunnleggende filtre",
      "E-post support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 999,
    popular: true,
    features: [
      "Ubegrenset søk",
      "1000 e-poster per måned",
      "Avanserte filtre",
      "Prioritert support",
      "API tilgang",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 2499,
    popular: false,
    features: [
      "Alt i Pro",
      "Ubegrenset e-poster",
      "Dedikert account manager",
      "Tilpassede integrasjoner",
      "SLA garanti",
    ],
  },
];

const formatPrice = (price: number) => `kr ${price}`;

export default function PricingStatic() {
  const faqs = [
    {
      question: "Kan jeg endre plan senere?",
      answer:
        "Ja, du kan oppgradere eller nedgradere planen din når som helst. Endringer trer i kraft umiddelbart.",
    },
    {
      question: "Hva skjer hvis jeg overskrider e-postgrensen?",
      answer:
        "Du vil motta en varsling når du når 80% av grensen. Du kan oppgradere planen eller kjøpe ekstra e-poster.",
    },
    {
      question: "Tilbyr dere refusjon?",
      answer:
        "Ja, vi tilbyr 14 dagers pengene-tilbake-garanti hvis du ikke er fornøyd med tjenesten.",
    },
    {
      question: "Kan jeg betale årlig?",
      answer:
        "Ja, vi tilbyr 20% rabatt ved årlig betaling. Kontakt oss for mer informasjon.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NorskLeads</h1>
                <p className="text-xs text-gray-600">Finn dine neste kunder</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button>Kom i gang gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Enkel og{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              transparent prising
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Velg planen som passer din bedrift. Alle planer inkluderer 14 dagers gratis
            prøveperiode.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`p-8 relative ${
                  plan.popular
                    ? "border-2 border-blue-600 shadow-2xl scale-105"
                    : "shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Mest populær
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                  <div className="mb-6">
                    <span className="text-5xl font-black">{formatPrice(plan.priceMonthly)}</span>
                    <span className="text-gray-600">/mnd</span>
                  </div>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Start abonnement
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-3">Inkludert:</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Ofte stilte spørsmål
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="p-6">
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-muted-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 NorskLeads. Alle rettigheter reservert.</p>
        </div>
      </footer>
    </div>
  );
}
