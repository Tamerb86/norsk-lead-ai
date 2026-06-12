import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  Zap,
} from "lucide-react";
import { PageHelp, PAGE_DESCRIPTIONS } from "@/components/PageHelp";
import { toastSuccess, toastError } from "@/lib/toast-utils";

export default function AutoEnrichment() {
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);

  // Fetch enrichment stats
  const { data: stats, isLoading, refetch } = trpc.enrichment.getStats.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch scheduler status
  const { data: schedulerStatus } = trpc.enrichment.getSchedulerStatus.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Mutations
  const startEnrichment = trpc.enrichment.startAutoEnrichment.useMutation({
    onSuccess: (data) => {
      toastSuccess("Automatisk berikelse startet!", {
        description: `${data.queued} bedrifter lagt til i køen`,
      });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke starte berikelse", {
        description: error.message,
      });
    },
  });

  const retryFailed = trpc.enrichment.retryFailedJobs.useMutation({
    onSuccess: (data) => {
      toastSuccess("Feilede jobber startet på nytt!", {
        description: `${data.retried} jobber prøves igjen`,
      });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke starte jobber på nytt", {
        description: error.message,
      });
    },
  });

  const clearOldJobs = trpc.enrichment.clearOldJobs.useMutation({
    onSuccess: (data) => {
      toastSuccess("Gamle jobber slettet!", {
        description: `${data.cleared} jobber fjernet`,
      });
      refetch();
    },
    onError: (error) => {
      toastError("Kunne ikke slette jobber", {
        description: error.message,
      });
    },
  });

  const handleStartEnrichment = async () => {
    setIsStarting(true);
    try {
      await startEnrichment.mutateAsync();
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Laster berikelsesdata...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalJobs = stats?.total || 0;
  const pendingJobs = stats?.pending || 0;
  const processingJobs = stats?.processing || 0;
  const completedJobs = stats?.completed || 0;
  const failedJobs = stats?.failed || 0;
  const averageTime = stats?.averageTime || 0;

  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const failureRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <PageHelp
              title="Automatisk berikelse"
              description="Automatisk berikelse av bedriftsdata med AI og Brreg API. Systemet fyller ut manglende informasjon som e-post, telefon, smertepunkter og nøkkelkontakter."
            />
            <p className="text-muted-foreground mt-1">
              Berik bedriftsdata automatisk med AI og Brreg API
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStartEnrichment}
              disabled={isStarting || startEnrichment.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Starter...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start berikelse
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Oppdater
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                Alle berikelsesjobbber
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventende</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingJobs}</div>
              <p className="text-xs text-muted-foreground">
                I kø for behandling
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fullført</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedJobs}</div>
              <p className="text-xs text-muted-foreground">
                {completionRate.toFixed(1)}% suksessrate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feilet</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedJobs}</div>
              <p className="text-xs text-muted-foreground">
                {failureRate.toFixed(1)}% feilrate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Fremdrift</CardTitle>
            <CardDescription>
              Sanntidsvisning av berikelsesfremdrift
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fullført</span>
                <span className="font-medium">{completedJobs} / {totalJobs}</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{pendingJobs}</p>
                  <p className="text-xs text-muted-foreground">Ventende</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium">{processingJobs}</p>
                  <p className="text-xs text-muted-foreground">Behandles nå</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{averageTime.toFixed(1)}s</p>
                  <p className="text-xs text-muted-foreground">Gjennomsnitt</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduler Status */}
        <Card>
          <CardHeader>
            <CardTitle>Planlegger-status</CardTitle>
            <CardDescription>
              Status for automatiske berikelsesplanleggere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${schedulerStatus?.workerRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium">Berikelsesarbeider</p>
                    <p className="text-sm text-muted-foreground">Behandler kø hvert minutt</p>
                  </div>
                </div>
                <Badge variant={schedulerStatus?.workerRunning ? "default" : "secondary"}>
                  {schedulerStatus?.workerRunning ? "Kjører" : "Stoppet"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${schedulerStatus?.autoEnrichRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium">Auto-berikelse</p>
                    <p className="text-sm text-muted-foreground">Legger til nye bedrifter daglig</p>
                  </div>
                </div>
                <Badge variant={schedulerStatus?.autoEnrichRunning ? "default" : "secondary"}>
                  {schedulerStatus?.autoEnrichRunning ? "Kjører" : "Stoppet"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Handlinger</CardTitle>
            <CardDescription>
              Administrer berikelseskøen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => retryFailed.mutate()}
                disabled={retryFailed.isPending || failedJobs === 0}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Prøv feilede jobber på nytt ({failedJobs})
              </Button>

              <Button
                variant="outline"
                onClick={() => clearOldJobs.mutate({ daysOld: 30 })}
                disabled={clearOldJobs.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Slett gamle jobber (30+ dager)
              </Button>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Hvordan fungerer automatisk berikelse?
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Systemet finner bedrifter uten berikelse automatisk</li>
                <li>Legger dem til i køen for behandling</li>
                <li>Bruker Brreg API for offisielle data</li>
                <li>Bruker AI for manglende informasjon</li>
                <li>Oppdaterer bedriftsdata automatisk</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
