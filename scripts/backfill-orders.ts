#!/usr/bin/env npx tsx
// Backfill script: pull paid Stripe checkout sessions since 2026-08-01,
// derive the full order record, and upsert into Airtable.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/backfill-orders.ts --dry-run
//   npx tsx --env-file=.env.local scripts/backfill-orders.ts --write
//
// Requires: STRIPE_SECRET_KEY, STRIPE_PRICE_SPARE, AIRTABLE_API_KEY, AIRTABLE_BASE_ID

import Stripe from "stripe";

// ─── Config from records.ts (duplicated to keep script standalone) ───────────

interface VerdictInput {
  gclid: string;
  msclkid: string;
  ftRef: string;
  ftUtm: string;
  ftLp: string;
}

function deriveVerdict(input: VerdictInput): string {
  if (input.gclid) return "google-paid";
  if (input.msclkid) return "microsoft-paid";

  const refLower = (input.ftRef || "").toLowerCase();
  const utmLower = (input.ftUtm || "").toLowerCase();
  const refOrUtm = refLower + " " + utmLower;

  if (refOrUtm.includes("chatgpt")) return "chatgpt";
  if (refOrUtm.includes("perplexity")) return "perplexity";
  if (refOrUtm.includes("claude")) return "claude";
  if (refOrUtm.includes("gemini") || refOrUtm.includes("bard")) return "gemini";
  if (refOrUtm.includes("copilot") || refOrUtm.includes("bing")) return "bing";

  if (refLower.includes("myapartmentwaterquality")) return "myapt";
  if (refLower.includes("google.")) return "google-organic";

  const lpLower = (input.ftLp || "").toLowerCase();
  if (lpLower.includes("srsltid")) return "google-merchant";

  if (refLower.includes("facebook") || refLower.includes("instagram"))
    return "meta";

  return "direct";
}

function deriveToolTouch(ftRef: string, ftLp: string): boolean {
  const ref = (ftRef || "").toLowerCase();
  const lp = (ftLp || "").toLowerCase();
  return ref.includes("myapartmentwaterquality") || lp.includes("xd=myapt");
}

