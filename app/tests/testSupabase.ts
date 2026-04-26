import { supabase } from "../services/supabaseClient";
import { fetchWeather, simulatePayoneSignalForMerchant } from "../services/contextService";

export async function testSupabase() {
  console.log("=== TEST SUPABASE ===");

  const { data, error } = await supabase
    .from("merchants")
    .select("*, merchant_rules(*)");

  if (error) {
    console.error("❌ Erreur Supabase:", error.message);
    return;
  }

  console.log(`✅ ${data.length} marchands trouvés`);
  data.forEach(m => {
    console.log(`  → ${m.name} (${m.category}) — ${m.merchant_rules.length} règle(s)`);
  });
}

export async function testWeather() {
  console.log("=== TEST MÉTÉO ===");

  const weather = await fetchWeather(48.7758, 9.1829);
  console.log("✅ Météo Stuttgart:", weather);

  console.log("=== TEST PAYONE ===");
  [9, 12, 14, 16, 20].forEach(h => {
  console.log(`  H=${h}h → Payone: ${simulatePayoneSignalForMerchant("cafe-muller", h)}%`);
});
}
