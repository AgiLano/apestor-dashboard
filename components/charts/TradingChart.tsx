"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";

interface TradingChartProps {
  data: {
    time: string;
    value: number;
  }[];
}

export default function TradingChart({ data }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          color: "transparent",
        },
        textColor: "#a1a1aa",
      },

      width: chartContainerRef.current.clientWidth,
      height: 400,

      grid: {
        vertLines: {
          color: "rgba(255,255,255,0.03)",
        },
        horzLines: {
          color: "rgba(255,255,255,0.03)",
        },
      },

      crosshair: {
        vertLine: {
          color: "#22d3ee",
          width: 1,
        },
        horzLine: {
          color: "#22d3ee",
          width: 1,
        },
      },

      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },

      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#FFD84D",
      topColor: "rgba(255,216,77,0.18)",
      bottomColor: "rgba(255,216,77,0.00)",
      lineWidth: 2,

      priceLineVisible: false,

      crosshairMarkerVisible: true,

      lastValueVisible: true,
    });

    const cleanedData = data.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.time === item.time),
    );

    areaSeries.setData(cleanedData);

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth || 400,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-3xl overflow-hidden"
    />
  );
}
