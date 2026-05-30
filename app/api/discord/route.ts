import { NextResponse } from "next/server";

export async function POST() {
  try {
    const webhook = process.env.DISCORD_WEBHOOK_URL;

    const response = await fetch(webhook!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "🚀 TEST NOTIFIKASI RISE BERHASIL",
      }),
    });

    const result = await response.text();

    return NextResponse.json({
      success: true,
      discord: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      },
    );
  }
}
