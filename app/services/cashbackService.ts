import { supabase } from "./supabaseClient";

export async function creditCashback(
  userId: string,
  redemptionId: string | null, // null for test
  discountPct: number,
  basePrice = 8.50
): Promise<number> {
  const amount = parseFloat((basePrice * discountPct / 100).toFixed(2));
  const { error: txError } = await supabase.from("cashback_transactions").insert({
    user_id: userId,
    ...(redemptionId && { redemption_id: redemptionId }),
    amount,
    type: "credit",
  });

  if (txError) {
    console.error("Erreur insertion cashback_transactions:", txError.message);
    throw txError;
  }

  const { data: profile, error: profError } = await supabase
    .from("profiles").select("cashback_balance").eq("id", userId).single();

  if (profError) console.error("Erreur profil:", profError.message);

  const newBalance = (profile?.cashback_balance ?? 0) + amount;
  
  await supabase.from("profiles").update({ 
    cashback_balance: newBalance 
  }).eq("id", userId);

  return newBalance;
}

export async function useCashback(
  userId: string,
  redemptionId: string,
  amount: number
): Promise<number> {
  await supabase.from("cashback_transactions").insert({
    user_id: userId,
    redemption_id: redemptionId,
    amount: -amount,
    type: "used",
  });

  const { data: profile } = await supabase
    .from("profiles").select("cashback_balance").eq("id", userId).single();

  const newBalance = Math.max(0, (profile?.cashback_balance ?? 0) - amount);
  await supabase.from("profiles").update({ cashback_balance: newBalance }).eq("id", userId);

  return newBalance;
}