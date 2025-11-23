// src/app/api/looking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, lookingForText } = await req.json();

    if (!email || !lookingForText) {
      return NextResponse.json(
        { error: "email and lookingForText are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const trimmedText = String(lookingForText).trim();

    if (!trimmedText) {
      return NextResponse.json(
        { error: "lookingForText cannot be empty" },
        { status: 400 }
      );
    }

    // Optionally enforce a minimum length
    if (trimmedText.length < 3) {
      return NextResponse.json(
        { error: "Please provide a bit more detail." },
        { status: 400 }
      );
    }

    // Check that the user exists and is active
    const result = await query<{
      id: string;
      is_email_verified: boolean;
      is_active: boolean;
    }>(
      `
      SELECT id, is_email_verified, is_active
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

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    // (Optional) Require verified email before saving the journey
    if (!user.is_email_verified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    // Save the "looking for" description
    await query(
      `
      UPDATE users
      SET looking_for_text = $1,
          updated_at = now()
      WHERE email = $2
    `,
      [trimmedText, normalizedEmail]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/looking] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
