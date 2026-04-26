import {
  generateOfferFromOllama,
  generateFallbackOffer,
  buildIntentSignal,
} from "../services/ollamaService";
import {
  fetchDemoContext,
  evaluateTrigger,
} from "../services/contextService";

export async function testFullPipeline() {
  console.log("=== FULL PIPELINE TEST ===");

  const ctx = await fetchDemoContext();
  console.log(
    "✅ Context:", 
    ctx.weather.condition, 
    ctx.weather.temp + "°C", 
    "Payone:", ctx.payoneSignal + "%"
  );

  console.log("✅ Nearby merchants found:", ctx.nearbyMerchants.length);
  if (!ctx.nearbyMerchants.length) {
    console.error("❌ No merchants found — please check Supabase seeding");
    return;
  }

  const merchant = ctx.nearbyMerchants[0];
  const rule = merchant.merchant_rules?.[0];
  const trigger = evaluateTrigger(ctx, rule);
  console.log(
    "✅ Trigger status:", 
    trigger.triggered ? "YES" : "NO", 
    trigger.signals
  );

  const signal = buildIntentSignal(ctx, merchant, rule);
  console.log("✅ Signal sent to Ollama:", JSON.stringify(signal));

  console.log("⏳ Generation in progress...");
  try {
    const offer = await generateOfferFromOllama(signal);
    console.log("✅ Offer generated:");
    console.log("  Headline:", offer.headline);
    console.log("  Discount:", offer.discount_pct + "%");
    console.log("  Mood:", offer.visual_mood);
    console.log("  CTA:", offer.cta_label);
  } catch (e) {
    console.error("❌ Ollama failed:", e);
    const fallback = generateFallbackOffer(signal);
    console.log("✅ Fallback activated:", fallback.headline);
  }
}