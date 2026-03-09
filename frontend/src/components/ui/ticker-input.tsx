"use client";

import { useState, type KeyboardEvent } from "react";

interface TickerInputProps {
  tickers: string[];
  onChange: (tickers: string[]) => void;
  max?: number;
  placeholder?: string;
}

export default function TickerInput({
  tickers,
  onChange,
  max = 20,
  placeholder = "Add ticker (e.g. AAPL)",
}: TickerInputProps) {
  const [input, setInput] = useState("");

  function addTicker() {
    const t = input.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= max) return;
    onChange([...tickers, t]);
    setInput("");
  }

  function removeTicker(ticker: string) {
    onChange(tickers.filter((t) => t !== ticker));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTicker();
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z.]/g, ""))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none"
          maxLength={10}
        />
        <button
          onClick={addTicker}
          disabled={!input.trim() || tickers.length >= max}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {tickers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tickers.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300"
            >
              {t}
              <button
                onClick={() => removeTicker(t)}
                className="ml-1 text-gray-500 hover:text-red-400"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