function daysBetween(isoA: string, isoB: string): number | null {
  try {
    const a = new Date(isoA).getTime();
    const b = new Date(isoB).getTime();
    if (isNaN(a) || isNaN(b)) return null;
    return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function promiseDate(orderTs: string): string {
  const d = new Date(orderTs);
  d.setDate(d.getDate() + 18);
  return d.toISOString().split("T")[0];
}

// ─── Old verdict logic (for VerdictLegacy) ───────────────────────────────────

function deriveVerdictLegacy(ftSrc: string, toolTouch: boolean): string {
  if (toolTouch) return "tool-lead";
  if (ftSrc === "myapt") return "content-lead";
  if (ftSrc.endsWith("-cpc")) return "paid";
  if (["direct", "google", "bing"].includes(ftSrc)) return "direct";
  return "unknown";
}

// ─── Airtable helpers ────────────────────────────────────────────────────────

interface AirtableConfig {
  apiKey: string;
  baseId: string;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

function getAirtableConfig(): AirtableConfig {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) throw new Error("AIRTABLE_API_KEY and AIRTABLE_BASE_ID required");
  return { apiKey, baseId };
}

async function airtableFetch(
  config: AirtableConfig,
  table: string,
  path: string = "",
  init?: RequestInit,
): Promise<Response> {
  const base = `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(table)}`;
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

async function listAllOrders(config: AirtableConfig): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const query = offset ? `?offset=${encodeURIComponent(offset)}` : "";
    const res = await airtableFetch(config, "Orders", query);
    if (!res.ok) throw new Error(`listAllOrders failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

async function checkToolTouchSubmissions(config: AirtableConfig, email: string): Promise<boolean> {
  const safeEmail = email.replace(/'/g, "\\'");
  const formula = encodeURIComponent(`{Email Address}='${safeEmail}'`);
  try {
    const res = await airtableFetch(config, "Submissions", `?filterByFormula=${formula}&maxRecords=1`);
    if (!res.ok) return false;
    const data = (await res.json()) as { records: unknown[] };
    return data.records.length > 0;
  } catch {
    return false;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const FULFILLMENT_FIELDS = new Set([
  "Tracking", "Carrier", "ShippedTS", "Delivered", "CheckInTS",
  "ConfirmationSentTS", "SentToSupplierTS", "Notify", "PromisedBy",
]);

interface ProposedChange {
  sessionId: string;
  email: string;
  action: "create" | "update";
  matchedAirtableId?: string;
  matchedBy?: string;
  verdictOld?: string;
  verdictNew: string;
  verdictChanged: boolean;
  preservedFields: string[];
  fields: Record<string, unknown>;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const writeMode = process.argv.includes("--write");

  if (!dryRun && !writeMode) {
    console.error("Usage: backfill-orders.ts --dry-run | --write");
    process.exit(1);
  }

  console.log(`Mode: ${dryRun ? "DRY RUN" : "WRITE"}`);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sparePrice = process.env.STRIPE_PRICE_SPARE!;
  const atConfig = getAirtableConfig();

  // 1. Load existing Airtable orders
  console.log("Loading existing Airtable orders...");
  const existingOrders = await listAllOrders(atConfig);
  console.log(`Found ${existingOrders.length} existing order rows`);

  // Index by StripeSessionId, by Email+Date, and by Email (fallback)
  const bySessionId = new Map<string, AirtableRecord>();
  const byEmailDate = new Map<string, AirtableRecord>();
  const byEmail = new Map<string, AirtableRecord[]>();

  for (const row of existingOrders) {
    const sid = row.fields.StripeSessionId as string;
    if (sid) bySessionId.set(sid, row);

    const email = ((row.fields.Email as string) || "").toLowerCase().trim();
    const orderTs = row.fields.OrderTS as string;
    if (email && orderTs) {
      const dateKey = new Date(orderTs).toISOString().slice(0, 10);
      byEmailDate.set(`${email}|${dateKey}`, row);
    }
    if (email) {
      const list = byEmail.get(email) || [];
      list.push(row);
      byEmail.set(email, list);
    }
  }

  // Track which Airtable records get matched (for fallback pass)
  const matchedAirtableIds = new Set<string>();

  // 2. Pull all paid checkout sessions from Stripe since 2026-08-01
  console.log("Pulling Stripe checkout sessions since 2026-08-01...");
  const since = Math.floor(new Date("2026-08-01T00:00:00Z").getTime() / 1000);
  const sessions: Stripe.Checkout.Session[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.Checkout.SessionListParams = {
      limit: 100,
      created: { gte: since },
      status: "complete",
    };
    if (startingAfter) params.starting_after = startingAfter;

    const page = await stripe.checkout.sessions.list(params);
    sessions.push(...page.data);
    hasMore = page.has_more;
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    }
  }

  console.log(`Found ${sessions.length} paid sessions`);

  // 3. Build OTO lookup: session ID → OTO PaymentIntent
  console.log("Checking for OTO PaymentIntents...");
  const otoBySession = new Map<string, { amount: number }>();

  let otoMore = true;
  let otoAfter: string | undefined;
  while (otoMore) {
    const params: Stripe.PaymentIntentSearchParams = {
      query: 'metadata["source"]:"ag_oto_kit"',
      limit: 100,
    };
    if (otoAfter) (params as unknown as Record<string, unknown>).page = otoAfter;

    const page = await stripe.paymentIntents.search(params);
    for (const pi of page.data) {
      if (pi.status === "succeeded" && pi.metadata.parent_session) {
        otoBySession.set(pi.metadata.parent_session, {
          amount: pi.amount / 100,
        });
      }
    }
    otoMore = page.has_more;
    if (page.data.length > 0) {
      otoAfter = page.next_page ?? undefined;
    }
  }

  console.log(`Found ${otoBySession.size} successful OTO charges`);

  // 4. Sort sessions by date (ascending) for RepeatCustomer detection
  const paidSessions = sessions
    .filter((s) => s.payment_status === "paid")
    .sort((a, b) => a.created - b.created);

  const changes: ProposedChange[] = [];
  const seenEmails = new Set<string>();

  for (const session of paidSessions) {
    const email = (session.customer_details?.email || "").toLowerCase().trim();
    const orderTs = new Date(session.created * 1000).toISOString();
    const repeatCustomer = email ? seenEmails.has(email) : false;
    if (email) seenEmails.add(email);

    // Match against existing rows: SessionId → Email+Date(±1d) → Email-only fallback
    let match: AirtableRecord | undefined;
    let matchedBy = "";

    if (bySessionId.has(session.id)) {
      match = bySessionId.get(session.id);
      matchedBy = "StripeSessionId";
    } else if (email) {
      // ±1 day match
      for (const offset of [0, -1, 1]) {
        const d = new Date(session.created * 1000);
        d.setDate(d.getDate() + offset);
        const key = `${email}|${d.toISOString().slice(0, 10)}`;
        const candidate = byEmailDate.get(key);
        if (candidate && !matchedAirtableIds.has(candidate.id)) {
          match = candidate;
          matchedBy = `Email+Date(${offset > 0 ? "+" : ""}${offset}d)`;
          break;
        }
      }
      // Email-only fallback: match unmatched Airtable rows by email
      if (!match) {
        const candidates = byEmail.get(email) || [];
        const unmatched = candidates.filter((r) => !matchedAirtableIds.has(r.id));
        if (unmatched.length === 1) {
          match = unmatched[0];
          matchedBy = "Email-only";
        }
      }
    }
    if (match) matchedAirtableIds.add(match.id);

    // Derive ItemType from session metadata
    const isAgPdp = session.metadata?.source === "ag_pdp";
    const bumpTaken = session.metadata?.requested_include_spare === "true";
    const oto = otoBySession.get(session.id);
    let itemType: string;
    if (!isAgPdp) {
      itemType = "kit";
    } else if (bumpTaken) {
      itemType = "unit+bump";
    } else if (oto) {
      itemType = "unit+kit";
    } else {
      itemType = "unit";
    }

    // Get shipping details
    let shipping: Stripe.Checkout.Session.CollectedInformation.ShippingDetails | null | undefined;
    try {
      const full = await stripe.checkout.sessions.retrieve(session.id);
      shipping = full.collected_information?.shipping_details;
    } catch {
      // If we can't retrieve, use what we have
    }

    const shippingAddr = shipping?.address;
    const piId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || "";

    const ftSrc = session.metadata?.ft_src || "";
    const ftRef = session.metadata?.ft_ref || "";
    const ftLp = session.metadata?.ft_lp || "";
    const ftMlp = session.metadata?.ft_mlp || "";
    const ftTs = session.metadata?.ft_ts || "";
    const ftUtm = session.metadata?.ft_utm || "";
    const gclid = session.metadata?.ft_gclid || "";
    const msclkid = session.metadata?.ft_msclkid || "";

    const toolTouchSub = email ? await checkToolTouchSubmissions(atConfig, email) : false;
    let toolTouch = deriveToolTouch(ftRef, ftLp) || toolTouchSub;

    let newVerdict = deriveVerdict({ gclid, msclkid, ftRef, ftUtm, ftLp });
    const legacyVerdict = deriveVerdictLegacy(ftSrc, toolTouch);
    const dtp = ftTs ? daysBetween(ftTs, orderTs) : null;

    // Check for refund and extract order number from charge
    let refunded = false;
    let refundTs = "";
    let orderNumber = session.id.slice(-8);
    if (piId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(piId, {
          expand: ["latest_charge"],
        });
        if (pi.status === "canceled" || (pi.amount_received === 0 && pi.amount > 0)) {
          refunded = true;
        }
        const charge = pi.latest_charge;
        if (charge && typeof charge !== "string") {
          if (charge.receipt_number) {
            orderNumber = charge.receipt_number;
          }
          if (charge.refunded) {
            refunded = true;
            refundTs = charge.refunds?.data?.[0]?.created
              ? new Date(charge.refunds.data[0].created * 1000).toISOString()
              : orderTs;
          }
        }
      } catch {
        // Skip on error, keep fallback order number
      }
    }

    const fields: Record<string, unknown> = {
      StripeSessionId: session.id,
      PaymentIntentId: piId,
      OrderNumber: orderNumber,
      Email: session.customer_details?.email || "",
      Name: session.customer_details?.name || "",
      OrderTS: orderTs,
      Amount: typeof session.amount_total === "number" ? session.amount_total / 100 : 0,
      UnitQty: itemType === "kit" ? 0 : (Number(session.metadata?.requested_unit_qty) || 1),
      ItemType: itemType,
      RepeatCustomer: repeatCustomer,
      BumpTaken: bumpTaken,
      OTOAccepted: !!oto,
      OTOAmount: oto?.amount || 0,
      Refunded: refunded,
      ...(refundTs ? { RefundTS: refundTs } : {}),
      ShipName: shipping?.name || "",
      Address1: shippingAddr?.line1 || "",
      Address2: shippingAddr?.line2 || "",
      City: shippingAddr?.city || "",
      State: shippingAddr?.state || "",
      Zip: shippingAddr?.postal_code || "",
      Phone: session.customer_details?.phone || "",
      FT_Source: ftSrc,
      FT_Referrer: ftRef,
      FT_LandingPage: ftLp,
      FT_MyaptPage: ftMlp,
      FT_Timestamp: ftTs,
      FT_UTM: ftUtm,
      FT_Gclid: gclid,
      FT_Msclkid: msclkid,
      Verdict: newVerdict,
      VerdictLegacy: legacyVerdict,
      DaysToPurchase: dtp,
      ToolTouch: toolTouch,
      PromisedBy: promiseDate(orderTs),
      Status: refunded ? "cancelled" : "paid",
    };

    const preservedFields: string[] = [];

    if (match) {
      // OrderTS and Amount always take Stripe values (source of truth)
      const STRIPE_SOURCE_OF_TRUTH = new Set(["OrderTS", "Amount"]);
      // Never overwrite any non-empty existing value with an empty new value
      for (const [k, v] of Object.entries(fields)) {
        if (STRIPE_SOURCE_OF_TRUTH.has(k)) continue;
        const old = match.fields[k];
        const oldPresent = old != null && old !== "" && old !== false;
        const newEmpty = v == null || v === "" || v === false || v === 0;
        if (oldPresent && newEmpty) {
          fields[k] = old;
          preservedFields.push(k);
        }
      }
      // Also preserve fulfillment fields that are already set
      for (const f of FULFILLMENT_FIELDS) {
        const existing = match.fields[f];
        if (existing != null && existing !== "" && existing !== false) {
          fields[f] = existing;
          if (!preservedFields.includes(f)) preservedFields.push(f);
        }
      }

      // Re-derive verdict from merged values (existing wins when Stripe is empty)
      const mergedRef = fields.FT_Referrer as string || "";
      const mergedUtm = fields.FT_UTM as string || "";
      const mergedLp = fields.FT_LandingPage as string || "";
      const mergedGclid = fields.FT_Gclid as string || "";
      const mergedMsclkid = fields.FT_Msclkid as string || "";
      const mergedVerdict = deriveVerdict({
        gclid: mergedGclid,
        msclkid: mergedMsclkid,
        ftRef: mergedRef,
        ftUtm: mergedUtm,
        ftLp: mergedLp,
      });
      fields.Verdict = mergedVerdict;
      fields.ToolTouch = deriveToolTouch(mergedRef, mergedLp) || toolTouchSub;
      // Keep newVerdict for the change report
      newVerdict = mergedVerdict;
      toolTouch = fields.ToolTouch as boolean;
    }

    const existingVerdict = match?.fields?.Verdict as string | undefined;

    changes.push({
      sessionId: session.id,
      email: session.customer_details?.email || "",
      action: match ? "update" : "create",
      matchedAirtableId: match?.id,
      matchedBy: matchedBy || undefined,
      verdictOld: existingVerdict || legacyVerdict,
      verdictNew: newVerdict,
      verdictChanged: (existingVerdict || legacyVerdict) !== newVerdict,
      preservedFields,
      fields,
    });
  }

  // 5. Reconciliation: find unmatched Airtable rows
  const unmatchedAirtable = existingOrders.filter((r) => !matchedAirtableIds.has(r.id));
  // Identify empty rows to delete
  const emptyRows = unmatchedAirtable.filter(
    (r) => !r.fields.Email && !r.fields.OrderTS && !r.fields.Amount,
  );

  // 6. Output
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`BACKFILL SUMMARY: ${changes.length} orders`);
  console.log(`  Creates: ${changes.filter((c) => c.action === "create").length}`);
  console.log(`  Updates: ${changes.filter((c) => c.action === "update").length}`);
  console.log(`  Deletes: ${emptyRows.length}`);
  console.log(`  Verdict changes: ${changes.filter((c) => c.verdictChanged).length}`);
  console.log(`  Unmatched Airtable rows: ${unmatchedAirtable.length - emptyRows.length}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Reconciliation table
  if (unmatchedAirtable.length > 0 || changes.some((c) => c.action === "create")) {
    console.log("RECONCILIATION");
    console.log("──────────────");
    if (unmatchedAirtable.length > 0) {
      console.log("\nUnmatched Airtable rows (no Stripe session found):");
      for (const r of unmatchedAirtable) {
        console.log(`  ${r.id} | ${r.fields.Email || "(no email)"} | ${r.fields.OrderTS || "(no date)"} | $${r.fields.Amount || "?"}`);
      }
    }
    const creates = changes.filter((c) => c.action === "create");
    if (creates.length > 0) {
      console.log("\nProposed creates (no matching Airtable row found):");
      for (const c of creates) {
        console.log(`  ${c.sessionId.slice(-8)} | ${c.email} | ${c.fields.OrderTS} | $${c.fields.Amount}`);
      }
    }
    console.log("\nPair unmatched rows with proposed creates before running --write.\n");
  }

  // Show verdict changes
  const verdictChanges = changes.filter((c) => c.verdictChanged);
  if (verdictChanges.length > 0) {
    console.log("VERDICT CHANGES:");
    for (const c of verdictChanges) {
      console.log(`  ${c.email} (${c.sessionId.slice(-8)}): ${c.verdictOld} → ${c.verdictNew}`);
    }
    console.log("");
  }

  // Show all proposed changes
  for (const c of changes) {
    console.log(`─── ${c.action.toUpperCase()} ${c.sessionId.slice(-8)} ───`);
    console.log(`  Email: ${c.email}`);
    if (c.matchedBy) console.log(`  Matched by: ${c.matchedBy} (${c.matchedAirtableId})`);
    console.log(`  Verdict: ${c.verdictNew}${c.verdictChanged ? ` (was: ${c.verdictOld})` : ""}`);
    console.log(`  Amount: $${c.fields.Amount}, ItemType: ${c.fields.ItemType}`);
    console.log(`  UnitQty: ${c.fields.UnitQty}, Bump: ${c.fields.BumpTaken}, OTO: ${c.fields.OTOAccepted}, Repeat: ${c.fields.RepeatCustomer}`);
    if (c.preservedFields.length > 0) console.log(`  Preserved: ${c.preservedFields.join(", ")}`);
    if (c.fields.Refunded) console.log(`  REFUNDED`);
    console.log("");
  }

  // Show empty rows to delete
  if (emptyRows.length > 0) {
    console.log("ROWS TO DELETE (empty):");
    for (const r of emptyRows) {
      console.log(`  ${r.id}`);
    }
    console.log("");
  }

  // 7. Write if not dry-run
  if (writeMode) {
    console.log("Writing to Airtable...");
    let created = 0;
    let updated = 0;
    let deleted = 0;
    let errors = 0;

    for (const c of changes) {
      try {
        if (c.action === "create") {
          const res = await airtableFetch(atConfig, "Orders", "", {
            method: "POST",
            body: JSON.stringify({ records: [{ fields: c.fields }] }),
          });
          if (!res.ok) {
            const detail = await res.text();
            console.error(`CREATE FAILED ${c.sessionId.slice(-8)}: ${res.status} ${detail.slice(0, 200)}`);
            errors++;
          } else {
            created++;
          }
        } else {
          const res = await airtableFetch(atConfig, "Orders", `/${c.matchedAirtableId}`, {
            method: "PATCH",
            body: JSON.stringify({ fields: c.fields }),
          });
          if (!res.ok) {
            const detail = await res.text();
            console.error(`UPDATE FAILED ${c.sessionId.slice(-8)}: ${res.status} ${detail.slice(0, 200)}`);
            errors++;
          } else {
            updated++;
          }
        }
        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        console.error(`ERROR ${c.sessionId.slice(-8)}: ${err instanceof Error ? err.message : String(err)}`);
        errors++;
      }
    }

    // Delete empty rows
    for (const r of emptyRows) {
      try {
        const res = await airtableFetch(atConfig, "Orders", `/${r.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const detail = await res.text();
          console.error(`DELETE FAILED ${r.id}: ${res.status} ${detail.slice(0, 200)}`);
          errors++;
        } else {
          deleted++;
          console.log(`Deleted empty row ${r.id}`);
        }
        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        console.error(`DELETE ERROR ${r.id}: ${err instanceof Error ? err.message : String(err)}`);
        errors++;
      }
    }

    console.log(`\nDone: ${created} created, ${updated} updated, ${deleted} deleted, ${errors} errors`);
  } else {
    console.log("Dry run complete. Run with --write to apply changes.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
