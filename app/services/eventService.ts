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

export async function fetchNearbyEvents(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/destination/events/?location.address=stuttgart&expand=venue`,
      {
        headers: { 'Authorization': `Bearer ${EVENTBRITE_TOKEN}` }
      }
    );

    const data = await response.json();

    const rawEvents = data.events || data.destination_events || [];

    return rawEvents.map((event: any) => ({
      id: event.id,
      name: event.name?.text || "Event",
      category: mapEventbriteCategory(event.category_id), 
      lat: parseFloat(event.venue?.latitude || "0"),
      lng: parseFloat(event.venue?.longitude || "0"),
      starts_at: event.start?.local,
      ends_at: event.end?.local,
      expected_attendance: 500, // Eventbrite donne rarement ce chiffre, on met un défaut pour l'IA
    }));
  } catch (error) {
    console.error("Erreur Eventbrite:", error);
    return [];
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
  return events.map(e => `event_${e.category}_nearby`);
}