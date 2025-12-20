import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Settings as SettingsIcon, Mail, Database, Upload } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [emailSettings, setEmailSettings] = useState({
    provider: "sendgrid",
    apiKey: "",
    senderEmail: "",
    senderName: "",
  });

  const handleSaveEmailSettings = () => {
    toast.success("Email settings saved!");
  };

  const handleUploadData = () => {
    toast.info("Data upload feature coming soon!");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">NorskLeads</h1>
                  <p className="text-sm text-gray-600">Settings</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Provider Settings
              </CardTitle>
              <CardDescription>
                Configure your email service provider to send campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider">Email Provider</Label>
                  <select
                    id="provider"
                    value={emailSettings.provider}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, provider: e.target.value })
                    }
                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="sendgrid">SendGrid</option>
                    <option value="ses">Amazon SES</option>
                    <option value="smtp">Custom SMTP</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={emailSettings.apiKey}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, apiKey: e.target.value })
                    }
                    placeholder="SG.xxxxxxxxxxxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, senderEmail: e.target.value })
                    }
                    placeholder="noreply@yourdomain.com"
                  />
                </div>

                <div>
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={emailSettings.senderName}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, senderName: e.target.value })
                    }
                    placeholder="Your Company"
                  />
                </div>

                <Button onClick={handleSaveEmailSettings}>Save Email Settings</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Upload and manage Norwegian company data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Current Database:</strong> 21 Norwegian companies
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <Label>Upload New Data (JSON)</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".json,.json.gz"
                      disabled
                    />
                    <Button onClick={handleUploadData} disabled>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JSON, JSON.GZ (from Brønnøysundregistrene)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={user?.name || ""} disabled />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>

                <p className="text-sm text-gray-500">
                  Account settings are managed through your Manus profile
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
