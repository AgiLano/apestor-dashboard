import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { supabaseAdmin } from "@/lib/supabase-admin";

const yahooFinance = new YahooFinance();

export async function GET() {
  try {
    const { data: signals, error } = await supabaseAdmin
      .from("signals")
      .select("*")
      .eq("status", "RUNNING");

    if (error) {
      throw error;
    }

    let updatedCount = 0;

    for (const signal of signals || []) {
      const result: any = await yahooFinance.quote(`${signal.emiten}.JK`);

      const currentPrice = result?.regularMarketPrice || 0;

      let targetPrice = 0;

      if (signal.trading_type === "SWING") {
        targetPrice = Number(signal.tp_1 || 0);
      } else {
        targetPrice = Number(signal.tp || 0);
      }

      if (targetPrice > 0 && currentPrice >= targetPrice) {
        await supabaseAdmin
          .from("signals")
          .update({
            status: "DONE",
            done_date: new Date().toISOString().split("T")[0],
          })
          .eq("id", signal.id);

        await fetch(process.env.DISCORD_WEBHOOK_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `🎯 TARGET ACHIEVED

📈 ${signal.emiten}

💰 Current Price : ${currentPrice}

🎯 Target : ${targetPrice}

✅ Status otomatis berubah menjadi DONE`,
          }),
        });

        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
    });
  } catch (error) {
    console.error(error);

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
