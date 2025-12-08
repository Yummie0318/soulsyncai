// src/app/api/match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../lib/db";

// Convert similarity (0..1) to “certainty %” with minimum 1%
function similarityToPercent(sim: number | null | undefined): number {
  if (sim == null || Number.isNaN(sim)) return 1;
  let pct = Math.round(sim * 100); // 0..100
  if (pct < 1) pct = 1;            // boss rule: at least 1%
  if (pct > 99) pct = 99;          // keep 100% as something special if needed
  return pct;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const emailRaw = body.email as string | undefined;

    if (!emailRaw) {
      return NextResponse.json(
        { ok: false, error: "email is required" },
        { status: 400 }
      );
    }

    const email = emailRaw.trim().toLowerCase();

    // 1) Find user
    const userRes = await query<{
      id: string;
      is_active: boolean;
      is_email_verified: boolean;
    }>(
      `
      SELECT id, is_active, is_email_verified
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { ok: false, error: "Account is inactive" },
        { status: 403 }
      );
    }

    if (!user.is_email_verified) {
      return NextResponse.json(
        { ok: false, error: "Email not verified" },
        { status: 403 }
      );
    }

    const userId = user.id;

    // 2) Make sure we have an embedding for this user
    const embCheck = await query<{ user_id: string }>(
      `
      SELECT user_id
      FROM user_embeddings
      WHERE user_id = $1
      `,
      [userId]
    );

    if (embCheck.rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No embedding for this user yet. Answer more journey questions.",
        },
        { status: 400 }
      );
    }

    // 3) Find similar users using pgvector
    // We avoid sending the vector from JS; we reuse the one in the DB via a self-join.
    const matchRes = await query<{
      id: string;
      display_name: string;
      similarity: number;
    }>(
      `
      WITH current_vec AS (
        SELECT journey_embedding
        FROM user_embeddings
        WHERE user_id = $1
      )
      SELECT
        u.id,
        u.display_name,
        -- similarity ~ 1 - distance  (assuming cosine or normalized vectors)
        1 - (ue.journey_embedding <-> (SELECT journey_embedding FROM current_vec)) AS similarity
      FROM user_embeddings ue
      JOIN users u ON u.id = ue.user_id
      WHERE ue.user_id <> $1
        AND u.is_active = true
      ORDER BY ue.journey_embedding <-> (SELECT journey_embedding FROM current_vec)
      LIMIT 20
      `,
      [userId]
    );

    let matches = matchRes.rows.map((row) => ({
      userId: row.id,
      displayName: row.display_name,
      similarity: Number(row.similarity),
      certaintyPercent: similarityToPercent(Number(row.similarity)),
    }));

    // 4) Boss rule: NEVER 0 matches → fallback to a random active user if needed
    if (matches.length === 0) {
      const fbRes = await query<{
        id: string;
        display_name: string;
      }>(
        `
        SELECT id, display_name
        FROM users
        WHERE id <> $1
          AND is_active = true
        ORDER BY random()
        LIMIT 1
        `,
        [userId]
      );

      if (fbRes.rows.length > 0) {
        const fb = fbRes.rows[0];
        matches = [
          {
            userId: fb.id,
            displayName: fb.display_name,
            similarity: 0,
            certaintyPercent: 1, // minimum certainty – still shows “1% sure”
          },
        ];
      }
    }

    return NextResponse.json({
      ok: true,
      userId,
      matches,
    });
  } catch (err) {
    console.error("[/api/match] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Matchmaking failed" },
      { status: 500 }
    );
  }
}
