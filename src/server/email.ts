import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | undefined;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.ZOHO_SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.ZOHO_SMTP_PORT || "465");
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;

  if (!user || !pass) {
    throw new Error("Missing ZOHO_SMTP_USER or ZOHO_SMTP_PASS");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

const SIGN_OFF = `Ana

AG Water Softener | GRN Labs`;

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const from = process.env.ZOHO_FROM_ADDRESS || "support@agsoftener.com";
  const transport = getTransporter();

  await transport.sendMail({
    from: `AG Water Softener <${from}>`,
    to,
    bcc: "support@agsoftener.com",
    subject,
    text,
  });
}

export function buildConfirmationEmail({
  firstName,
  promiseDate,
  orderNumber,
}: {
  firstName: string;
  promiseDate: string;
  orderNumber?: string;
}) {
  const name = firstName || "there";
  const orderLine = orderNumber ? `\nOrder ${orderNumber}\n` : "";
  return {
    subject: "Your AG Water Softener Order",
    text: `Hi ${name},
${orderLine}
Thanks for your order. It's confirmed, and you should have it by ${promiseDate}. I'll email the tracking number as soon as it ships.

Any questions, just reply to this email.

${SIGN_OFF}`,
  };
}

export function buildRecoveryEmail({
  firstName,
  checkoutOrPdpLink,
}: {
  firstName: string;
  checkoutOrPdpLink: string;
}) {
  const name = firstName || "there";
  return {
    subject: "Your AG Water Softener is still in your cart",
    text: `Hi ${name},

You left an AG Water Softener in checkout. It's in stock and ships free with tracking. Your checkout link still works if you want to pick up where you left off: ${checkoutOrPdpLink}

If something held you back, reply and ask. I read every email.

${SIGN_OFF}`,
  };
}

export function formatPromiseDate(orderDate: Date, days: number = 18): string {
  const promise = new Date(orderDate);
  promise.setDate(promise.getDate() + days);
  return promise.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0] || "";
}

