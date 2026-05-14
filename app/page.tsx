"use client";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Home() {
  const [signals, setSignals] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  // =========================
  // COLLAPSIBLE
  // =========================

  const [openSections, setOpenSections] = useState({
    haka: true,
    bsjc: true,
    live: true,
    tambahan: true,
    swing: true,
  });

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  // =========================
  // FETCH SIGNALS
  // =========================

  async function getSignals() {
    const { data } = await supabase
      .from("signals")
      .select("*")
      .order("tanggal_signal", {
        ascending: false,
      });

    setSignals(data || []);
  }

  // =========================
  // REALTIME
  // =========================

  useEffect(() => {
    getSignals();

    const channel = supabase
      .channel("signals-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signals",
        },
        () => {
          getSignals();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // FILTER
  // =========================

  const filteredSignals = signals.filter((signal) => {
    const cocokSearch = signal.emiten
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const cocokStatus =
      statusFilter === "ALL" ? true : signal.status === statusFilter;

    return cocokSearch && cocokStatus;
  });

  // =========================
  // CATEGORY
  // =========================

  const hakaSignals = filteredSignals.filter(
    (s) => s.trading_type === "HAKA PREOPEN",
  );

  const bsjcSignals = filteredSignals.filter((s) => s.trading_type === "BSJC");

  const liveSignals = filteredSignals.filter(
    (s) => s.trading_type === "LIVE TRADE",
  );

  const tambahanSignals = filteredSignals.filter(
    (s) => s.trading_type === "MENU TAMBAHAN",
  );

  const swingSignals = filteredSignals.filter(
    (s) => s.trading_type === "SWING",
  );

  // =========================
  // STATS
  // =========================

  const totalSignals = filteredSignals.length;

  const totalRunning = filteredSignals.filter(
    (s) => s.status === "RUNNING",
  ).length;

  const totalDone = filteredSignals.filter((s) => s.status === "DONE").length;

  const winrate =
    totalSignals > 0 ? ((totalDone / totalSignals) * 100).toFixed(1) : "0";

  const avgProfit =
    filteredSignals.length > 0
      ? (
          filteredSignals.reduce(
            (acc, curr) => acc + Number(curr.profit_percentage || 0),
            0,
          ) / filteredSignals.length
        ).toFixed(2)
      : "0";

  // =========================
  // CHART DATA
  // =========================

  const chartData = filteredSignals
    .filter((s) => s.profit_percentage !== null)
    .map((signal) => ({
      name: signal.emiten,
      profit: Number(signal.profit_percentage || 0),
    }))
    .reverse();

  // =========================
  // FORMAT DATE
  // =========================

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // =========================
  // RENDER SIGNALS
  // =========================

  function renderSignals(data: any[]) {
    if (data.length === 0) {
      return <div className="text-zinc-500">Tidak ada signal</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.map((signal) => (
          <div
            key={signal.id}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 hover:border-yellow-400 transition-all duration-300"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-yellow-400">
                  {signal.emiten}
                </h2>

                <p className="text-zinc-400 mt-2 text-sm md:text-base">
                  {signal.trading_type}
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-full font-bold text-xs md:text-sm ${
                  signal.status === "DONE"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {signal.status}
              </span>
            </div>

            {/* DATA */}
            <div className="space-y-2 text-sm md:text-lg">
              <p>
                Entry 1:{" "}
                <span className="font-bold">{signal.entry_1 || "-"}</span>
              </p>

              <p>
                Entry 2:{" "}
                <span className="font-bold">{signal.entry_2 || "-"}</span>
              </p>

              <p>
                Entry 3:{" "}
                <span className="font-bold">{signal.entry_3 || "-"}</span>
              </p>

              <p>
                AVG: <span className="font-bold">{signal.avg || "-"}</span>
              </p>

              {signal.trading_type === "SWING" ? (
                <>
                  <p>
                    TP1: <span className="font-bold">{signal.tp_1 || "-"}</span>
                  </p>

                  <p>
                    TP2: <span className="font-bold">{signal.tp_2 || "-"}</span>
                  </p>

                  <p>
                    TP3: <span className="font-bold">{signal.tp_3 || "-"}</span>
                  </p>
                </>
              ) : (
                <p>
                  TP: <span className="font-bold">{signal.tp || "-"}</span>
                </p>
              )}

              <p>
                High Price:{" "}
                <span className="text-green-400 font-bold">
                  {signal.high_price || "-"}
                </span>
              </p>

              <p>
                Profit:{" "}
                <span className="text-green-400 font-bold">
                  {signal.profit_percentage || 0}%
                </span>
              </p>
            </div>

            {/* DATE */}
            <div className="mt-5 border-t border-zinc-800 pt-4 text-zinc-500 text-xs md:text-sm">
              <p>Signal Date: {formatDate(signal.tanggal_signal)}</p>

              <p className="mt-1">Done Date: {formatDate(signal.done_date)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // =========================
  // SECTION COMPONENT
  // =========================

  function renderSection(
    title: string,
    keyName: keyof typeof openSections,
    data: any[],
  ) {
    return (
      <section className="mb-10">
        <button
          onClick={() => toggleSection(keyName)}
          className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-5 hover:border-yellow-400 transition"
        >
          <div>
            <h2 className="text-2xl md:text-5xl font-bold text-yellow-400 text-left">
              {title}
            </h2>

            <p className="text-zinc-400 mt-1 text-left text-sm md:text-base">
              {data.length} Signals
            </p>
          </div>

          <span className="text-3xl md:text-5xl font-bold">
            {openSections[keyName] ? "−" : "+"}
          </span>
        </button>

        {openSections[keyName] && renderSignals(data)}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-10">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400">
          APESTOR Dashboard
        </h1>

        <p className="text-zinc-400 mt-3 text-base md:text-xl">
          Realtime Trading Community Dashboard
        </p>
      </div>

      {/* SEARCH + FILTER */}
      <div className="sticky top-0 z-50 bg-black pb-5 flex flex-col md:flex-row gap-4 mb-10">
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search Emiten..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 w-full md:w-96"
        />

        {/* FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 w-full md:w-64"
        >
          <option value="ALL">ALL STATUS</option>

          <option value="RUNNING">RUNNING</option>

          <option value="DONE">DONE</option>
        </select>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
          <p className="text-zinc-400 text-sm md:text-base">Total Signals</p>

          <h2 className="text-3xl md:text-5xl font-bold text-yellow-400 mt-3">
            {totalSignals}
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
          <p className="text-zinc-400 text-sm md:text-base">Running</p>

          <h2 className="text-3xl md:text-5xl font-bold text-red-400 mt-3">
            {totalRunning}
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
          <p className="text-zinc-400 text-sm md:text-base">Done</p>

          <h2 className="text-3xl md:text-5xl font-bold text-green-400 mt-3">
            {totalDone}
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
          <p className="text-zinc-400 text-sm md:text-base">Winrate</p>

          <h2 className="text-3xl md:text-5xl font-bold text-blue-400 mt-3">
            {winrate}%
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
          <p className="text-zinc-400 text-sm md:text-base">Avg Profit</p>

          <h2 className="text-3xl md:text-5xl font-bold text-purple-400 mt-3">
            {avgProfit}%
          </h2>
        </div>
      </div>

      {/* PROFIT CHART */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 md:p-8 mb-14">
        <div className="mb-6">
          <h2 className="text-3xl md:text-5xl font-bold text-yellow-400">
            Profit Performance
          </h2>

          <p className="text-zinc-400 mt-2">Realtime profit analytics</p>
        </div>

        <div className="w-full h-72 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

              <XAxis dataKey="name" stroke="#a1a1aa" />

              <YAxis stroke="#a1a1aa" />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="profit"
                stroke="#facc15"
                strokeWidth={4}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTIONS */}
      {renderSection("HAKA PREOPEN", "haka", hakaSignals)}

      {renderSection("BSJC", "bsjc", bsjcSignals)}

      {renderSection("LIVE TRADE", "live", liveSignals)}

      {renderSection("MENU TAMBAHAN", "tambahan", tambahanSignals)}

      {renderSection("SWING", "swing", swingSignals)}
    </main>
  );
}
