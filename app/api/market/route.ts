import YahooFinance from "yahoo-finance2";
import { NextResponse } from "next/server";

const yahooFinance = new YahooFinance();
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json({
        error: "Symbol required",
      });
    }

    const result: any = await yahooFinance.quote(`${symbol}.JK`);

    return NextResponse.json({
      symbol: result.symbol || "-",
      price: result.regularMarketPrice || 0,
      open: result.regularMarketOpen || 0,
      high: result.regularMarketDayHigh || 0,
      low: result.regularMarketDayLow || 0,
      volume: result.regularMarketVolume || 0,
      change: result.regularMarketChangePercent || 0,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      error: "Failed fetch market data",
      detail: String(error),
    });
  }
}
