import { supabase } from "../services/supabaseClient";
import { fetchWeather, simulatePayoneSignal } from "../services/contextService";

export async function testSupabase() {
  console.log("=== TEST SUPABASE ===");

  // Test 1 : connexion + lecture marchands
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

  // Coordonnées Stuttgart
  const weather = await fetchWeather(48.7758, 9.1829);
  console.log("✅ Météo Stuttgart:", weather);
  // Attendu : { temp: X, condition: "cold"|"rain"|..., description: "..." }

  // Test signal Payone simulé sur différentes heures
  console.log("=== TEST PAYONE ===");
  [9, 12, 14, 16, 20].forEach(h => {
    console.log(`  H=${h}h → Payone: ${simulatePayoneSignal(h)}%`);
  });
  // Attendu :
  // H=9h  → Payone: 55%
  // H=12h → Payone: 85%
  // H=14h → Payone: 22%  ← déclenche
  // H=16h → Payone: 22%  ← déclenche
  // H=20h → Payone: 55%
}
