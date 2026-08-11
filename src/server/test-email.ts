// TEMPORARY: delete this file after email verification is complete.
import {
  sendEmail,
  buildConfirmationEmail,
  buildRecoveryEmail,
  formatPromiseDate,
} from "./email";

const TEST_SECRET = "test-email-verify-aug2026";

export async function handleTestEmail(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/test-email") return undefined;
  if (url.searchParams.get("secret") !== TEST_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const to = url.searchParams.get("to");
  if (!to) {
    return new Response(JSON.stringify({ error: "missing ?to= parameter" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const type = url.searchParams.get("type") || "confirmation";
  const results: Record<string, string> = {};

  try {
    if (type === "confirmation" || type === "both") {
      const promiseDate = formatPromiseDate(new Date());
      const { subject, text } = buildConfirmationEmail({
        firstName: "Lu",
        promiseDate,
      });
      await sendEmail({ to, subject, text });
      results.confirmation = `sent to ${to}`;
    }

    if (type === "recovery" || type === "both") {
      const { subject, text } = buildRecoveryEmail({
        firstName: "Lu",
        checkoutOrPdpLink: "https://agsoftener.com/",
      });
      await sendEmail({ to, subject, text });
      results.recovery = `sent to ${to}`;
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
