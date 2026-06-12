import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Inbox as InboxIcon,
  Mail,
  Building2,
  Archive,
  RotateCcw,
  Sparkles,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

const STATUS_VALUES = ["received", "drafted", "replied", "ignored"] as const;
type InboxStatus = (typeof STATUS_VALUES)[number];

// Negative/terminal categories the backend refuses to draft or send replies for.
// Mirrors isTerminalCategory() in server/services/replyClassifier.ts.
const TERMINAL_CLASSIFICATIONS = new Set([
  "unsubscribe",
  "not_interested",
  "spam",
  "bounce",
]);

const statusLabels: Record<InboxStatus, string> = {
  received: "Mottatt",
  drafted: "Utkast",
  replied: "Besvart",
  ignored: "Ignorert",
};

const classificationLabels: Record<string, string> = {
  interested: "Interessert",
  not_interested: "Ikke interessert",
  meeting_request: "Møteforespørsel",
  more_info: "Mer info",
  unsubscribe: "Avmeldt",
  out_of_office: "Fraværende",
  bounce: "Ugyldig e-post",
  referral: "Henvisning",
  pricing: "Pris",
  neutral: "Nøytral",
  spam: "Spam",
};

// Classification badge colored by sentiment.
function sentimentBadgeClass(sentiment: string | null | undefined): string {
  switch (sentiment) {
    case "positive":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "negative":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function classificationLabel(classification: string | null | undefined): string {
  if (!classification) return "Ukjent";
  return classificationLabels[classification] ?? classification;
}

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: nb });
  } catch {
    return String(date);
  }
}

