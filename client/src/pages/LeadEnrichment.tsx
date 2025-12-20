import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function LeadEnrichment() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const validateEmailMutation = trpc.leads.validateEmail.useMutation();
  const validatePhoneMutation = trpc.leads.validatePhone.useMutation();
  const checkWebsiteMutation = trpc.leads.checkWebsite.useMutation();

  const handleValidateEmail = async () => {
    if (!email) return;
    validateEmailMutation.mutate({ email });
  };

  const handleValidatePhone = async () => {
    if (!phone) return;
    validatePhoneMutation.mutate({ phone });
  };

  const handleCheckWebsite = async () => {
    if (!website) return;
    checkWebsiteMutation.mutate({ url: website });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
      case "online":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "invalid":
      case "offline":
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "risky":
      case "unknown":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant =
      status === "valid" || status === "online"
        ? "default"
        : status === "invalid" || status === "offline" || status === "error"
          ? "destructive"
          : "secondary";

    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Lead Enrichment & Validation</h1>
        <p className="text-muted-foreground mt-2">
          Validate emails, phone numbers, and websites to improve lead quality
        </p>
      </div>

      {/* Email Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Email Validation</CardTitle>
          <CardDescription>
            Check email syntax, domain validity, and MX records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleValidateEmail()}
            />
            <Button
              onClick={handleValidateEmail}
              disabled={!email || validateEmailMutation.isPending}
            >
              {validateEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Validate"
              )}
            </Button>
          </div>

          {validateEmailMutation.data && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(validateEmailMutation.data.status)}
                  <span className="font-medium">{validateEmailMutation.data.email}</span>
                </div>
                {getStatusBadge(validateEmailMutation.data.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Score:</span>
                  <span className="ml-2 font-medium">{validateEmailMutation.data.score}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Valid:</span>
                  <span className="ml-2 font-medium">
                    {validateEmailMutation.data.isValid ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Checks:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {validateEmailMutation.data.checks.syntax ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Syntax</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {validateEmailMutation.data.checks.domain ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Domain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {validateEmailMutation.data.checks.mxRecords ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>MX Records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!validateEmailMutation.data.checks.disposable ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Not Disposable</span>
                  </div>
                </div>
              </div>

              {validateEmailMutation.data.reason && (
                <div className="text-sm text-muted-foreground">
                  {validateEmailMutation.data.reason}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phone Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Validation</CardTitle>
          <CardDescription>
            Validate Norwegian phone numbers (mobile and landline)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter phone number (e.g., +47 123 45 678)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleValidatePhone()}
            />
            <Button
              onClick={handleValidatePhone}
              disabled={!phone || validatePhoneMutation.isPending}
            >
              {validatePhoneMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Validate"
              )}
            </Button>
          </div>

          {validatePhoneMutation.data && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(validatePhoneMutation.data.status)}
                  <span className="font-medium">{validatePhoneMutation.data.phone}</span>
                </div>
                {getStatusBadge(validatePhoneMutation.data.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Score:</span>
                  <span className="ml-2 font-medium">{validatePhoneMutation.data.score}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 font-medium capitalize">{validatePhoneMutation.data.type}</span>
                </div>
              </div>

              {validatePhoneMutation.data.formatted && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Formatted:</span>
                  <span className="ml-2 font-medium">{validatePhoneMutation.data.formatted}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Checks:</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {validatePhoneMutation.data.checks.syntax ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Syntax</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {validatePhoneMutation.data.checks.length ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Length</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {validatePhoneMutation.data.checks.prefix ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Prefix</span>
                  </div>
                </div>
              </div>

              {validatePhoneMutation.data.reason && (
                <div className="text-sm text-muted-foreground">
                  {validatePhoneMutation.data.reason}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Website Checker */}
      <Card>
        <CardHeader>
          <CardTitle>Website Checker</CardTitle>
          <CardDescription>
            Check website availability, SSL, and response time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter website URL (e.g., example.com)"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckWebsite()}
            />
            <Button
              onClick={handleCheckWebsite}
              disabled={!website || checkWebsiteMutation.isPending}
            >
              {checkWebsiteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Check"
              )}
            </Button>
          </div>

          {checkWebsiteMutation.data && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(checkWebsiteMutation.data.status)}
                  <span className="font-medium">{checkWebsiteMutation.data.url}</span>
                </div>
                {getStatusBadge(checkWebsiteMutation.data.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Score:</span>
                  <span className="ml-2 font-medium">{checkWebsiteMutation.data.score}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status Code:</span>
                  <span className="ml-2 font-medium">
                    {checkWebsiteMutation.data.checks.statusCode || "N/A"}
                  </span>
                </div>
              </div>

              {checkWebsiteMutation.data.metadata.responseTime && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="ml-2 font-medium">
                    {checkWebsiteMutation.data.metadata.responseTime}ms
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Checks:</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {checkWebsiteMutation.data.checks.reachable ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Reachable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {checkWebsiteMutation.data.checks.ssl ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>SSL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {checkWebsiteMutation.data.checks.redirects ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Redirects</span>
                  </div>
                </div>
              </div>

              {checkWebsiteMutation.data.metadata.finalUrl &&
                checkWebsiteMutation.data.metadata.finalUrl !== checkWebsiteMutation.data.url && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Final URL:</span>
                    <span className="ml-2 font-medium">
                      {checkWebsiteMutation.data.metadata.finalUrl}
                    </span>
                  </div>
                )}

              {checkWebsiteMutation.data.reason && (
                <div className="text-sm text-muted-foreground">
                  {checkWebsiteMutation.data.reason}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
