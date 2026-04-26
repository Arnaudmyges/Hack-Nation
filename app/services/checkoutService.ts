import { supabase } from "./supabaseClient";

export interface RedemptionToken {
  id: string;
  token: string;
  qr_data: string;
  offer_id: string;
  status: string;
}

// ── Accepter une offre → générer un token QR ──
export async function acceptOffer(
  offerId: string,
  discountPct: number,
  merchantName: string
): Promise<RedemptionToken> {
  // Générer un token unique
  const token = generateToken();

  const qrData = JSON.stringify({
    token,
    offerId,
    discountPct,
    merchantName,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    v: 1,
  });

  // Sauvegarder dans Supabase
  const { data, error } = await supabase
    .from("redemptions")
    .insert({
      offer_id: offerId,
      token,
      qr_data: qrData,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`Erreur création token: ${error.message}`);

  // Mettre à jour le statut de l'offre
  await supabase
    .from("offers")
    .update({ status: "accepted" })
    .eq("id", offerId);

  console.log("✅ Token généré:", token);
  return data as RedemptionToken;
}

// ── Valider un token (côté marchand) ──
export async function validateToken(token: string) {
  // Step 1: find the redemption row
  const { data: redemption, error: rErr } = await supabase
    .from("redemptions")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (rErr || !redemption) {
    console.warn("validateToken: redemption not found", rErr?.message);
    return { valid: false, reason: "Token introuvable" };
  }

  if (redemption.status === "redeemed") {
    return { valid: false, reason: "Token déjà utilisé" };
  }

  // Check expiry from embedded QR data (no extra DB call needed)
  try {
    const qrParsed = JSON.parse(redemption.qr_data);
    if (qrParsed.expiresAt && new Date(qrParsed.expiresAt) < new Date()) {
      return { valid: false, reason: "Offre expirée" };
    }
  } catch {}

  // Step 2: fetch offer details (avoid nested FK join which requires specific Supabase config)
  const { data: offer } = await supabase
    .from("offers")
    .select("discount_pct, headline, merchant_id")
    .eq("id", redemption.offer_id)
    .maybeSingle();

  // Step 3: fetch merchant name
  let merchantName: string | undefined;
  if (offer?.merchant_id) {
    const { data: merchant } = await supabase
      .from("merchants")
      .select("name")
      .eq("id", offer.merchant_id)
      .maybeSingle();
    merchantName = merchant?.name;
  }

  // Mark as redeemed
  await supabase
    .from("redemptions")
    .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
    .eq("token", token);

  await supabase
    .from("offers")
    .update({ status: "redeemed" })
    .eq("id", redemption.offer_id);

  return {
    valid: true,
    discount_pct: offer?.discount_pct,
    merchant_name: merchantName,
    headline: offer?.headline,
  };
}

// ── Générateur de token simple ──
function generateToken(): string {
  return "cw_" + Math.random().toString(36).slice(2, 11).toUpperCase();
  // Exemple : cw_X4K9ZM2QR
}