// app/services/eventsService.ts

import { supabase } from "./supabaseClient";

export interface LocalEvent {
  id: string;
  name: string;
  category: "festival" | "sports" | "concert" | "market";
  lat: number;
  lng: number;
  starts_at: string;
  ends_at: string;
  expected_attendance: number;
  distance_meters?: number;
}

export async function fetchNearbyEvents(lat: number, lng: number): Promise<LocalEvent[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("local_events")
    .select("*")
    .lte("starts_at", now)
    .gte("ends_at", now);

  return (data ?? [])
    .map(e => {
      const dlat = (e.lat - lat) * 111000;
      const dlng = (e.lng - lng) * 111000 * Math.cos(lat * Math.PI / 180);
      return { ...e, distance_meters: Math.round(Math.sqrt(dlat*dlat + dlng*dlng)) };
    })
    .filter(e => e.distance_meters < 1000)
    .sort((a, b) => (a.distance_meters ?? 0) - (b.distance_meters ?? 0));
}

// Add events to context state and intent signal
export function eventsToTags(events: LocalEvent[]): string[] {
  return events.map(e => `event_${e.category}_nearby`);
}