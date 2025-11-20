// src/app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      display_name: string;
      is_email_verified: boolean;
      is_active: boolean;
      locale: string | null;
      looking_for_text: string | null;
    }>(
      `
      SELECT
        id,
        email,
        password_hash,
        display_name,
        is_email_verified,
        is_active,
        locale,
        looking_for_text
      FROM users
      WHERE email = $1
    `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    if (!user.is_email_verified) {
      return NextResponse.json(
        { error: "Email not verified", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    // Return user basics + looking_for_text so frontend can decide where to go
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        locale: user.locale || "en",
        looking_for_text: user.looking_for_text, // 👈 used by login page
        // Optional camelCase mirror if you want:
        // lookingForText: user.looking_for_text,
      },
    });
  } catch (err) {
    console.error("[/api/login] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
