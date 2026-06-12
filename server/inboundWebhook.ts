/**
 * SendGrid Inbound Parse webhook — receives lead replies as multipart/form-data
 * and hands them to the inbound agent.
 *
 * SendGrid POSTs parsed fields (from, to, subject, text, html, headers, …).
 * We parse only the fields we need (no attachments in phase 1) with a hard
 * size cap, then delegate to ingestInboundEmail.
 *
 * Security: there is no SendGrid signature on Inbound Parse, so authenticity
 * rests on (a) the URL being secret-ish and (b) the signed reply-address tag —
 * an attacker cannot forge a (userId, leadId) tag without APP_SECRET, so a spoofed
 * POST simply fails to match any tenant and is dropped. Optionally gate the
 * route with INBOUND_PARSE_TOKEN (?token=) for defence in depth.
 */
import type { Request, Response } from "express";
import Busboy from "busboy";
import { ingestInboundEmail, type ParsedInboundEmail } from "./services/inboundAgent";

const MAX_FIELD_BYTES = 1024 * 1024; // 1MB per text field
const WANTED_FIELDS = new Set(["from", "to", "subject", "text", "html", "headers"]);

function parseMultipart(req: Request): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    let bus: Busboy.Busboy;
    try {
      bus = Busboy({ headers: req.headers, limits: { fieldSize: MAX_FIELD_BYTES, fields: 50 } });
    } catch (err) {
      return reject(err);
    }

    bus.on("field", (name: string, value: string) => {
      if (WANTED_FIELDS.has(name)) fields[name] = value;
    });
    // Ignore file parts (attachments) — drain them so the stream completes.
    bus.on("file", (_name: string, stream: NodeJS.ReadableStream) => stream.resume());
    bus.on("close", () => resolve(fields));
    bus.on("error", reject);
    req.pipe(bus);
  });
}

/** Extract a header value from SendGrid's raw "headers" field. */
function headerValue(rawHeaders: string | undefined, name: string): string | undefined {
  if (!rawHeaders) return undefined;
  const re = new RegExp(`^${name}:\\s*(.+)$`, "im");
  const m = rawHeaders.match(re);
  return m ? m[1].trim() : undefined;
}

export async function handleInboundEmail(req: Request, res: Response): Promise<void> {
  // Optional shared-secret gate (defence in depth; the signed tag is the real auth).
  const requiredToken = process.env.INBOUND_PARSE_TOKEN;
  if (requiredToken && req.query.token !== requiredToken) {
    res.status(401).send("Unauthorized");
    return;
  }

  let fields: Record<string, string>;
  try {
    fields = await parseMultipart(req);
  } catch (err) {
    console.error("[InboundParse] Failed to parse multipart body:", err);
    // 200 so SendGrid does not retry an unparseable payload forever.
    res.status(200).send("ok");
    return;
  }

  const email: ParsedInboundEmail = {
    from: fields.from || "",
    to: fields.to || "",
    subject: fields.subject,
    text: fields.text,
    html: fields.html,
    messageId: headerValue(fields.headers, "Message-ID"),
    inReplyTo: headerValue(fields.headers, "In-Reply-To"),
  };

  if (!email.from || !email.to) {
    res.status(200).send("ok");
    return;
  }

  try {
    const result = await ingestInboundEmail(email);
    console.log(
      `[InboundParse] from=${email.from} matched=${result.matched} ` +
        `category=${result.category ?? "-"} stopped=${result.leadStopped} reason=${result.reason ?? "-"}`
    );
  } catch (err) {
    console.error("[InboundParse] Ingest error:", err);
  }

  // Always 200: SendGrid treats non-2xx as failure and retries.
  res.status(200).send("ok");
}
