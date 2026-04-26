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
  const { data, error } = await supabase
    .from("redemptions")
    .select(`
      *,
      offers (
        id,
        headline,
        discount_pct,
        merchant_id
      )
    `)
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return { valid: false, reason: "Token introuvable" };
  if (data.status === "redeemed") return { valid: false, reason: "Token déjà utilisé" };

  // On récupère le nom du marchand via la table 'merchants' séparément pour éviter les erreurs de jointure complexe
  const { data: merchant } = await supabase
    .from('merchants')
    .select('name')
    .eq('id', data.offers.merchant_id)
    .maybeSingle();

  // Mise à jour des statuts
  await supabase.from("redemptions").update({ status: "redeemed", redeemed_at: new Date().toISOString() }).eq("token", token);
  await supabase.from("offers").update({ status: "redeemed" }).eq("id", data.offer_id);

  return {
    valid: true,
    discount_pct: data.offers?.discount_pct,
    merchant_name: merchant?.name || "Boutique",
    headline: data.offers?.headline,
  };
}

// ── Générateur de token simple ──
function generateToken(): string {
  return "cw_" + Math.random().toString(36).slice(2, 11).toUpperCase();
  // Exemple : cw_X4K9ZM2QR
}