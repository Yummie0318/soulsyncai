// src/app/api/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { sendOtpEmail } from "../../../lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, locale } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Fetch user and their saved locale
    const result = await query<{
      id: string;
      is_email_verified: boolean;
      locale: string | null;
    }>(
      `
      SELECT id, is_email_verified, locale
      FROM users
      WHERE email = $1
    `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Decide on effectiveLocale: prefer frontend, then DB, fallback to 'en'
    const effectiveLocale: string = (locale as string | undefined)?.trim() || user.locale || "en";

    // Generate 4-digit OTP
    const otpCode = String(Math.floor(1000 + Math.random() * 9000));
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Update OTP and locale in DB
    await query(
      `
      UPDATE users
      SET otp_code = $1,
          otp_expires_at = $2,
          locale = $3,
          updated_at = now()
      WHERE email = $4
    `,
      [otpCode, otpExpiresAt, effectiveLocale, normalizedEmail]
    );

    // Send OTP email in the same locale
    await sendOtpEmail(normalizedEmail, otpCode, effectiveLocale);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/forgot-password] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
