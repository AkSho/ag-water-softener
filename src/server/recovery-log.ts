const AIRTABLE_TABLE = "Recovery";

interface RecoveryRecord {
  email: string;
  session_id: string;
  sent_at: string;
  first_name: string;
  link_sent: string;
}

function airtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) return null;
  return { apiKey, baseId };
}

export async function hasRecentRecovery(email: string, withinDays: number = 30): Promise<boolean> {
  const config = airtableConfig();
  if (!config) {
    console.warn("Airtable not configured; recovery dedup disabled");
    return false;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);
  const cutoffIso = cutoff.toISOString();

  const formula = encodeURIComponent(
    `AND({Email}='${email}',IS_AFTER({Sent_At},'${cutoffIso}'))`
  );

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}&maxRecords=1`,
      {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      }
    );

    if (!response.ok) {
      console.error("Airtable recovery check failed", response.status);
      return false;
    }

    const data = await response.json() as { records: unknown[] };
    return data.records.length > 0;
  } catch (err) {
    console.error("Airtable recovery check error", err);
    return false;
  }
}

export async function logRecoverySend(record: RecoveryRecord): Promise<void> {
  const config = airtableConfig();
  if (!config) {
    console.warn("Airtable not configured; recovery log skipped");
    return;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                Email: record.email,
                Session_ID: record.session_id,
                Sent_At: record.sent_at,
                First_Name: record.first_name,
                Link_Sent: record.link_sent,
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("Airtable recovery log failed", response.status, detail.slice(0, 300));
    }
  } catch (err) {
    console.error("Airtable recovery log error", err);
  }
}
