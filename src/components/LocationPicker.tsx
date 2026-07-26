"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { defaultMarkerIcon } from "./leaflet-icon";

type LatLng = { lat: number; lng: number };

type SearchResult = { label: string; lat: number; lng: number };

const DEFAULT_CENTER: LatLng = { lat: 39.5, lng: -98.35 };

async function searchPlaces(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, format: "json", limit: "5" });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}

function ClickHandler({ onSelect }: { onSelect: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 13);
  }, [target, map]);
  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
}) {
  const initialCenter = useRef(value ?? DEFAULT_CENTER).current;
  const initialZoom = value ? 11 : 4;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const found = await searchPlaces(query.trim());
      setResults(found);
      if (found.length === 0) setSearchError("No matches found");
    } catch {
      setSearchError("Search failed, try again");
    } finally {
      setSearching(false);
    }
  }

  function handleSelectResult(result: SearchResult) {
    const pos = { lat: result.lat, lng: result.lng };
    onChange(pos);
    setFlyTarget(pos);
    setResults([]);
    setQuery(result.label);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="Search for a lake or place…"
          className="flex-1 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-zinc-50 dark:focus:border-white/30"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={searching}
          className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[.06]"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{searchError}</p>
      )}

      {results.length > 0 && (
        <ul className="flex flex-col divide-y divide-black/10 overflow-hidden rounded-md border border-black/10 dark:divide-white/10 dark:border-white/10">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelectResult(r)}
                className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06]"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-md border border-black/10 dark:border-white/10">
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ height: 220, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onSelect={onChange} />
          <FlyTo target={flyTarget} />
          {value && <Marker position={value} icon={defaultMarkerIcon} />}
        </MapContainer>
      </div>
    </div>
  );
}
