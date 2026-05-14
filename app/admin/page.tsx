"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [signals, setSignals] = useState<any[]>([]);

  const [editId, setEditId] = useState<number | null>(null);

  const [loadingAuth, setLoadingAuth] = useState(true);

  const [emiten, setEmiten] = useState("");
  const [tradingType, setTradingType] = useState("");

  const [entry1, setEntry1] = useState("");
  const [entry1Date, setEntry1Date] = useState<Date | null>(null);

  const [entry2, setEntry2] = useState("");
  const [entry2Date, setEntry2Date] = useState<Date | null>(null);

  const [entry3, setEntry3] = useState("");
  const [entry3Date, setEntry3Date] = useState<Date | null>(null);

  const [tp1, setTp1] = useState("");
  const [tp2, setTp2] = useState("");
  const [tp3, setTp3] = useState("");

  const [status, setStatus] = useState("RUNNING");

  const [highPrice, setHighPrice] = useState("");

  const [doneDate, setDoneDate] = useState<Date | null>(null);

  // =========================
  // CHECK LOGIN
  // =========================

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    setLoadingAuth(false);
  }

  // =========================
  // AUTO AVG
  // =========================

  const entries = [
    Number(entry1) || 0,
    Number(entry2) || 0,
    Number(entry3) || 0,
  ].filter((n) => n > 0);

  const avg =
    entries.length > 0
      ? entries.reduce((a, b) => a + b, 0) / entries.length
      : 0;

  // =========================
  // AUTO TP
  // =========================

  let autoTp = 0;

  if (
    tradingType === "HAKA PREOPEN" ||
    tradingType === "BSJC" ||
    tradingType === "MENU TAMBAHAN"
  ) {
    autoTp = avg * 1.03;
  }

  if (tradingType === "LIVE TRADE") {
    autoTp = avg * 1.04;
  }

  // =========================
  // AUTO PROFIT
  // =========================

  const calculatedProfit =
    highPrice && avg
      ? (((Number(highPrice) - avg) / avg) * 100).toFixed(2)
      : "0";

  // =========================
  // FETCH DATA
  // =========================

  async function fetchSignals() {
    const { data } = await supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false });

    setSignals(data || []);
  }

  useEffect(() => {
    fetchSignals();

    const channel = supabase
      .channel("admin-signals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signals",
        },
        () => {
          fetchSignals();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // RESET FORM
  // =========================

  function resetForm() {
    setEditId(null);

    setEmiten("");
    setTradingType("");

    setEntry1("");
    setEntry1Date(null);

    setEntry2("");
    setEntry2Date(null);

    setEntry3("");
    setEntry3Date(null);

    setTp1("");
    setTp2("");
    setTp3("");

    setStatus("RUNNING");

    setHighPrice("");

    setDoneDate(null);
  }

  // =========================
  // SAVE SIGNAL
  // =========================

  async function saveSignal() {
    const payload = {
      tanggal_signal: new Date(),

      emiten,

      trading_type: tradingType,

      entry_1: entry1 ? Number(entry1) : null,
      entry_1_date: entry1Date,

      entry_2: entry2 ? Number(entry2) : null,
      entry_2_date: entry2Date,

      entry_3: entry3 ? Number(entry3) : null,
      entry_3_date: entry3Date,

      avg: Number(avg.toFixed(2)),

      tp: tradingType !== "SWING" ? Number(autoTp.toFixed(2)) : null,

      tp_1: tradingType === "SWING" ? Number(tp1) : null,

      tp_2: tradingType === "SWING" ? Number(tp2) : null,

      tp_3: tradingType === "SWING" ? Number(tp3) : null,

      status,

      high_price: highPrice ? Number(highPrice) : null,

      profit_percentage: Number(calculatedProfit),

      done_date: doneDate,
    };

    let error = null;

    if (editId) {
      const result = await supabase
        .from("signals")
        .update(payload)
        .eq("id", editId);

      error = result.error;
    } else {
      const result = await supabase.from("signals").insert([payload]);

      error = result.error;
    }

    if (error) {
      alert(error.message);
      return;
    }

    alert(editId ? "Signal berhasil diupdate!" : "Signal berhasil disimpan!");

    resetForm();

    fetchSignals();
  }

  // =========================
  // DELETE
  // =========================

  async function deleteSignal(id: number) {
    const confirmDelete = confirm("Yakin ingin menghapus signal ini?");

    if (!confirmDelete) return;

    const { error } = await supabase.from("signals").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchSignals();
  }

  // =========================
  // EDIT
  // =========================

  function editSignal(signal: any) {
    setEditId(signal.id);

    setEmiten(signal.emiten || "");

    setTradingType(signal.trading_type || "");

    setEntry1(signal.entry_1?.toString() || "");
    setEntry1Date(signal.entry_1_date ? new Date(signal.entry_1_date) : null);

    setEntry2(signal.entry_2?.toString() || "");
    setEntry2Date(signal.entry_2_date ? new Date(signal.entry_2_date) : null);

    setEntry3(signal.entry_3?.toString() || "");
    setEntry3Date(signal.entry_3_date ? new Date(signal.entry_3_date) : null);

    setTp1(signal.tp_1?.toString() || "");
    setTp2(signal.tp_2?.toString() || "");
    setTp3(signal.tp_3?.toString() || "");

    setStatus(signal.status || "RUNNING");

    setHighPrice(signal.high_price?.toString() || "");

    setDoneDate(signal.done_date ? new Date(signal.done_date) : null);
  }

  // =========================
  // LOADING AUTH
  // =========================

  if (loadingAuth) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold text-yellow-400">Loading...</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-5 md:p-10">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-5xl font-bold text-yellow-400">ADMIN PANEL</h1>

        <button
          onClick={async () => {
            await supabase.auth.signOut();

            router.push("/login");
          }}
          className="bg-red-500 px-6 py-3 rounded-2xl font-bold"
        >
          LOGOUT
        </button>
      </div>

      <div className="max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-5">
        {/* EMITEN */}
        <input
          type="text"
          placeholder="Emiten"
          value={emiten}
          onChange={(e) => setEmiten(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        {/* TRADING TYPE */}
        <select
          value={tradingType}
          onChange={(e) => setTradingType(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        >
          <option value="">Pilih Trading Type</option>

          <option value="HAKA PREOPEN">HAKA PREOPEN</option>

          <option value="BSJC">BSJC</option>

          <option value="LIVE TRADE">LIVE TRADE</option>

          <option value="MENU TAMBAHAN">MENU TAMBAHAN</option>

          <option value="SWING">SWING</option>
        </select>

        {/* ENTRY 1 */}
        <input
          type="number"
          placeholder="Entry 1"
          value={entry1}
          onChange={(e) => setEntry1(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        <DatePicker
          selected={entry1Date}
          onChange={(date: Date | null) => setEntry1Date(date)}
          dateFormat="dd MMM yyyy"
          placeholderText="Tanggal Entry 1"
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        {/* ENTRY 2 */}
        <input
          type="number"
          placeholder="Entry 2"
          value={entry2}
          onChange={(e) => setEntry2(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        <DatePicker
          selected={entry2Date}
          onChange={(date: Date | null) => setEntry2Date(date)}
          dateFormat="dd MMM yyyy"
          placeholderText="Tanggal Entry 2"
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        {/* ENTRY 3 */}
        <input
          type="number"
          placeholder="Entry 3"
          value={entry3}
          onChange={(e) => setEntry3(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        <DatePicker
          selected={entry3Date}
          onChange={(date: Date | null) => setEntry3Date(date)}
          dateFormat="dd MMM yyyy"
          placeholderText="Tanggal Entry 3"
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        {/* AVG */}
        <input
          type="text"
          readOnly
          value={avg.toFixed(2)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-zinc-400"
        />

        {/* NON SWING */}
        {tradingType !== "SWING" && (
          <input
            type="text"
            readOnly
            value={autoTp.toFixed(2)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-yellow-400 font-bold"
          />
        )}

        {/* SWING */}
        {tradingType === "SWING" && (
          <>
            <input
              type="number"
              placeholder="TP 1"
              value={tp1}
              onChange={(e) => setTp1(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-4"
            />

            <input
              type="number"
              placeholder="TP 2"
              value={tp2}
              onChange={(e) => setTp2(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-4"
            />

            <input
              type="number"
              placeholder="TP 3"
              value={tp3}
              onChange={(e) => setTp3(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-4"
            />
          </>
        )}

        {/* STATUS */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        >
          <option value="RUNNING">RUNNING</option>

          <option value="DONE">DONE</option>
        </select>

        {/* HIGH PRICE */}
        <input
          type="number"
          placeholder="High Price"
          value={highPrice}
          onChange={(e) => setHighPrice(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        {/* PROFIT */}
        <input
          type="text"
          readOnly
          value={`${calculatedProfit}%`}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-green-400 font-bold"
        />

        {/* DONE DATE */}
        <DatePicker
          selected={doneDate}
          onChange={(date: Date | null) => setDoneDate(date)}
          dateFormat="dd MMM yyyy"
          placeholderText="Done Date"
          className="w-full bg-black border border-zinc-700 rounded-xl p-4"
        />

        {/* BUTTON */}
        <button
          type="button"
          onClick={saveSignal}
          className="bg-yellow-400 text-black px-8 py-4 rounded-2xl font-bold w-full"
        >
          {editId ? "UPDATE SIGNAL" : "SIMPAN SIGNAL"}
        </button>
      </div>
    </main>
  );
}
