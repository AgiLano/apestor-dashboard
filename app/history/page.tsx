"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function HistoryPage() {
  const [signals, setSignals] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [typeFilter, setTypeFilter] = useState("ALL");

  const [dateFilter, setDateFilter] = useState("ALL");

  // =========================
  // FETCH
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
      .channel("history-signals")
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

  const now = new Date();

  const filteredSignals = signals.filter((signal) => {
    const cocokSearch = signal.emiten
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const cocokStatus =
      statusFilter === "ALL" ? true : signal.status === statusFilter;

    const cocokType =
      typeFilter === "ALL" ? true : signal.trading_type === typeFilter;

    let cocokDate = true;

    if (signal.tanggal_signal) {
      const signalDate = new Date(signal.tanggal_signal);

      if (dateFilter === "TODAY") {
        cocokDate =
          signalDate.getDate() === now.getDate() &&
          signalDate.getMonth() === now.getMonth() &&
          signalDate.getFullYear() === now.getFullYear();
      }

      if (dateFilter === "WEEK") {
        const diff =
          (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24);

        cocokDate = diff <= 7;
      }

      if (dateFilter === "MONTH") {
        cocokDate =
          signalDate.getMonth() === now.getMonth() &&
          signalDate.getFullYear() === now.getFullYear();
      }
    }

    return cocokSearch && cocokStatus && cocokType && cocokDate;
  });

  // =========================
  // STATS
  // =========================

  const totalSignals = filteredSignals.length;

  const totalDone = filteredSignals.filter((s) => s.status === "DONE").length;

  const totalRunning = filteredSignals.filter(
    (s) => s.status === "RUNNING",
  ).length;

  const avgProfit =
    totalSignals > 0
      ? (
          filteredSignals.reduce(
            (acc, curr) => acc + Number(curr.profit_percentage || 0),
            0,
          ) / totalSignals
        ).toFixed(2)
      : "0";

  const winrate =
    totalSignals > 0 ? ((totalDone / totalSignals) * 100).toFixed(1) : "0";

  // =========================
  // FORMAT DATE
  // =========================

  function formatDate(date: string) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // =========================
  // EXPORT PDF
  // =========================

  function exportPDF() {
    const doc = new jsPDF();

    doc.setFillColor(0, 0, 0);

    doc.rect(0, 0, 300, 300, "F");

    doc.setTextColor(255, 215, 0);

    doc.setFontSize(26);

    doc.text("APESTOR HISTORY RECAP", 14, 20);

    doc.setTextColor(255, 255, 255);

    doc.setFontSize(12);

    doc.text(`Total Signals : ${totalSignals}`, 14, 35);

    doc.text(`Done : ${totalDone}`, 14, 43);

    doc.text(`Running : ${totalRunning}`, 14, 51);

    doc.text(`Avg Profit : ${avgProfit}%`, 14, 59);

    doc.text(`Winrate : ${winrate}%`, 14, 67);

    autoTable(doc, {
      startY: 80,

      head: [
        ["Date", "Emiten", "Type", "AVG", "Timeline", "TP", "Profit", "Status"],
      ],

      body: filteredSignals.map((signal) => [
        formatDate(signal.tanggal_signal),
        signal.emiten,
        signal.trading_type,
        signal.avg || "-",
        [
          signal.entry_1
            ? `E1 ${signal.entry_1} (${formatDate(signal.entry_1_date)})`
            : null,

          signal.entry_2 && Number(signal.entry_2) > 0
            ? `E2 ${signal.entry_2} (${formatDate(signal.entry_2_date)})`
            : null,

          signal.entry_3 && Number(signal.entry_3) > 0
            ? `E3 ${signal.entry_3} (${formatDate(signal.entry_3_date)})`
            : null,

          signal.done_date ? `DONE (${formatDate(signal.done_date)})` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        signal.trading_type === "SWING" ? signal.tp_1 || "-" : signal.tp || "-",
        `${signal.profit_percentage || 0}%`,
        signal.status,
      ]),

      styles: {
        fillColor: [15, 15, 15],
        textColor: [255, 255, 255],
      },

      headStyles: {
        fillColor: [255, 215, 0],
        textColor: [0, 0, 0],
      },

      alternateRowStyles: {
        fillColor: [25, 25, 25],
      },
    });

    doc.save("apestor-history.pdf");
  }

  // =========================
  // DOWNLOAD IMAGE
  // =========================

  function downloadImage() {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFillColor(0, 0, 0);

    doc.rect(0, 0, 297, 210, "F");

    doc.setTextColor(255, 215, 0);

    doc.setFontSize(28);

    doc.text("APESTOR HISTORY RECAP", 14, 20);

    autoTable(doc, {
      startY: 35,

      head: [["Date", "Emiten", "Type", "AVG", "TP", "Profit", "Status"]],

      body: filteredSignals.map((signal) => [
        formatDate(signal.tanggal_signal),
        signal.emiten,
        signal.trading_type,
        signal.avg || "-",
        signal.trading_type === "SWING" ? signal.tp_1 || "-" : signal.tp || "-",
        `${signal.profit_percentage || 0}%`,
        signal.status,
      ]),

      theme: "grid",

      styles: {
        fillColor: [15, 15, 15],
        textColor: [255, 255, 255],
        lineColor: [35, 35, 35],
        lineWidth: 0.2,
        fontSize: 11,
      },

      headStyles: {
        fillColor: [255, 215, 0],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },

      alternateRowStyles: {
        fillColor: [25, 25, 25],
      },

      bodyStyles: {
        textColor: [255, 255, 255],
      },
    });

    doc.save("apestor-history-image.pdf");
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-black text-white p-5 md:p-10">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-10">
            <h1 className="text-5xl md:text-7xl font-black text-yellow-400">
              HISTORY RECAP
            </h1>

            <p className="text-zinc-400 mt-3 text-lg">
              Rekapan seluruh history signal
            </p>
          </div>

          {/* BUTTON */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={exportPDF}
              className="bg-yellow-400 hover:bg-yellow-300 transition text-black font-bold px-6 py-3 rounded-2xl"
            >
              Export PDF
            </button>

            <button
              onClick={downloadImage}
              className="bg-blue-500 hover:bg-blue-400 transition text-white font-bold px-6 py-3 rounded-2xl"
            >
              Download Image
            </button>
          </div>

          {/* DATE FILTER */}
          <div className="flex flex-wrap gap-3 mb-8">
            {["ALL", "TODAY", "WEEK", "MONTH"].map((item) => (
              <button
                key={item}
                onClick={() => setDateFilter(item)}
                className={`px-5 py-3 rounded-2xl font-bold transition ${
                  dateFilter === item
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-900 border border-zinc-800 text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <input
              type="text"
              placeholder="Search Emiten..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 outline-none"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 outline-none"
            >
              <option value="ALL">ALL STATUS</option>

              <option value="RUNNING">RUNNING</option>

              <option value="DONE">DONE</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 outline-none"
            >
              <option value="ALL">ALL TYPE</option>

              <option value="HAKA PREOPEN">HAKA PREOPEN</option>

              <option value="BSJC">BSJC</option>

              <option value="LIVE TRADE">LIVE TRADE</option>

              <option value="MENU TAMBAHAN">MENU TAMBAHAN</option>

              <option value="SWING">SWING</option>
            </select>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-400">Total Signals</p>

              <h2 className="text-4xl font-bold text-yellow-400 mt-3">
                {totalSignals}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-400">Running</p>

              <h2 className="text-4xl font-bold text-red-400 mt-3">
                {totalRunning}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-400">Done</p>

              <h2 className="text-4xl font-bold text-green-400 mt-3">
                {totalDone}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-400">Avg Profit</p>

              <h2 className="text-4xl font-bold text-blue-400 mt-3">
                {avgProfit}%
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-400">Winrate</p>

              <h2 className="text-4xl font-bold text-purple-400 mt-3">
                {winrate}%
              </h2>
            </div>
          </div>

          {/* TABLE */}
          <div className="hidden md:block overflow-x-auto border border-zinc-800 rounded-3xl">
            <table className="w-full min-w-[1000px] bg-zinc-900">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="p-5 text-left">Date</th>

                  <th className="p-5 text-left">Emiten</th>

                  <th className="p-5 text-left">Type</th>

                  <th className="p-5 text-left">AVG</th>

                  <th className="p-5 text-left">Timeline</th>

                  <th className="p-5 text-left">TP</th>

                  <th className="p-5 text-left">Profit</th>

                  <th className="p-5 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredSignals.map((signal) => (
                  <tr key={signal.id} className="border-t border-zinc-800">
                    <td className="p-5">{formatDate(signal.tanggal_signal)}</td>

                    <td className="p-5 font-bold text-yellow-400">
                      {signal.emiten}
                    </td>

                    <td className="p-5">{signal.trading_type}</td>

                    <td className="p-5">{signal.avg || "-"}</td>

                    <td className="p-5">
                      <div className="space-y-3 text-sm">
                        {/* ENTRY 1 */}
                        {Number(signal.entry_1) > 0 && (
                          <div className="bg-zinc-800 rounded-2xl p-3">
                            <p className="text-yellow-400 font-bold">ENTRY 1</p>

                            <p className="text-white font-semibold">
                              {signal.entry_1}
                            </p>

                            <p className="text-zinc-400 text-xs mt-1">
                              {signal.entry_1_date
                                ? formatDate(signal.entry_1_date)
                                : "-"}
                            </p>
                          </div>
                        )}

                        {/* ENTRY 2 */}
                        {Number(signal.entry_2) > 0 && (
                          <div className="bg-zinc-800 rounded-2xl p-3">
                            <p className="text-blue-400 font-bold">ENTRY 2</p>

                            <p className="text-white font-semibold">
                              {signal.entry_2}
                            </p>

                            <p className="text-zinc-400 text-xs mt-1">
                              {signal.entry_2_date
                                ? formatDate(signal.entry_2_date)
                                : "-"}
                            </p>
                          </div>
                        )}

                        {/* ENTRY 3 */}
                        {Number(signal.entry_3) > 0 && (
                          <div className="bg-zinc-800 rounded-2xl p-3">
                            <p className="text-purple-400 font-bold">ENTRY 3</p>

                            <p className="text-white font-semibold">
                              {signal.entry_3}
                            </p>

                            <p className="text-zinc-400 text-xs mt-1">
                              {signal.entry_3_date
                                ? formatDate(signal.entry_3_date)
                                : "-"}
                            </p>
                          </div>
                        )}

                        {/* DONE */}
                        {signal.done_date && (
                          <div className="bg-green-500/10 border border-green-500 rounded-2xl p-3">
                            <p className="text-green-400 font-bold">DONE</p>

                            <p className="text-zinc-300 text-xs mt-1">
                              {signal.done_date
                                ? formatDate(signal.done_date)
                                : "-"}
                            </p>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-5">
                      {signal.trading_type === "SWING"
                        ? signal.tp_1 || "-"
                        : signal.tp || "-"}
                    </td>

                    <td className="p-5 text-green-400 font-bold">
                      {signal.profit_percentage || 0}%
                    </td>

                    <td className="p-5">
                      <span
                        className={
                          signal.status === "DONE"
                            ? "text-green-400 font-bold"
                            : "text-red-400 font-bold"
                        }
                      >
                        {signal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* MOBILE CARD */}
          <div className="md:hidden space-y-4">
            {filteredSignals.map((signal) => (
              <div
                key={signal.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5"
              >
                {/* TOP */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-black text-yellow-400">
                      {signal.emiten}
                    </h2>

                    <p className="text-zinc-400 text-sm mt-1">
                      {signal.trading_type}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`px-4 py-2 rounded-2xl text-sm font-bold ${
                        signal.status === "DONE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {signal.status}
                    </span>
                  </div>
                </div>

                {/* DATE */}
                <div className="mb-4">
                  <p className="text-zinc-500 text-sm">Tanggal</p>

                  <p className="font-semibold">
                    {formatDate(signal.tanggal_signal)}
                  </p>
                </div>

                {/* ENTRY */}
                <div className="space-y-3 mb-5">
                  {Number(signal.entry_1) > 0 && (
                    <div className="bg-zinc-800 rounded-2xl p-3">
                      <p className="text-yellow-400 font-bold text-sm">
                        ENTRY 1
                      </p>

                      <p className="text-xl font-bold">{signal.entry_1}</p>

                      <p className="text-zinc-500 text-xs mt-1">
                        {signal.entry_1_date
                          ? formatDate(signal.entry_1_date)
                          : "-"}
                      </p>
                    </div>
                  )}

                  {Number(signal.entry_2) > 0 && (
                    <div className="bg-zinc-800 rounded-2xl p-3">
                      <p className="text-blue-400 font-bold text-sm">ENTRY 2</p>

                      <p className="text-xl font-bold">{signal.entry_2}</p>

                      <p className="text-zinc-500 text-xs mt-1">
                        {signal.entry_2_date
                          ? formatDate(signal.entry_2_date)
                          : "-"}
                      </p>
                    </div>
                  )}

                  {Number(signal.entry_3) > 0 && (
                    <div className="bg-zinc-800 rounded-2xl p-3">
                      <p className="text-purple-400 font-bold text-sm">
                        ENTRY 3
                      </p>

                      <p className="text-xl font-bold">{signal.entry_3}</p>

                      <p className="text-zinc-500 text-xs mt-1">
                        {signal.entry_3_date
                          ? formatDate(signal.entry_3_date)
                          : "-"}
                      </p>
                    </div>
                  )}
                </div>

                {/* BOTTOM */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-800 rounded-2xl p-3">
                    <p className="text-zinc-500 text-xs">AVG</p>

                    <p className="font-bold text-lg">{signal.avg || "-"}</p>
                  </div>

                  <div className="bg-zinc-800 rounded-2xl p-3">
                    <p className="text-zinc-500 text-xs">TP</p>

                    <p className="font-bold text-lg">
                      {signal.trading_type === "SWING"
                        ? signal.tp_1 || "-"
                        : signal.tp || "-"}
                    </p>
                  </div>

                  <div className="bg-zinc-800 rounded-2xl p-3">
                    <p className="text-zinc-500 text-xs">PROFIT</p>

                    <p className="font-bold text-lg text-green-400">
                      {signal.profit_percentage || 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
