"use client";

import { useEffect, useRef } from "react";

interface Props {
  symbol: string;
}

export default function MiniTradingView({ symbol }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = "";

    const script = document.createElement("script");

    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";

    script.type = "text/javascript";

    script.async = true;

    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: "100%",
      height: "180",
      locale: "id",
      dateRange: "12M",
      colorTheme: "dark",
      trendLineColor: "#fde68a",
      underLineColor: "rgba(252,211,77,0.15)",
      underLineBottomColor: "rgba(253,230,138,0.01)",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02] backdrop-blur-xl">
      <div ref={container} className="tradingview-widget-container" />
    </div>
  );
}
