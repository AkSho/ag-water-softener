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
