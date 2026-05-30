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

    if (error) throw error;

    let updatedCount = 0;

    for (const signal of signals || []) {
      try {
        const result: any = await yahooFinance.quote(`${signal.emiten}.JK`);

        const currentPrice = result?.regularMarketPrice || 0;

        let targetPrice = 0;

        if (signal.trading_type === "SWING") {
          targetPrice = Number(signal.tp_1 || 0);
        } else {
          targetPrice = Number(signal.tp || 0);
        }

        if (targetPrice <= 0) continue;

        if (currentPrice >= targetPrice) {
          const profitPercent =
            signal.avg && Number(signal.avg) > 0
              ? (
                  ((currentPrice - Number(signal.avg)) / Number(signal.avg)) *
                  100
                ).toFixed(2)
              : "0.00";

          await supabaseAdmin
            .from("signals")
            .update({
              status: "DONE",
              done_date: new Date().toISOString().split("T")[0],
              high_price: currentPrice,
              profit_percentage: Number(profitPercent),
            })
            .eq("id", signal.id);

          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/discord`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              embed: {
                title: "🎯 TARGET ACHIEVED",
                color: 0x22c55e,
                description: `📈 ${signal.emiten}

📌 AVG : ${signal.avg}

🎯 Target : ${targetPrice}

💰 Current : ${currentPrice}

🚀 Profit : +${profitPercent}%`,
              },
            }),
          });

          updatedCount++;
        }
      } catch (signalError) {
        console.error(`Error checking ${signal.emiten}:`, signalError);
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
