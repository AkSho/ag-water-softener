// src/server/sheets.ts
// Shared Google Sheets helpers. Used by pnl.ts and batch.ts.

import { createSign } from "crypto";

// ─── Google Sheets auth (lightweight JWT, no googleapis) ─────────────────────

export interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

export function getServiceAccountKey(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SA_KEY;
  if (!raw) throw new Error("Missing GOOGLE_SA_KEY");
  const parsed = JSON.parse(raw) as ServiceAccountKey;
  parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  return parsed;
}

export async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, "base64url");

  const jwt = `${header}.${payload}.${signature}`;
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ─── Sheets REST helpers ────────────────────────────────────────────────────

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export async function sheetsGet(
  token: string,
  spreadsheetId: string,
  path: string,
): Promise<unknown> {
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Sheets GET ${path} failed: ${res.status} ${detail.slice(0, 300)}`);
  }
  return res.json();
}

export async function sheetsPost(
  token: string,
  spreadsheetId: string,
  path: string,
  body: unknown,
): Promise<unknown> {
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Sheets POST ${path} failed: ${res.status} ${detail.slice(0, 300)}`);
  }
  return res.json();
}

export interface SheetTab {
  properties: { sheetId: number; title: string };
}

export async function listTabs(
  token: string,
  spreadsheetId: string,
): Promise<SheetTab[]> {
  const data = (await sheetsGet(token, spreadsheetId, "")) as {
    sheets: SheetTab[];
  };
  return data.sheets || [];
}

export async function addTab(
  token: string,
  spreadsheetId: string,
  title: string,
): Promise<void> {
  await sheetsPost(token, spreadsheetId, ":batchUpdate", {
    requests: [{ addSheet: { properties: { title } } }],
  });
}

export async function clearAndWrite(
  token: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
): Promise<void> {
  await sheetsPost(
    token,
    spreadsheetId,
    `/values/${encodeURIComponent(range)}:clear`,
    {},
  );
  await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ range, values }),
    },
  );
}

export async function appendRows(
  token: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
): Promise<void> {
  await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ range, values }),
    },
  );
}

export async function readRange(
  token: string,
  spreadsheetId: string,
  range: string,
): Promise<unknown[][]> {
  const data = (await sheetsGet(
    token,
    spreadsheetId,
    `/values/${encodeURIComponent(range)}`,
  )) as { values?: unknown[][] };
  return data.values || [];
}
