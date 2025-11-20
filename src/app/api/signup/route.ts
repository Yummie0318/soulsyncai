// src/app/api/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../lib/db";
import { sendOtpEmail } from "../../../lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, locale } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "email, password and displayName are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 4-digit OTP
    const otpCode = String(Math.floor(1000 + Math.random() * 9000));
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user exists (also fetch locale!)
    const existing = await query<{
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

    // We'll decide *one* effectiveLocale and use it for DB + email
    let effectiveLocale: string;

    if (existing.rows.length > 0 && existing.rows[0].is_email_verified) {
      return NextResponse.json(
        { error: "Email is already registered and verified." },
        { status: 409 }
      );
    }

    if (existing.rows.length > 0) {
      // Existing but NOT verified → update row
      const dbLocale = existing.rows[0].locale;
      effectiveLocale = (locale as string | undefined) || dbLocale || "en";

      await query(
        `
        UPDATE users
        SET password_hash = $1,
            display_name = $2,
            locale = $3,
            otp_code = $4,
            otp_expires_at = $5,
            updated_at = now()
        WHERE email = $6
      `,
        [
          passwordHash,
          displayName,
          effectiveLocale,
          otpCode,
          otpExpiresAt,
          normalizedEmail,
        ]
      );
    } else {
      // New user → insert
      effectiveLocale = (locale as string | undefined) || "en";

      await query(
        `
        INSERT INTO users (
          email, password_hash, display_name,
          locale, otp_code, otp_expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          normalizedEmail,
          passwordHash,
          displayName,
          effectiveLocale,
          otpCode,
          otpExpiresAt,
        ]
      );
    }

    // Send OTP email with the *same* locale we just decided on
    await sendOtpEmail(normalizedEmail, otpCode, effectiveLocale);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/signup] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
