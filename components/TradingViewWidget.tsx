"use client";

import { useEffect, useRef } from "react";

export default function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = "";

    const script = document.createElement("script");

    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

    script.type = "text/javascript";

    script.async = true;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "IDX:COMPOSITE",
      interval: "D",
      timezone: "Asia/Jakarta",
      theme: "dark",
      style: "1",
      locale: "id",
      hide_top_toolbar: true,
      hide_legend: false,
      allow_symbol_change: true,
      withdateranges: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    container.current.appendChild(script);
  }, []);

  return (
    <div className="w-full h-[320px] md:h-[500px] rounded-3xl overflow-hidden">
      <div className="tradingview-widget-container h-full" ref={container} />
    </div>
  );
}
