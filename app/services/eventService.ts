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

const EVENTBRITE_TOKEN = "ATTUBELJCXCIG7GWBC43";

// Static fallback — used when Eventbrite is slow, offline, or returns no results
const FALLBACK_EVENTS: LocalEvent[] = [
  {
    id: "e-fallback-1",
    name: "Stuttgart Spring Festival",
    category: "festival",
    lat: 48.782,
    lng: 9.177,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    expected_attendance: 500,
  },
  {
    id: "e-fallback-2",
    name: "Jazz Open Stuttgart",
    category: "concert",
    lat: 48.775,
    lng: 9.182,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    expected_attendance: 300,
  },
];

export async function fetchNearbyEvents(lat: number, lng: number): Promise<LocalEvent[]> {
  // Hard 5-second timeout — Eventbrite is optional context enrichment, never a blocker
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/destination/events/?location.address=stuttgart&expand=venue`,
      {
        headers: { Authorization: `Bearer ${EVENTBRITE_TOKEN}` },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return FALLBACK_EVENTS;

    const data = await response.json();
    const rawEvents = data.events || data.destination_events || [];
    if (!rawEvents.length) return FALLBACK_EVENTS;

    return rawEvents.map((event: any) => ({
      id: event.id,
      name: event.name?.text || "Event",
      category: mapEventbriteCategory(event.category_id),
      lat: parseFloat(event.venue?.latitude || "0"),
      lng: parseFloat(event.venue?.longitude || "0"),
      starts_at: event.start?.local,
      ends_at: event.end?.local,
      expected_attendance: 500,
    }));
  } catch {
    clearTimeout(timeoutId);
    return FALLBACK_EVENTS;
  }
}

function mapEventbriteCategory(id: string): string {
  const mapping: Record<string, string> = {
    "103": "festival",
    "108": "sports",
    "110": "market",
    "101": "concert",
  };
  return mapping[id] || "festival";
}

export function eventsToTags(events: LocalEvent[]): string[] {
  return events.map((e) => `event_${e.category}_nearby`);
}
