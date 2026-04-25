import { supabase } from "./supabaseClient";

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
}

// ─── Météo réelle ────────────────────────────────────────────
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

// ─── Signal Payone simulé ────────────────────────────────────
export function simulatePayoneSignal(hour: number): number {
  if (hour >= 14 && hour <= 17) return 22;
  if (hour >= 11 && hour <= 13) return 85;
  return 55;
}

// ─── Marchands dans rayon 300m ───────────────────────────────
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

// ─── Contexte réel ───────────────────────────────────────────
export async function fetchRealContext(): Promise<ContextState> {
  // Position fixe Stuttgart pour la démo web (expo-location limité sur navigateur)
  const lat = 48.7758;
  const lng = 9.1829;

  const [weather, merchants] = await Promise.all([
    fetchWeather(lat, lng),
    fetchNearbyMerchants(lat, lng),
  ]);

  return {
    lat, lng,
    weather,
    hour: new Date().getHours(),
    payoneSignal: simulatePayoneSignal(new Date().getHours()),
    nearbyMerchants: merchants,
  };
}

// ─── Contexte forcé pour la démo ─────────────────────────────
export async function fetchDemoContext(): Promise<ContextState> {
  const merchants = await fetchNearbyMerchants(48.7758, 9.1829);
  return {
    lat: 48.7758, lng: 9.1829,
    weather: { temp: 9, condition: "cold", description: "Couvert et froid" },
    hour: 14,
    payoneSignal: 22,
    nearbyMerchants: merchants,
  };
}

// ─── Évaluation du déclenchement ─────────────────────────────
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