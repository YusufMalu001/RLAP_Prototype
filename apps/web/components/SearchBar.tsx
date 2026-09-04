"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import { cartScreenFor, useWidgetStore } from "../lib/store";
import type { SearchResult } from "../lib/types";

const MIN_SEARCH_LENGTH = 3;
const POPULAR_CHIPS = ["USG Abdomen", "CBC", "MRI Brain", "Lipid Profile"];

/**
 * SC1 — persistent search & browse header, shared on G0/R1/L1 (§4.2). Selecting a result adds
 * it straight to the relevant cart, skipping intermediate browse screens.
 */
export function SearchBar() {
  const orgSlug = useWidgetStore((s) => s.orgSlug);
  const addItem = useWidgetStore((s) => s.addItem);
  const navigate = useWidgetStore((s) => s.navigate);
  const cart = useWidgetStore((s) => s.cart);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!orgSlug || query.trim().length < MIN_SEARCH_LENGTH) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      api
        .search(orgSlug, query.trim())
        .then((res) => !cancelled && setResults(res.results))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orgSlug, query]);

  async function selectResult(result: SearchResult) {
    await addItem(result.type === "SCAN" ? "RADIOLOGY_EXAM" : "LAB_TEST", result.id);
    setQuery("");
    setResults([]);
    navigate(cartScreenFor(useWidgetStore.getState().cart?.cartType ?? null));
  }

  return (
    <div>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for scans, tests or health checkups…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
        />
        {searching ? (
          <span className="absolute right-3 top-3 text-xs text-slate-400">…</span>
        ) : null}
      </div>

      {results.length > 0 ? (
        <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
          {results.map((result) => (
            <li key={`${result.type}-${result.id}`}>
              <button
                onClick={() => void selectResult(result)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                <span className="min-w-0 truncate">{result.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      result.type === "SCAN"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {result.type === "SCAN" ? "Scan" : "Test"}
                  </span>
                  <span className="text-slate-500">₹{result.price}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim().length >= MIN_SEARCH_LENGTH && !searching ? (
        <p className="mt-2 text-sm text-slate-400">No matches yet — try browsing instead.</p>
      ) : null}

      {query.trim().length === 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULAR_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}

      {cart && cart.items.length > 0 ? (
        <p className="mt-3 text-xs text-slate-400">{cart.items.length} item(s) in your cart</p>
      ) : null}
    </div>
  );
}