export default function Inbox() {
  // "all" sentinel — Radix SelectItem must never have value="".
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Editable draft fields — the owner can edit the AI draft before sending.
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const limit = 25;

  const utils = trpc.useUtils();

  const listInput = {
    status: statusFilter === "all" ? undefined : (statusFilter as InboxStatus),
    classification: classificationFilter === "all" ? undefined : classificationFilter,
    limit,
    offset: page * limit,
  };

  const { data: list, isLoading } = trpc.inbox.list.useQuery(listInput);
  const { data: stats } = trpc.inbox.stats.useQuery();
  const { data: detail, isLoading: detailLoading } = trpc.inbox.get.useQuery(
    { id: selectedId ?? 0 },
    { enabled: selectedId !== null }
  );

  const invalidateAll = () => {
    utils.inbox.list.invalidate();
    utils.inbox.stats.invalidate();
    if (selectedId !== null) utils.inbox.get.invalidate({ id: selectedId });
  };

  const markIgnoredMutation = trpc.inbox.markIgnored.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Melding ignorert");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke ignorere meldingen");
    },
  });

  const reopenMutation = trpc.inbox.reopen.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Melding gjenåpnet");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke gjenåpne meldingen");
    },
  });

  const generateDraftMutation = trpc.inbox.generateDraft.useMutation({
    onSuccess: (draft) => {
      // Pre-fill the editable fields with the freshly generated draft.
      setDraftSubject(draft.subject);
      setDraftBody(draft.body);
      invalidateAll();
      toast.success("AI-utkast generert");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke generere utkast");
    },
  });

  const sendReplyMutation = trpc.inbox.sendReply.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Svar sendt");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke sende svar");
    },
  });

  // Seed the editable draft fields from the stored draft whenever the open
  // message (or its persisted draft) changes — so re-opening a "drafted"
  // message restores the saved text for further editing.
  const detailId = detail?.message.id;
  const storedDraftReply = detail?.message.draftReply ?? "";
  const storedDraftSubject = detail?.message.draftSubject ?? "";
  useEffect(() => {
    setDraftSubject(storedDraftSubject);
    setDraftBody(storedDraftReply);
  }, [detailId, storedDraftReply, storedDraftSubject]);

  const messages = list?.messages ?? [];
  const total = list?.total ?? 0;
  const hasFilters = statusFilter !== "all" || classificationFilter !== "all";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <InboxIcon className="h-6 w-6 text-indigo-600" />
              Innboks
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Svar fra leads</p>
          </div>
          {stats && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Totalt: {stats.total}</Badge>
              {STATUS_VALUES.map((status) =>
                stats.byStatus[status] ? (
                  <Badge key={status} variant="outline">
                    {statusLabels[status]}: {stats.byStatus[status]}
                  </Badge>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(0);
                  setSelectedId(null);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px] dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Alle statuser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  <SelectItem value="received">Mottatt</SelectItem>
                  <SelectItem value="drafted">Utkast</SelectItem>
                  <SelectItem value="replied">Besvart</SelectItem>
                  <SelectItem value="ignored">Ignorert</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={classificationFilter}
                onValueChange={(value) => {
                  setClassificationFilter(value);
                  setPage(0);
                  setSelectedId(null);
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px] dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Alle kategorier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kategorier</SelectItem>
                  {Object.entries(classificationLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* List + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Message list */}
          <Card className={`dark:bg-gray-800 ${selectedId !== null ? "lg:col-span-2" : "lg:col-span-5"}`}>
            <CardHeader>
              <CardTitle className="dark:text-white">Meldinger</CardTitle>
              <CardDescription className="dark:text-gray-400">
                {total} {total === 1 ? "melding" : "meldinger"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border rounded-lg dark:border-gray-700">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => setSelectedId(message.id)}
                      className={`w-full text-left flex items-start gap-4 p-4 border rounded-lg transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 ${
                        selectedId === message.id
                          ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-900/20"
                          : ""
                      }`}
                    >
                      <div className="p-2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {message.companyName || message.fromEmail}
                          </span>
                          <Badge className={`text-xs ${sentimentBadgeClass(message.sentiment)}`}>
                            {classificationLabel(message.classification)}
                          </Badge>
                          {typeof message.confidence === "number" && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {message.confidence}%
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {statusLabels[message.status as InboxStatus] ?? message.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                          {message.subject || "(Uten emne)"}
                        </p>
                        {message.preview && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {message.preview}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {message.fromEmail} • {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))}

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="dark:bg-gray-700 dark:border-gray-600"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Forrige
                    </Button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Side {page + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= total}
                      className="dark:bg-gray-700 dark:border-gray-600"
                    >
                      Neste
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <InboxIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {hasFilters ? "Ingen meldinger matcher filtrene" : "Ingen svar ennå"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {hasFilters
                      ? "Prøv å endre eller nullstille filtrene for å se flere meldinger."
                      : "Når leads svarer på e-postene dine, dukker de opp her. Svar fanges opp automatisk fra kampanjene dine."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail view */}
          {selectedId !== null && (
            <Card className="dark:bg-gray-800 lg:col-span-3">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="dark:text-white truncate">
                      {detail?.message.subject || "(Uten emne)"}
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400 mt-1">
                      {detail?.message.fromEmail}
                      {detail?.companyName ? ` • ${detail.companyName}` : ""}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedId(null)}
                    aria-label="Lukk detaljer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {detailLoading || !detail ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={sentimentBadgeClass(detail.message.sentiment)}>
                        {classificationLabel(detail.message.classification)}
                      </Badge>
                      {typeof detail.message.confidence === "number" && (
                        <Badge variant="outline">
                          Sikkerhet: {detail.message.confidence}%
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Status: {statusLabels[detail.message.status as InboxStatus] ?? detail.message.status}
                      </Badge>
                      {detail.leadStatus && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Lead: {detail.leadStatus}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Mottatt {formatTime(detail.message.createdAt)}
                      {detail.leadEmailSentAt &&
                        ` • E-post sendt ${formatTime(detail.leadEmailSentAt)}`}
                    </p>

                    {/* Body */}
                    <div className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                        {detail.message.bodyText || "(Ingen meldingstekst)"}
                      </p>
                    </div>

                    {/* Assisted reply workflow (phase 3) */}
                    {(() => {
                      const isTerminal = TERMINAL_CLASSIFICATIONS.has(
                        detail.message.classification ?? ""
                      );
                      const isReplied = detail.message.status === "replied";
                      const hasDraft = draftBody.trim().length > 0;
                      // Show the "Generer AI-utkast" button for non-terminal
                      // messages that are still in received/drafted state.
                      const canGenerate =
                        !isTerminal &&
                        (detail.message.status === "received" ||
                          detail.message.status === "drafted");

                      if (isTerminal) {
                        // Negative/terminal categories: no follow-up offered.
                        return (
                          <div className="p-4 border border-dashed rounded-lg dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Negativt svar – ingen oppfølging
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="p-4 border border-dashed rounded-lg dark:border-gray-700 space-y-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              AI-utkast
                            </h4>
                          </div>

                          {isReplied ? (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Svar er sendt på denne meldingen.
                            </p>
                          ) : hasDraft ? (
                            // Editable draft — owner can edit before sending.
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label htmlFor="draft-subject">Emne</Label>
                                <Input
                                  id="draft-subject"
                                  value={draftSubject}
                                  onChange={(e) => setDraftSubject(e.target.value)}
                                  placeholder="Emne for svaret"
                                  className="dark:bg-gray-700 dark:border-gray-600"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="draft-body">Melding</Label>
                                <Textarea
                                  id="draft-body"
                                  value={draftBody}
                                  onChange={(e) => setDraftBody(e.target.value)}
                                  rows={8}
                                  placeholder="Skriv eller rediger svaret ditt"
                                  className="dark:bg-gray-700 dark:border-gray-600"
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  onClick={() =>
                                    sendReplyMutation.mutate({
                                      id: detail.message.id,
                                      subject: draftSubject,
                                      body: draftBody,
                                    })
                                  }
                                  disabled={
                                    sendReplyMutation.isPending ||
                                    draftSubject.trim().length === 0 ||
                                    draftBody.trim().length === 0
                                  }
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  {sendReplyMutation.isPending ? "Sender…" : "Send svar"}
                                </Button>
                                {canGenerate && (
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      generateDraftMutation.mutate({ id: detail.message.id })
                                    }
                                    disabled={generateDraftMutation.isPending}
                                    className="dark:bg-gray-700 dark:border-gray-600"
                                  >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {generateDraftMutation.isPending
                                      ? "Genererer…"
                                      : "Generer på nytt"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            // No draft yet — offer to generate one.
                            <div className="space-y-3">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Generer et forslag til svar på norsk, rediger det og send.
                              </p>
                              <Button
                                onClick={() =>
                                  generateDraftMutation.mutate({ id: detail.message.id })
                                }
                                disabled={generateDraftMutation.isPending}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                {generateDraftMutation.isPending
                                  ? "Genererer…"
                                  : "Generer AI-utkast"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Ignore / re-open controls */}
                    <div className="flex items-center gap-2">
                      {detail.message.status === "ignored" ? (
                        <Button
                          variant="outline"
                          onClick={() => reopenMutation.mutate({ id: detail.message.id })}
                          disabled={reopenMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {reopenMutation.isPending ? "Gjenåpner..." : "Gjenåpne"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => markIgnoredMutation.mutate({ id: detail.message.id })}
                          disabled={markIgnoredMutation.isPending}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {markIgnoredMutation.isPending ? "Ignorerer..." : "Ignorer"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
