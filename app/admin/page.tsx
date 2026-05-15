"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminPage() {
  const router = useRouter();

  // =========================
  // AUTH
  // =========================

  const [checkingAuth, setCheckingAuth] = useState(true);

  // =========================
  // SIGNAL STATE
  // =========================

  const [signals, setSignals] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [typeFilter, setTypeFilter] = useState("ALL");
  // =========================
  // FORM STATE
  // =========================

  const [emiten, setEmiten] = useState("");

  const [tradingType, setTradingType] = useState("");

  const [entry1, setEntry1] = useState("");

  const [signalDate, setSignalDate] = useState<Date | null>(new Date());

  const [entry1Date, setEntry1Date] = useState<Date | null>(new Date());

  const [entry2, setEntry2] = useState("");

  const [entry2Date, setEntry2Date] = useState<Date | null>(new Date());

  const [entry3, setEntry3] = useState("");

  const [entry3Date, setEntry3Date] = useState<Date | null>(new Date());

  const [doneDate, setDoneDate] = useState<Date | null>(new Date());

  const [avg, setAvg] = useState("");

  const [tp, setTp] = useState("");

  const [tp1, setTp1] = useState("");

  const [tp2, setTp2] = useState("");

  const [tp3, setTp3] = useState("");

  const [status, setStatus] = useState("RUNNING");

  const [highPrice, setHighPrice] = useState("");

  const [profitPercentage, setProfitPercentage] = useState("");

  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkUser();
  }, [router]);

  // =========================
  // GET SIGNALS
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
      .channel("admin-signals")
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
  // AUTO AVG
  // =========================

  useEffect(() => {
    const numbers = [
      Number(entry1 || 0),
      Number(entry2 || 0),
      Number(entry3 || 0),
    ].filter((n) => n > 0);

    if (numbers.length > 0) {
      const total = numbers.reduce((a, b) => a + b, 0);

      const average = total / numbers.length;

      setAvg(Number(average.toFixed(2)).toString());
    } else {
      setAvg("");
    }
  }, [entry1, entry2, entry3]);

  // =========================
  // AUTO PROFIT
  // =========================

  useEffect(() => {
    if (!avg || !highPrice) {
      setProfitPercentage("");
      return;
    }

    const result = ((Number(highPrice) - Number(avg)) / Number(avg)) * 100;

    setProfitPercentage(Number(result.toFixed(2)).toString());
  }, [avg, highPrice]);

  // =========================
  // SAVE SIGNAL
  // =========================

  async function saveSignal() {
    if (!emiten || !tradingType) {
      toast.error("Lengkapi data terlebih dahulu!");
      return;
    }

    setLoading(true);

    const payload = {
      tanggal_signal: signalDate
        ? signalDate.toISOString().split("T")[0]
        : null,
      emiten: emiten.toUpperCase(),

      trading_type: tradingType,
      entry_1: entry1 ? Number(entry1) : null,
      entry_1_date: entry1Date ? entry1Date.toISOString().split("T")[0] : null,

      entry_2: entry2 ? Number(entry2) : null,
      entry_2_date: entry2Date ? entry2Date.toISOString().split("T")[0] : null,

      entry_3: entry3 ? Number(entry3) : null,
      entry_3_date: entry3Date ? entry3Date.toISOString().split("T")[0] : null,

      avg: Number(avg),

      tp: tradingType === "SWING" ? null : Number(tp),

      tp_1: tradingType === "SWING" ? Number(tp1) : null,

      tp_2: tradingType === "SWING" ? Number(tp2) : null,

      tp_3: tradingType === "SWING" ? Number(tp3) : null,

      status,

      done_date:
        status === "DONE" && doneDate
          ? doneDate.toISOString().split("T")[0]
          : null,

      high_price: Number(highPrice),

      profit_percentage: Number(profitPercentage),
    };

    let error = null;

    // =========================
    // UPDATE
    // =========================

    if (editingId) {
      const response = await supabase
        .from("signals")
        .update(payload)
        .eq("id", editingId);

      error = response.error;
    }

    // =========================
    // INSERT
    // =========================
    else {
      const response = await supabase.from("signals").insert([
        {
          ...payload,
        },
      ]);

      error = response.error;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      editingId ? "Signal berhasil diupdate!" : "Signal berhasil disimpan!",
    );

    // RESET
    setEditingId(null);

    setEmiten("");
    setTradingType("");

    setEntry1("");
    setEntry2("");
    setEntry3("");

    setAvg("");

    setTp("");
    setTp1("");
    setTp2("");
    setTp3("");

    setStatus("RUNNING");

    setHighPrice("");

    setProfitPercentage("");
  }
  // =========================
  // DELETE SIGNAL
  // =========================

  async function deleteSignal(id: number) {
    const confirmDelete = confirm("Yakin ingin menghapus signal ini?");

    if (!confirmDelete) return;

    const { error } = await supabase.from("signals").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signal berhasil dihapus!");
  }

  // =========================
  // FORMAT DATE
  // =========================

  // =========================
  // FILTERED SIGNALS
  // =========================

  const filteredSignals = signals.filter((signal) => {
    const cocokSearch = signal.emiten
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const cocokStatus =
      statusFilter === "ALL" ? true : signal.status === statusFilter;

    const cocokType =
      typeFilter === "ALL" ? true : signal.trading_type === typeFilter;

    return cocokSearch && cocokStatus && cocokType;
  });

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // =========================
  // LOADING
  // =========================

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo-navbar.png"
            alt="Loading"
            className="w-20 h-20 rounded-full border-2 border-yellow-400 animate-pulse"
          />

          <h1 className="text-yellow-400 text-2xl font-black">
            Checking Admin Access...
          </h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white p-5 md:p-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
          <div>
            <h1 className="text-3xl md:text-6xl font-black text-yellow-400 leading-tight">
              ADMIN PANEL
            </h1>

            <p className="text-zinc-400 mt-2 text-sm md:text-lg">
              Kelola signal trading APESTOR
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={async () => {
                await supabase.auth.signOut();

                router.push("/login");
              }}
              className="w-full md:w-auto bg-red-500 hover:bg-red-400 transition px-5 py-3 rounded-2xl font-bold text-sm md:text-base"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* FORM */}
        <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-8 space-y-4 md:space-y-5 mb-10">
          {/* EMITEN */}
          <input
            type="text"
            placeholder="Emiten"
            value={emiten}
            onChange={(e) => setEmiten(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
          />

          {/* TRADING TYPE */}
          <select
            value={tradingType}
            onChange={(e) => setTradingType(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
          >
            <option value="">Pilih Trading Type</option>

            <option value="HAKA PREOPEN">HAKA PREOPEN</option>

            <option value="BSJC">BSJC</option>

            <option value="LIVE TRADE">LIVE TRADE</option>

            <option value="MENU TAMBAHAN">MENU TAMBAHAN</option>

            <option value="SWING">SWING</option>
          </select>

          {/* SIGNAL DATE */}
          <div className="mb-4">
            <p className="text-zinc-400 mb-2">Signal Date</p>

            <DatePicker
              selected={signalDate}
              onChange={(date: Date | null) => setSignalDate(date)}
              dateFormat="EEEE, d MMMM yyyy"
              className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
              placeholderText="Pilih tanggal signal"
            />
          </div>

          {/* ENTRY 1 */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Entry 1"
              value={entry1}
              onChange={(e) => setEntry1(e.target.value)}
              className="bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
            />

            <DatePicker
              selected={entry1Date}
              onChange={(date: Date | null) => setEntry1Date(date)}
              dateFormat="EEEE, d MMMM yyyy"
              className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
              placeholderText="Pilih tanggal"
            />
          </div>

          {/* ENTRY 2 */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Entry 2"
              value={entry2}
              onChange={(e) => setEntry2(e.target.value)}
              className="bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
            />

            <DatePicker
              selected={entry2Date}
              onChange={(date: Date | null) => setEntry2Date(date)}
              dateFormat="EEEE, d MMMM yyyy"
              className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
              placeholderText="Pilih tanggal"
            />
          </div>

          {/* ENTRY 3 */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Entry 3"
              value={entry3}
              onChange={(e) => setEntry3(e.target.value)}
              className="bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
            />

            <DatePicker
              selected={entry3Date}
              onChange={(date: Date | null) => setEntry3Date(date)}
              dateFormat="EEEE, d MMMM yyyy"
              className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
              placeholderText="Pilih tanggal"
            />
          </div>

          {/* AVG */}
          <div>
            <label className="block text-zinc-400 mb-2 font-semibold">
              AVG (AUTO)
            </label>

            <div className="w-full bg-blue-500/10 border border-blue-500 text-blue-400 rounded-2xl p-4 font-bold text-xl">
              {avg || "0"}
            </div>
          </div>

          {/* TP */}
          {tradingType !== "SWING" && (
            <input
              type="number"
              placeholder="TP"
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
            />
          )}

          {/* SWING */}
          {tradingType === "SWING" && (
            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="TP 1"
                value={tp1}
                onChange={(e) => setTp1(e.target.value)}
                className="bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
              />

              <input
                type="number"
                placeholder="TP 2"
                value={tp2}
                onChange={(e) => setTp2(e.target.value)}
                className="bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
              />

              <input
                type="number"
                placeholder="TP 3"
                value={tp3}
                onChange={(e) => setTp3(e.target.value)}
                className="bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
              />
            </div>
          )}

          {/* STATUS */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
          >
            <option value="RUNNING">RUNNING</option>

            <option value="DONE">DONE</option>
          </select>

          {status === "DONE" && (
            <DatePicker
              selected={doneDate}
              onChange={(date: Date | null) => setDoneDate(date)}
              dateFormat="EEEE, d MMMM yyyy"
              className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
              placeholderText="Pilih tanggal DONE"
            />
          )}

          {/* HIGH PRICE */}
          <input
            type="number"
            placeholder="High Price"
            value={highPrice}
            onChange={(e) => setHighPrice(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl p-4 outline-none focus:border-yellow-400"
          />

          {/* PROFIT */}
          <div>
            <label className="block text-zinc-400 mb-2 font-semibold">
              PROFIT PERCENTAGE (AUTO)
            </label>

            <div
              className={`w-full rounded-2xl p-4 font-bold text-xl border ${
                Number(profitPercentage) >= 0
                  ? "bg-green-500/10 border-green-500 text-green-400"
                  : "bg-red-500/10 border-red-500 text-red-400"
              }`}
            >
              {profitPercentage || "0"}%
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <div className="mt-8 mb-10 flex flex-col md:flex-row gap-4 max-w-4xl">
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);

                setEmiten("");
                setTradingType("");

                setEntry1("");
                setEntry2("");
                setEntry3("");

                setAvg("");

                setTp("");
                setTp1("");
                setTp2("");
                setTp3("");

                setStatus("RUNNING");

                setHighPrice("");

                setProfitPercentage("");
              }}
              className="
        w-full md:w-40
        bg-zinc-700
        hover:bg-zinc-600
        transition-all
        text-white
        font-bold
        py-4
        rounded-2xl
        text-lg
      "
            >
              CANCEL
            </button>
          )}

          <button
            onClick={saveSignal}
            disabled={loading}
            className="
      w-full
      bg-yellow-400
      hover:bg-yellow-300
      transition-all
      text-black
      font-black
      py-4
      rounded-2xl
      text-lg
      shadow-lg
      shadow-yellow-400/20
    "
          >
            {loading
              ? "MENYIMPAN..."
              : editingId
                ? "UPDATE SIGNAL"
                : "SIMPAN SIGNAL"}
          </button>
        </div>
        {/* FILTER */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
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

        {/* SIGNAL TABLE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-3xl font-black text-yellow-400">
              SIGNAL TERBARU
            </h2>
          </div>
          {/* MOBILE SIGNAL CARDS */}
          <div className="md:hidden space-y-4">
            {filteredSignals.map((signal) => (
              <div
                key={signal.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-black text-yellow-400">
                    {signal.emiten}
                  </h2>

                  <span
                    className={`font-bold ${
                      signal.status === "DONE"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {signal.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-zinc-500">Date:</span>{" "}
                    {formatDate(signal.tanggal_signal)}
                  </p>

                  <p>
                    <span className="text-zinc-500">Type:</span>{" "}
                    {signal.trading_type}
                  </p>

                  <p>
                    <span className="text-zinc-500">AVG:</span> {signal.avg}
                  </p>

                  <p className="text-green-400 font-bold">
                    PROFIT {signal.profit_percentage}%
                  </p>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => {
                      setEditingId(signal.id);

                      setEmiten(signal.emiten || "");

                      setTradingType(signal.trading_type || "");

                      setSignalDate(
                        signal.tanggal_signal
                          ? new Date(signal.tanggal_signal)
                          : null,
                      );

                      setEntry1(signal.entry_1?.toString() || "");

                      setEntry2(signal.entry_2?.toString() || "");

                      setEntry3(signal.entry_3?.toString() || "");

                      setEntry1Date(
                        signal.entry_1_date
                          ? new Date(signal.entry_1_date)
                          : null,
                      );

                      setEntry2Date(
                        signal.entry_2_date
                          ? new Date(signal.entry_2_date)
                          : null,
                      );

                      setEntry3Date(
                        signal.entry_3_date
                          ? new Date(signal.entry_3_date)
                          : null,
                      );

                      setDoneDate(
                        signal.done_date ? new Date(signal.done_date) : null,
                      );

                      setAvg(signal.avg?.toString() || "");

                      setTp(signal.tp?.toString() || "");

                      setTp1(signal.tp_1?.toString() || "");

                      setTp2(signal.tp_2?.toString() || "");

                      setTp3(signal.tp_3?.toString() || "");

                      setStatus(signal.status || "RUNNING");

                      setHighPrice(signal.high_price?.toString() || "");

                      setProfitPercentage(
                        signal.profit_percentage?.toString() || "",
                      );

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-400 py-3 rounded-2xl font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteSignal(signal.id)}
                    className="flex-1 bg-red-500 hover:bg-red-400 py-3 rounded-2xl font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="p-5 text-left">Date</th>

                  <th className="p-5 text-left">Emiten</th>

                  <th className="p-5 text-left">Type</th>

                  <th className="p-5 text-left">AVG</th>

                  <th className="p-5 text-left">Profit</th>

                  <th className="p-5 text-left">Status</th>

                  <th className="p-5 text-left">Action</th>
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

                    <td className="p-5">{signal.avg}</td>

                    <td className="p-5 text-green-400 font-bold">
                      {signal.profit_percentage}%
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

                    <td className="p-5">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingId(signal.id);

                            setEmiten(signal.emiten || "");

                            setTradingType(signal.trading_type || "");

                            setSignalDate(
                              signal.tanggal_signal
                                ? new Date(signal.tanggal_signal)
                                : null,
                            );

                            setEntry1(signal.entry_1?.toString() || "");

                            setEntry2(signal.entry_2?.toString() || "");

                            setEntry3(signal.entry_3?.toString() || "");

                            setEntry1Date(
                              signal.entry_1_date
                                ? new Date(signal.entry_1_date)
                                : null,
                            );

                            setEntry2Date(
                              signal.entry_2_date
                                ? new Date(signal.entry_2_date)
                                : null,
                            );

                            setEntry3Date(
                              signal.entry_3_date
                                ? new Date(signal.entry_3_date)
                                : null,
                            );

                            setDoneDate(
                              signal.done_date
                                ? new Date(signal.done_date)
                                : null,
                            );

                            setAvg(signal.avg?.toString() || "");

                            setTp(signal.tp?.toString() || "");

                            setTp1(signal.tp_1?.toString() || "");

                            setTp2(signal.tp_2?.toString() || "");

                            setTp3(signal.tp_3?.toString() || "");

                            setStatus(signal.status || "RUNNING");

                            setHighPrice(signal.high_price?.toString() || "");

                            setProfitPercentage(
                              signal.profit_percentage?.toString() || "",
                            );

                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }}
                          className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-xl font-bold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteSignal(signal.id)}
                          className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-xl font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
