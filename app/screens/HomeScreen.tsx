import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { OfferCard } from "../components/OfferCard";

// Offre factice pour tester le rendu — le vrai pipeline arrive en Sprint 3
const MOCK_OFFER = {
  headline: "Froid dehors ? Rentrez vite.",
  sub_text: "−15% sur toutes les boissons chaudes",
  discount_pct: 15,
  visual_mood: "warm_amber" as const,
  cta_label: "Je veux ça",
  expiry_minutes: 15,
  merchant_name: "Café Müller",
  distance_meters: 83,
};

export default function HomeScreen({ navigation }: any) {
  const [offer, setOffer] = useState<typeof MOCK_OFFER | null>(null);
  const [phase, setPhase] = useState<"idle" | "sensing" | "generating" | "ready">("idle");

  const simulateMia = async () => {
    setPhase("sensing");
    await new Promise((r) => setTimeout(r, 1200)); // simule la détection contexte
    setPhase("generating");
    await new Promise((r) => setTimeout(r, 2000)); // simule la génération Ollama
    setOffer(MOCK_OFFER);
    setPhase("ready");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
      {/* Context Panel */}
      <View style={{ margin: 16, padding: 16, backgroundColor: "#F1EFE8", borderRadius: 14 }}>
        <Text style={{ fontWeight: "600", marginBottom: 8, fontSize: 13 }}>
          Signaux de contexte
        </Text>
        <Text style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 4 }}>🌡 9°C · Couvert — Stuttgart</Text>
        <Text style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 4 }}>📍 Café Müller · 83m</Text>
        <Text style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 4 }}>📊 Payone : 22% (bas)</Text>
        <Text style={{ fontSize: 12, color: "#5F5E5A" }}>⏰ 14h12 · Mardi</Text>
      </View>

      {/* État du pipeline */}
      {phase !== "idle" && phase !== "ready" && (
        <View style={{ margin: 16, padding: 14, backgroundColor: "#E3F2FD", borderRadius: 12 }}>
          <Text style={{ color: "#1565C0", fontWeight: "600", fontSize: 13 }}>
            {phase === "sensing" && "🔍 Analyse du contexte..."}
            {phase === "generating" && "🤖 Génération Ollama locale..."}
          </Text>
        </View>
      )}

      {/* Offer Card */}
      {offer && phase === "ready" && (
        <View style={{ marginTop: 8 }}>
          <OfferCard
            offer={offer}
            onAccept={() => navigation.navigate("Wallet", { offer })}
            onDecline={() => { setOffer(null); setPhase("idle"); }}
          />
        </View>
      )}

      {/* Bouton démo */}
      {phase === "idle" && (
        <TouchableOpacity
          onPress={simulateMia}
          style={{
            margin: 16,
            marginTop: 24,
            backgroundColor: "#E65100",
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            🎬 Simuler arrivée de Mia
          </Text>
        </TouchableOpacity>
      )}

      {/* Liens navigation */}
      <View style={{ flexDirection: "row", gap: 8, margin: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("MerchantDashboard")}
          style={{ flex: 1, padding: 12, backgroundColor: "#E8F5E9", borderRadius: 10, alignItems: "center" }}
        >
          <Text style={{ fontSize: 12, color: "#2E7D32", fontWeight: "600" }}>Dashboard Karl</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("MerchantScan")}
          style={{ flex: 1, padding: 12, backgroundColor: "#FFF3E0", borderRadius: 10, alignItems: "center" }}
        >
          <Text style={{ fontSize: 12, color: "#E65100", fontWeight: "600" }}>Terminal scan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}