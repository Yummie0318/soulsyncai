// src/app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "email and code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const codeStr = String(code).trim();

    const result = await query<{
      id: string;
      otp_code: string | null;
      otp_expires_at: string | null;
      is_email_verified: boolean;
    }>(
      `
      SELECT id, otp_code, otp_expires_at, is_email_verified
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
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    if (!user.otp_code || !user.otp_expires_at) {
      return NextResponse.json(
        { error: "No active OTP for this user" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expires = new Date(user.otp_expires_at);

    if (now > expires) {
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 }
      );
    }

    if (user.otp_code !== codeStr) {
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 400 }
      );
    }

    // Mark verified & clear OTP
    await query(
      `
      UPDATE users
      SET is_email_verified = TRUE,
          otp_code = NULL,
          otp_expires_at = NULL,
          updated_at = now()
      WHERE email = $1
    `,
      [normalizedEmail]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/verify-otp] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
