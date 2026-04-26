import { fetchNearbyEvents, LocalEvent } from "./eventService";
import { supabase } from "./supabaseClient";
import { CITY_CONFIG } from "../config/city";

export interface WeatherData {
  temp: number;
  condition: "cold" | "rain" | "overcast" | "sunny";
  description: string;
}

export interface ContextState {
  lat: number;
  lng: number;
  weather: WeatherData;
  hour: number;
  payoneSignal: number;
  nearbyMerchants: any[];
  nearbyEvents: LocalEvent[];
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.EXPO_PUBLIC_OWM_KEY}&units=metric&lang=fr`
  );
  const d = await res.json();
  return {
    temp: Math.round(d.main.temp),
    condition: classifyCondition(d.weather[0].id, d.main.temp),
    description: d.weather[0].description,
  };
}

function classifyCondition(id: number, temp: number): WeatherData["condition"] {
  if (id >= 200 && id < 600) return "rain";
  if (temp < 12) return "cold";
  if (id > 800) return "overcast";
  return "sunny";
}

export function simulatePayoneSignalForMerchant(
  merchantId: string,
  hour: number
): number {
  const patterns: Record<string, number[]> = {
    "cafe-muller": [30, 35, 45, 70, 85, 80, 65, 55, 75, 80, 85, 90, 85, 75, 22, 20, 18, 25, 45, 55, 50, 40, 35, 30],
    "bakery-schmidt": [10, 10, 15, 30, 60, 85, 90, 80, 65, 50, 45, 40, 35, 25, 20, 18, 15, 20, 25, 30, 25, 20, 15, 10],
    "weinhandel-fischer": [5, 5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 45, 35, 40, 55, 70, 85, 90, 80, 60, 40, 15],
  };

  const key = merchantId.toLowerCase().replace(/\s+/g, "-");
  const pattern = patterns[key] ?? patterns["cafe-muller"];
  const base = pattern[hour] ?? 50;

  const variance = (Math.random() - 0.5) * 20;
  return Math.max(5, Math.min(100, Math.round(base + variance)));
}

export async function fetchNearbyMerchants(lat: number, lng: number) {
  const { data, error } = await supabase
    .from("merchants")
    .select("*, merchant_rules(*)");

  if (error || !data) return [];

  return data.filter((m) => {
    const dlat = (m.lat - lat) * 111000;
    const dlng = (m.lng - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
    return Math.sqrt(dlat * dlat + dlng * dlng) < 300;
  });
}

export async function fetchRealContext(): Promise<ContextState> {
  const lat = CITY_CONFIG.lat;
  const lng = CITY_CONFIG.lng;

  const [weather, merchants, nearbyEvents] = await Promise.all([
    fetchWeather(lat, lng),
    fetchNearbyMerchants(lat, lng),
    fetchNearbyEvents(lat, lng),
  ]);

  const hour = new Date().getHours();

  return {
    lat,
    lng,
    weather,
    hour,
    payoneSignal: merchants.length > 0
      ? Math.round(
          merchants.reduce((sum, m) =>
            sum + simulatePayoneSignalForMerchant(m.name, hour), 0
          ) / merchants.length
        )
      : simulatePayoneSignalForMerchant("cafe-muller", hour),
    nearbyMerchants: merchants.map((m) => ({
      ...m,
      payoneSignal: simulatePayoneSignalForMerchant(m.name, hour),
    })),
    nearbyEvents,
  };
}

export async function fetchDemoContext(): Promise<ContextState> {
  const lat = CITY_CONFIG.lat;
  const lng = CITY_CONFIG.lng;
  const merchants = await fetchNearbyMerchants(lat, lng);
  const nearbyEvents = await fetchNearbyEvents(lat, lng);

  return {
    lat,
    lng,
    weather: { temp: 9, condition: "cold", description: "Cold and overcast" },
    hour: 14,
    payoneSignal: 22,
    nearbyMerchants: merchants,
    nearbyEvents,
  };
}

export function evaluateTrigger(ctx: ContextState, rule: any) {
  const hits: string[] = [];

  if (rule.trigger_weather?.includes(ctx.weather.condition))
    hits.push(`${ctx.weather.condition} (${ctx.weather.temp}°C)`);

  if (ctx.payoneSignal < (rule.trigger_payone_threshold ?? 35))
    hits.push(`trafic bas (${ctx.payoneSignal}%)`);

  const hs = parseInt((rule.trigger_time_start ?? "00:00").split(":")[0]);
  const he = parseInt((rule.trigger_time_end ?? "23:00").split(":")[0]);
  if (ctx.hour >= hs && ctx.hour <= he)
    hits.push(`heure creuse (${ctx.hour}h)`);

  return { triggered: hits.length >= 2, signals: hits };
}