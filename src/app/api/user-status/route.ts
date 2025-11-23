// src/app/api/user-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await query<{
      looking_for_text: string | null;
    }>(
      `
      SELECT looking_for_text
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const lookingForText = result.rows[0].looking_for_text;

    const hasLookingFor =
      typeof lookingForText === "string" &&
      lookingForText.trim().length > 0;

    return NextResponse.json({
      ok: true,
      email: normalizedEmail,
      hasLookingFor, // 👈 frontend uses this
    });
  } catch (err) {
    console.error("[/api/user-status] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
