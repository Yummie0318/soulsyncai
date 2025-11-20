// src/app/api/resend-otp/route.ts
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

    if (user.is_email_verified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // 🔑 Decide ONE effective locale (like /api/signup)
    const effectiveLocale: string =
      (locale as string | undefined) || user.locale || "en";

    // New 4-digit OTP
    const otpCode = String(Math.floor(1000 + Math.random() * 9000));
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

    // Send email using that locale
    await sendOtpEmail(normalizedEmail, otpCode, effectiveLocale);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/resend-otp] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