export function formatLongDate(dateStr: string): string {
  // For date-only strings (YYYY-MM-DD), parse as local to avoid timezone shift
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function buildShippingEmail({
  firstName,
  carrier,
  tracking,
  promisedBy,
}: {
  firstName: string;
  carrier: string;
  tracking: string;
  promisedBy: string;
}) {
  const name = firstName || "there";
  const promisedByFormatted = formatLongDate(promisedBy);

  if (carrier === "Yun Express") {
    return {
      subject: "Tracking for your AG Water Softener order",
      text: `Hi ${name},

Your order is on its way.

Tracking number: ${tracking}
Track it here: https://t.17track.net/en#nums=${tracking}

The tracking page updates each time the package is scanned, so it may show only the label at first. Your order is expected by ${promisedByFormatted}.

${SIGN_OFF}`,
    };
  }

  return {
    subject: "Tracking for your AG Water Softener order",
    text: `Hi ${name},

Your order is on its way.

${carrier} tracking: ${tracking}

The tracking page updates each time ${carrier} scans the package, so it may show only the label at first. Your order is expected by ${promisedByFormatted}.

${SIGN_OFF}`,
  };
}

export function buildCheckInEmail({
  firstName,
  carrier,
  deliveredDate,
}: {
  firstName: string;
  carrier: string;
  deliveredDate: string;
}) {
  const name = firstName || "there";
  const deliveredFormatted = formatLongDate(deliveredDate);

  if (carrier === "Yun Express") {
    return {
      subject: "Tracking shows your AG Water Softener delivered",
      text: `Hi ${name},

Tracking shows your order delivered on ${deliveredFormatted}. The setup guide is at agsoftener.com/setup, and the two short videos there walk through install and recharge.

${SIGN_OFF}`,
    };
  }

  return {
    subject: `${carrier} shows your AG Water Softener delivered`,
    text: `Hi ${name},

${carrier} shows your order delivered on ${deliveredFormatted}. The setup guide is at agsoftener.com/setup, and the two short videos there walk through install and recharge.

${SIGN_OFF}`,
  };
}

// ─── Daily digest (internal, no sign-off) ─────────────────────────────────

import type { DigestData } from "./records";
// colorWord/metricLine are self-contained in this file (digestMetricLine)

function fmtDollars(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function digestMetricLine(label: string, value: number, avg: number | null, dollar = false, invertColor = false): string {
  const valStr = dollar ? fmtDollars(value) : String(value);
  const avgStr = avg !== null ? (dollar ? fmtDollars(avg) : avg.toFixed(1)) : "—";
  let color: string;
  if (avg === null) color = "new";
  else if (avg === 0 && value === 0) color = "green";
  else if (avg === 0) color = invertColor ? "red" : "blue";
  else if (value / avg > 1.2) color = invertColor ? "red" : "blue";
  else if (value / avg < 0.8) color = invertColor ? "green" : "red";
  else color = "green";
  return `${label}: ${valStr} (${avgStr}) ${color}`;
}

export function buildDigestEmail(data: DigestData, errors: Record<string, string>): { subject: string; text: string } {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const dayName = days[now.getDay()];
  const mon = months[now.getMonth()];
  const day = now.getDate();

  const subject = `AG daily · ${dayName} ${mon} ${day}`;
  const sections: string[] = [];

  // 1. Revenue
  if (errors.revenue) {
    sections.push(`── Revenue ──\nerror: ${errors.revenue}`);
  } else {
    const y = data.yesterday;
    const t = data.trailing7;
    const hasHistory = t.orders > 0 || t.gross > 0;
    const a = (key: keyof DigestData["trailing7"]): number | null =>
      hasHistory ? (t[key] as number) : null;

    const lines = [
      "── Revenue (yesterday, ET) ──",
      digestMetricLine("Orders", y.orders, a("orders")),
      digestMetricLine("Gross revenue", y.gross, a("gross"), true),
      digestMetricLine("Refunds", y.refunds, a("refunds"), false, true),
      digestMetricLine("Bump takes", y.bumps, a("bumps")),
      digestMetricLine("OTO accepts", y.otos, a("otos")),
      digestMetricLine("Express orders", y.express, a("express")),
      digestMetricLine("Repeat customers", y.repeats, a("repeats")),
      "",
      `Month to date: ${data.mtdOrders} orders, ${fmtDollars(data.mtdGross)} gross`,
    ];
    sections.push(lines.join("\n"));
  }

  // 2. Attribution
  if (errors.attribution) {
    sections.push(`── Attribution ──\nerror: ${errors.attribution}`);
  } else {
    const selfByOrder = data.selfReports || {};
    const vLines = Object.entries(data.verdicts)
      .sort(([, a], [, b]) => b - a)
      .map(([v, count]) => `${v}: ${count}`);
    // Append self-report annotations for yesterday's orders that have one
    const selfLines: string[] = [];
    for (const [orderNum, sr] of Object.entries(selfByOrder)) {
      const agree = sr.verdict.toLowerCase().includes(sr.source.toLowerCase().split(" ")[0]);
      const tag = agree ? "" : " check";
      selfLines.push(`  ${orderNum}: ${sr.verdict} (self: ${sr.source})${tag}`);
    }
    const combined = vLines.length > 0 ? vLines.join("\n") : "none";
    sections.push(
      "── Attribution (yesterday) ──\n" +
      combined +
      (selfLines.length > 0 ? "\n" + selfLines.join("\n") : ""),
    );
  }

  // 3. Fulfillment health
  if (errors.fulfillment) {
    sections.push(`── Fulfillment health ──\nerror: ${errors.fulfillment}`);
  } else {
    const f = data.fulfillment;
    const fLines: string[] = [];
    if (f.intakeStale > 0) fLines.push(`intake-ready older than 24h: ${f.intakeStale}`);
    if (f.supplierNoTracking > 0) fLines.push(`sent-to-supplier older than 10 days with no tracking: ${f.supplierNoTracking}`);
    if (f.pastPromised.length > 0) {
      fLines.push(`past PromisedBy and not delivered: ${f.pastPromised.length}`);
      for (const p of f.pastPromised) fLines.push(`  ${p.orderNumber} ${p.daysLate}d late`);
    }
    if (f.readyNoNotify > 0) fLines.push(`ready-to-notify awaiting a Notify tick: ${f.readyNoNotify}`);
    if (f.deliveredNoCheckIn > 0) fLines.push(`Delivered set but NotifyCheckIn not ticked: ${f.deliveredNoCheckIn}`);
    sections.push(
      "── Fulfillment health ──\n" +
      (fLines.length > 0 ? fLines.join("\n") : "all clear"),
    );
  }

  // 4. Data health
  if (errors.dataHealth) {
    sections.push(`── Data health ──\nerror: ${errors.dataHealth}`);
  } else {
    const d = data.dataHealth;
    const dLines: string[] = [];
    if (d.verdictMismatches > 0) dLines.push(`Verdict direct with non-empty referrer or UTM: ${d.verdictMismatches}`);
    if (d.orphanOtos > 0) dLines.push(`OTO PaymentIntents with no matching order row: ${d.orphanOtos}`);
    if (d.missingRows.length > 0) {
      dLines.push(`Orders in Stripe with no Airtable row: ${d.missingRows.length}`);
      for (const sid of d.missingRows) dLines.push(`  ${sid}`);
    }
    if (!d.revenueMatch) {
      dLines.push(`Revenue mismatch: Airtable ${fmtDollars(d.airtableRevenue)} vs Stripe ${fmtDollars(d.stripeRevenue)} red`);
    }
    sections.push(
      "── Data health ──\n" +
      (dLines.length > 0 ? dLines.join("\n") : "all clear"),
    );
  }

  // 5. Paid
  sections.push("── Paid ──\nSpend source not connected");

  return { subject, text: sections.join("\n\n") };
}
