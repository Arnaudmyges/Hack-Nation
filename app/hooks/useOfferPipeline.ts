import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import {
  fetchDemoContext,
  fetchRealContext,
  evaluateTrigger,
  ContextState,
} from "../services/contextService";
import { activateFailsafe } from "../services/demoFailsafe";
import {
  buildIntentSignal,
  generateOfferFromOllama,
  generateFallbackOffer,
  GeneratedOffer,
} from "../services/ollamaService";
import { sendOfferNotification } from "../services/pushService";

export type PipelinePhase =
  | "idle"
  | "sensing"
  | "generating"
  | "ready"
  | "error";

export interface FullOffer extends GeneratedOffer {
  id?: string;
  merchant_name: string;
  distance_meters: number;
  merchant_id: string;
}

export function useOfferPipeline() {
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [offer, setOffer] = useState<FullOffer | null>(null);
  const [contextState, setContextState] = useState<ContextState | null>(null);
  const [signals, setSignals] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const trigger = async (useDemo = true) => {
    setPhase("sensing");
    setOffer(null);
    setError(null);

    try {
      const ctx = useDemo
        ? await fetchDemoContext()
        : await fetchRealContext();
      setContextState(ctx);

      if (!ctx.nearbyMerchants.length) {
        setError("Aucun marchand partenaire dans ce rayon.");
        setPhase("error");
        return;
      }

      let triggeredMerchant = null;
      let triggeredRule = null;
      let triggeredSignals: string[] = [];

      for (const merchant of (ctx.nearbyMerchants || [])) {
        
        const rules = Array.isArray(merchant.merchant_rules) 
          ? merchant.merchant_rules 
          : [];

        for (const rule of rules) {
          const result = evaluateTrigger(ctx, rule);
          
          if (result.triggered) {
            triggeredMerchant = merchant;
            triggeredRule = rule;
            triggeredSignals = result.signals;
            break;
          }
        }
        
        if (triggeredMerchant) break;
      }

      if (!triggeredMerchant) {
        triggeredMerchant = ctx.nearbyMerchants[0];
        triggeredRule = triggeredMerchant.merchant_rules?.[0] ?? {
          max_discount_pct: 15,
          trigger_weather: [],
          trigger_payone_threshold: 35,
          trigger_time_start: "00:00",
          trigger_time_end: "23:00",
        };
        triggeredSignals = ["démonstration forcée"];
      }

      setSignals(triggeredSignals);
      setPhase("generating");

      const signal = buildIntentSignal(ctx, triggeredMerchant, triggeredRule);

      let generated: GeneratedOffer;
      try {
        generated = await generateOfferFromOllama(signal);
      } catch (ollamaError) {
        console.warn("Ollama KO → fallback activé", ollamaError);
        generated = generateFallbackOffer(signal);
      }

      const dlat = (triggeredMerchant.lat - ctx.lat) * 111000;
      const dlng =
        (triggeredMerchant.lng - ctx.lng) *
        111000 *
        Math.cos((ctx.lat * Math.PI) / 180);
      const distance = Math.round(Math.sqrt(dlat * dlat + dlng * dlng));

      const { data: savedOffer } = await supabase
        .from("offers")
        .insert({
          merchant_id: triggeredMerchant.id,
          headline: generated.headline,
          sub_text: generated.sub_text,
          discount_pct: generated.discount_pct,
          visual_mood: generated.visual_mood,
          cta_label: generated.cta_label,
          expiry_minutes: generated.expiry_minutes,
          context_snapshot: {
            weather: ctx.weather,
            hour: ctx.hour,
            payone_signal: ctx.payoneSignal,
            signals: triggeredSignals,
          },
          expires_at: new Date(
            Date.now() + generated.expiry_minutes * 60 * 1000
          ).toISOString(),
          status: "active",
        })
        .select()
        .single();

      const fullOffer: FullOffer = {
        ...generated,
        id: savedOffer?.id,
        merchant_name: triggeredMerchant.name,
        distance_meters: distance,
        merchant_id: triggeredMerchant.id,
      };

      setOffer(fullOffer);
      setPhase("ready");

      try {
        await sendOfferNotification(fullOffer);
      } catch (pushError) {
        console.warn("Push non envoyée (normal sur web):", pushError);
      }

    } catch (err: any) {
        console.error("Pipeline error:", err);
        console.warn("Activating demo failsafe...");
        activateFailsafe(setOffer, setPhase);
      }
  };

  const reset = () => {
    setPhase("idle");
    setOffer(null);
    setContextState(null);
    setSignals([]);
    setError(null);
  };

  return {
    phase,
    offer,
    contextState,
    signals,
    error,
    trigger,
    reset,
  };
}