import { generateOfferFromOllama, buildIntentSignal, generateFallbackOffer } from "../services/ollamaService";

export async function testOllamaParsing() {
  console.log("=== OLLAMA TEST — 5 generations ===");

  const signal = {
    context_tags: ["cold", "off_peak", "9°C"],
    merchant_category: "cafe",
    merchant_name: "Café Müller",
    max_discount_pct: 20,
    distance_meters: 83,
    language: "en" as const,
  };

  let successes = 0;

  for (let i = 1; i <= 5; i++) {
    try {
      const offer = await generateOfferFromOllama(signal);

      const valid =
        typeof offer.headline === "string" &&
        typeof offer.discount_pct === "number" &&
        offer.discount_pct <= signal.max_discount_pct &&
        ["warm_amber", "cool_blue", "fresh_green", "urgent_red"].includes(offer.visual_mood);

      if (valid) {
        successes++;
        console.log(`✅ Test ${i}: "${offer.headline}" (-${offer.discount_pct}%)`);
      } else {
        console.warn(`⚠️ Test ${i}: JSON received but fields are invalid`, offer);
      }
    } catch (e) {
      console.error(`❌ Test ${i}: JSON parsing error —`, e);
    }
  }

  console.log(`\nResult: ${successes}/5 successes`);
  if (successes < 4) {
    console.warn("⚠️ Success rate too low — rework the prompt before R2");
  } else {
    console.log("✅ Prompt validated for R2");
  }
}

export function testFallback() {
  console.log("=== FALLBACK TEST ===");
  const signal = {
    context_tags: ["cold"],
    merchant_category: "cafe",
    merchant_name: "Café Müller",
    max_discount_pct: 20,
    distance_meters: 83,
    language: "en" as const,
  };

  const offer = generateFallbackOffer(signal);
  console.log("✅ Fallback generated:", offer.headline, `(-${offer.discount_pct}%)`);
}