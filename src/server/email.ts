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

Ana
AG Water Softener
support@agsoftener.com`,
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

Ana

AG Water Softener | GRN Labs`,
  };
}

export function formatPromiseDate(orderDate: Date): string {
  const promise = new Date(orderDate);
  promise.setDate(promise.getDate() + 18);
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
  return {
    subject: "Tracking for your AG Water Softener order",
    text: `Hi ${name},

Your order is on its way.

${carrier} tracking: ${tracking}

The tracking page updates each time ${carrier} scans the package, so it may show only the label at first. Your order is expected by ${promisedByFormatted}.

Ana
AG Water Softener
support@agsoftener.com`,
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
  return {
    subject: `${carrier} shows your AG Water Softener delivered`,
    text: `Hi ${name},

${carrier} shows your order delivered on ${deliveredFormatted}. The setup guide is at agsoftener.com/setup, and the two short videos there walk through install and recharge.

Ana
AG Water Softener
support@agsoftener.com`,
  };
}
