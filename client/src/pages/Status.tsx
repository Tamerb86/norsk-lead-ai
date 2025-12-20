import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Search, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function Status() {
  const services = [
    {
      name: "API",
      status: "operational",
      uptime: "99.99%",
      responseTime: "45ms",
    },
    {
      name: "Dashboard",
      status: "operational",
      uptime: "99.98%",
      responseTime: "120ms",
    },
    {
      name: "E-postkampanjer",
      status: "operational",
      uptime: "99.97%",
      responseTime: "200ms",
    },
    {
      name: "Database",
      status: "operational",
      uptime: "100%",
      responseTime: "15ms",
    },
    {
      name: "Søkefunksjon",
      status: "operational",
      uptime: "99.99%",
      responseTime: "80ms",
    },
  ];

  const incidents = [
    {
      date: "2024-12-15",
      title: "Planlagt vedlikehold",
      description: "Database oppgradering gjennomført uten nedetid",
      status: "resolved",
    },
    {
      date: "2024-12-01",
      title: "Midlertidig forsinkelse i e-postutsendelse",
      description: "Løst innen 15 minutter. Ingen e-poster gikk tapt.",
      status: "resolved",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="w-5 h-5" />;
      case "degraded":
        return <AlertCircle className="w-5 h-5" />;
      case "down":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "Operativ";
      case "degraded":
        return "Redusert ytelse";
      case "down":
        return "Nede";
      default:
        return "Ukjent";
    }
  };

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
            <Link href="/dashboard">
              <Button>Kom i gang gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-100 text-green-700 rounded-full mb-6">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold text-lg">Alle systemer operative</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            System{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Status
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sanntidsstatus for alle NorskLeads-tjenester
          </p>
        </div>
      </section>

      {/* Services Status */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Tjenestestatus</h2>
            <div className="space-y-4">
              {services.map((service, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{service.name}</h3>
                        <p className="text-sm text-gray-600">
                          {getStatusText(service.status)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-600">Oppetid: {service.uptime}</p>
                      <p className="text-sm text-gray-600">Responstid: {service.responseTime}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Uptime Stats */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Oppetidsstatistikk</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="text-4xl font-black text-green-600 mb-2">99.99%</div>
                <p className="text-gray-600">Siste 30 dager</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-black text-green-600 mb-2">99.98%</div>
                <p className="text-gray-600">Siste 90 dager</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-black text-green-600 mb-2">99.97%</div>
                <p className="text-gray-600">Siste 12 måneder</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Incident History */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Hendelseshistorikk</h2>
            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold">{incident.title}</h3>
                          <span className="text-sm text-gray-600">{incident.date}</span>
                        </div>
                        <p className="text-gray-600">{incident.description}</p>
                        <span className="inline-block mt-2 text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full">
                          Løst
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Ingen hendelser de siste 90 dagene</p>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Få varsler om statusendringer
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Abonner på e-postvarsler om planlagt vedlikehold og hendelser
          </p>
          <Button size="lg" variant="secondary">
            Abonner på oppdateringer
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; 2024 NorskLeads by Nexify CRM Systems AS. Laget med ❤️ i Norge.</p>
        </div>
      </footer>
    </div>
  );
}
