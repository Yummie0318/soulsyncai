// src/app/api/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "email and newPassword are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const plainPassword = String(newPassword);

    if (plainPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Check if user exists
    const result = await query<{ id: string }>(
      `
      SELECT id
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

    const userId = result.rows[0].id;

    // Hash new password
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Update password
    await query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = now()
      WHERE id = $2
    `,
      [passwordHash, userId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/reset-password] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
