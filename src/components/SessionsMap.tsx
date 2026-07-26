"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { PaddleSession } from "@/lib/types";
import { defaultMarkerIcon } from "./leaflet-icon";

const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 };

export default function SessionsMap({ sessions }: { sessions: PaddleSession[] }) {
  const located = sessions.filter(
    (s): s is PaddleSession & { lat: number; lng: number } =>
      s.lat != null && s.lng != null
  );

  const center = located.length > 0 ? located[0] : DEFAULT_CENTER;
  const zoom = located.length > 0 ? 5 : 4;

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
      <MapContainer center={center} zoom={zoom} style={{ height: 320, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((s) => (
          <Marker key={s.id} position={{ lat: s.lat, lng: s.lng }} icon={defaultMarkerIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{s.lakeName}</div>
                <div className="text-zinc-500">{s.date}</div>
                {s.notes && <div className="mt-1">{s.notes}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
