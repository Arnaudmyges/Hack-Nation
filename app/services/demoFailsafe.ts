import { FullOffer } from "../hooks/useOfferPipeline";

export const DEMO_FAILSAFE_OFFER: FullOffer = {
  headline: "Cold outside? Step in.",
  sub_text: "−15% on all hot drinks right now",
  discount_pct: 15,
  visual_mood: "warm_amber",
  cta_label: "I want this",
  expiry_minutes: 15,
  id: "demo-failsafe-001",
  merchant_name: "Café Müller",
  distance_meters: 83,
  merchant_id: "demo-merchant-001",
};

export const DEMO_FAILSAFE_TOKEN = {
  id: "failsafe-token-001",
  token: "cw_DEMO12345",
  qr_data: JSON.stringify({
    token: "cw_DEMO12345",
    offerId: "demo-failsafe-001",
    discountPct: 15,
    merchantName: "Café Müller",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    v: 1,
  }),
  offer_id: "demo-failsafe-001",
  status: "pending",
};

export function activateFailsafe(
  setOffer: (o: FullOffer) => void,
  setPhase: (p: any) => void
) {
  console.warn("⚠️ DEMO FAILSAFE ACTIVATED");
  setOffer(DEMO_FAILSAFE_OFFER);
  setPhase("ready");
}