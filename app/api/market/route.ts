import YahooFinance from "yahoo-finance2";
import { NextResponse } from "next/server";

const yahooFinance = new YahooFinance();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        {
          error: "Symbol required",
        },
        {
          status: 400,
        },
      );
    }

    let yahooSymbol = symbol;

    // IHSG
    if (symbol === "^JKSE") {
      yahooSymbol = "^JKSE";
    } else {
      yahooSymbol = `${symbol.toUpperCase()}.JK`;
    }

    const result: any = await yahooFinance.quote(yahooSymbol);

    if (!result) {
      return NextResponse.json({
        symbol: "-",
        price: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0,
        change: 0,
      });
    }

    return NextResponse.json({
      symbol: result.symbol ?? "-",
      price: result.regularMarketPrice ?? 0,
      open: result.regularMarketOpen ?? 0,
      high: result.regularMarketDayHigh ?? 0,
      low: result.regularMarketDayLow ?? 0,
      volume: result.regularMarketVolume ?? 0,
      change: result.regularMarketChangePercent ?? 0,
    });
  } catch (error) {
    console.error("Market API Error:", error);

    return NextResponse.json({
      symbol: "-",
      price: 0,
      open: 0,
      high: 0,
      low: 0,
      volume: 0,
      change: 0,
    });
  }
}
