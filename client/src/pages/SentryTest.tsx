import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bug, Zap } from "lucide-react";
import * as Sentry from "@sentry/react";
import { useState } from "react";

/**
 * Sentry Test Page
 * Used to test error tracking integration
 * Access at /sentry-test
 */
export default function SentryTest() {
  const [throwError, setThrowError] = useState(false);

  const testFrontendError = () => {
    try {
      throw new Error("Test frontend error from Sentry Test page");
    } catch (error) {
      Sentry.captureException(error, {
        tags: { test: "frontend_manual" },
      });
      alert("Error sent to Sentry! Check your Sentry dashboard.");
    }
  };

  const testReactError = () => {
    // This will trigger the Error Boundary
    setThrowError(true);
  };

  const testBackendError = async () => {
    try {
      // Call a non-existent endpoint to trigger backend error
      const response = await fetch("/api/trpc/test.throwError", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        alert("Backend error triggered! Check your Sentry dashboard.");
      }
    } catch (error) {
      console.error("Backend error test failed:", error);
    }
  };

  if (throwError) {
    throw new Error("Test React Error Boundary - This error should be caught by ErrorBoundary");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-8">
      <div className="container max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Bug className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Sentry Error Tracking Test</CardTitle>
                <CardDescription>Test error logging and monitoring integration</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Configuration Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Configuration Status
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <strong>Frontend DSN:</strong>{" "}
                  {import.meta.env.VITE_SENTRY_DSN ? (
                    <span className="text-green-600">✅ Configured</span>
                  ) : (
                    <span className="text-red-600">❌ Not configured</span>
                  )}
                </p>
                <p>
                  <strong>Backend DSN:</strong> Check server logs for status
                </p>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Error Tests
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">Frontend Error</CardTitle>
                    <CardDescription className="text-xs">
                      Manual exception capture
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={testFrontendError}
                      variant="outline"
                      className="w-full border-purple-300 hover:bg-purple-50"
                    >
                      Test Frontend
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-pink-200 hover:border-pink-400 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">React Error</CardTitle>
                    <CardDescription className="text-xs">
                      Trigger Error Boundary
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={testReactError}
                      variant="outline"
                      className="w-full border-pink-300 hover:bg-pink-50"
                    >
                      Test React Error
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-200 hover:border-orange-400 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">Backend Error</CardTitle>
                    <CardDescription className="text-xs">
                      Trigger server exception
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={testBackendError}
                      variant="outline"
                      className="w-full border-orange-300 hover:bg-orange-50"
                    >
                      Test Backend
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Setup Instructions</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Create a free Sentry account at https://sentry.io/signup/</li>
                <li>Create a new project and select "React" as platform</li>
                <li>Copy the DSN from Project Settings → Client Keys</li>
                <li>Add <code className="bg-gray-200 px-1 rounded">VITE_SENTRY_DSN</code> and <code className="bg-gray-200 px-1 rounded">SENTRY_DSN</code> to Settings → Secrets</li>
                <li>Restart the server and test error tracking</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
