const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "phi3:mini";

export interface IntentSignal {
  context_tags: string[];
  merchant_category: string;
  merchant_name: string;
  max_discount_pct: number;
  distance_meters: number;
  language: "en";
}

export interface GeneratedOffer {
  headline: string;
  sub_text: string;
  discount_pct: number;
  visual_mood: "warm_amber" | "cool_blue" | "fresh_green" | "urgent_red";
  cta_label: string;
  expiry_minutes: number;
}

const SYSTEM_PROMPT = `You are a flash offer generator for local merchants.
Respond ONLY with valid JSON, without any text before or after, and without markdown tags.
Strict format:
{"headline":"...","sub_text":"...","discount_pct":15,"visual_mood":"warm_amber","cta_label":"...","expiry_minutes":15}
Absolute rules:
- headline: max 7 words, emotional, contextual (use weather/time context)
- sub_text: max 10 words, precise about the discount
- discount_pct: integer, never exceed max_discount_pct
- visual_mood: warm_amber (coffee/warm), cool_blue (cold/fresh), fresh_green (bakery/organic), urgent_red (urgent/limited)
- cta_label: 2-4 words, incentive-based
- expiry_minutes: between 10 and 20`;

function buildPrompt(signal: IntentSignal): string {
  return `Generate a flash offer:
- Context: ${signal.context_tags.join(", ")}
- Merchant: ${signal.merchant_name} (${signal.merchant_category})
- Distance: ${signal.distance_meters}m
- Max allowed discount: ${signal.max_discount_pct}%
- Language: ${signal.language}`;
}
function extractJSON(text: string) {
  try {
    let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    if (cleanText.startsWith("{") && !cleanText.endsWith("}")) {
      console.warn("⚠️ JSON tronqué détecté, tentative de réparation...");
      
      const quoteCount = (cleanText.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        cleanText += '"';
      }
      cleanText += "}";
    }

    return JSON.parse(cleanText);
  } catch (e) {
    console.error("❌ Échec critique du parsing JSON:", text);
    throw new Error("Invalid JSON structure from Ollama");
  }
}
export async function generateOfferFromOllama(
  signal: IntentSignal
): Promise<GeneratedOffer> {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "phi3:mini",
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(signal),
      stream: false,
      format: "json",
      options: { temperature: 0.7, num_predict: 200 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

  const data = await res.json();
  
  const parsed = extractJSON(data.response) as GeneratedOffer;
  if (!parsed.headline || typeof parsed.discount_pct !== "number") {
    throw new Error("JSON incomplete from Phi-3");
  }
  
  parsed.discount_pct = Math.min(parsed.discount_pct, signal.max_discount_pct);
  return parsed;
}

export function generateFallbackOffer(signal: IntentSignal): GeneratedOffer {
  const fallbacks: Record<string, GeneratedOffer> = {
    cafe: {
      headline: "Cold outside? Come warm up.",
      sub_text: `${Math.min(signal.max_discount_pct, 15)}% off all hot drinks`,
      discount_pct: Math.min(signal.max_discount_pct, 15),
      visual_mood: "warm_amber",
      cta_label: "I want this",
      expiry_minutes: 15,
    },
    bakery: {
      headline: "Fresh pastries right here.",
      sub_text: `10% off for the next 20 minutes`,
      discount_pct: 10,
      visual_mood: "fresh_green",
      cta_label: "Get it now",
      expiry_minutes: 20,
    },
    retail: {
      headline: "Special offer, limited time.",
      sub_text: `${signal.max_discount_pct}% off your next purchase`,
      discount_pct: signal.max_discount_pct,
      visual_mood: "urgent_red",
      cta_label: "Redeem now",
      expiry_minutes: 12,
    },
  };
  return fallbacks[signal.merchant_category] ?? fallbacks.retail;
}

export function buildIntentSignal(
  ctx: any,
  merchant: any,
  rule: any
): IntentSignal {
  const tags: string[] = [];
  if (ctx.weather.condition === "cold" || ctx.weather.condition === "rain")
    tags.push(ctx.weather.condition);
  
  if (ctx.trafficSignal < 35) tags.push("off_peak");
  if (ctx.hour >= 11 && ctx.hour <= 14) tags.push("lunch_time");
  if (ctx.hour >= 14 && ctx.hour <= 17) tags.push("afternoon");
  
  tags.push(`${ctx.weather.temp}°C`);

  const dlat = (merchant.lat - ctx.lat) * 111000;
  const dlng = (merchant.lng - ctx.lng) * 111000 * Math.cos(ctx.lat * Math.PI / 180);
  const distance = Math.round(Math.sqrt(dlat * dlat + dlng * dlng));

  return {
    context_tags: tags,
    merchant_category: merchant.category,
    merchant_name: merchant.name,
    max_discount_pct: rule.max_discount_pct,
    distance_meters: distance,
    language: "en",
  };
}