/**
 * Generic search/data API client.
 *
 * This is intentionally provider-agnostic. Configure it with SEARCH_API_URL
 * (base URL) and SEARCH_API_KEY (bearer token). The `apiId` is appended to the
 * base URL as a path segment and the options are sent as the request body.
 *
 * Quick example:
 *   await callDataApi("search", {
 *     query: { q: "norsk leads", gl: "no", hl: "nb" },
 *   })
 */
import { ENV } from "./env";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions = {}
): Promise<unknown> {
  if (!ENV.searchApiUrl) {
    throw new Error(
      "Search/Data API is not configured: set SEARCH_API_URL (and SEARCH_API_KEY)"
    );
  }

  const baseUrl = ENV.searchApiUrl.endsWith("/")
    ? ENV.searchApiUrl
    : `${ENV.searchApiUrl}/`;
  const fullUrl = new URL(apiId.replace(/^\/+/, ""), baseUrl).toString();

  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (ENV.searchApiKey) {
    headers.authorization = `Bearer ${ENV.searchApiKey}`;
  }

  const response = await fetch(fullUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: options.query,
      body: options.body,
      path_params: options.pathParams,
      multipart_form_data: options.formData,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Data API request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  return response.json().catch(() => ({}));
}
