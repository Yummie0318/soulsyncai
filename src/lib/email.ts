// src/lib/email.ts
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.EMAIL_FROM || "SoulSync AI <no-reply@example.com>";

const defaultEmailTexts = {
  subject: "Your SoulSync verification code",
  title: "SoulSync AI",
  intro: "Here is your verification code:",
  expire: "This code will expire in 10 minutes.",
  ignore: "If you didn't request this, you can ignore this email.",
};

type EmailTexts = typeof defaultEmailTexts;

let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

/**
 * Server-side equivalent of useTranslation(defaultEmailTexts, "emailOtp").
 * It calls your existing /api/translate route.
 */
async function getEmailTexts(locale?: string): Promise<EmailTexts> {
  if (!locale) return defaultEmailTexts;

  // Use only the language part, same idea as everywhere else
  const targetLang = locale.split("-")[0].toLowerCase(); // "ar-SA" -> "ar"

  // If it's English, just return defaults (your /api/translate does this too)
  if (targetLang === "en") {
    return defaultEmailTexts;
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: defaultEmailTexts,
        targetLang,
      }),
    });

    if (!res.ok) {
      console.warn(
        "[getEmailTexts] /api/translate returned non-OK:",
        res.status
      );
      return defaultEmailTexts;
    }

    const data = await res.json();
    const translated = data?.translated as Partial<EmailTexts> | undefined;

    if (!translated || typeof translated !== "object") {
      console.warn(
        "[getEmailTexts] invalid translated payload, using defaults"
      );
      return defaultEmailTexts;
    }

    // Merge like safeTexts: backend overrides on top of defaults
    return {
      ...defaultEmailTexts,
      ...translated,
    };
  } catch (err) {
    console.warn("[getEmailTexts] failed, using default texts:", err);
    return defaultEmailTexts;
  }
}

export async function sendOtpEmail(
  to: string,
  code: string,
  locale?: string
) {
  const t = await getEmailTexts(locale);

  if (!resend) {
    console.warn(
      "[sendOtpEmail] RESEND_API_KEY not set – skipping real email send."
    );
    console.warn(
      `[sendOtpEmail] OTP for ${to} (locale=${locale}): ${code}`
    );
    return;
  }

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: t.subject,
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <h2>${t.title}</h2>
        <p>${t.intro}</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>${t.expire}</p>
        <p>${t.ignore}</p>
      </div>
    `,
  });
}
