import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useOfferPipeline } from "../hooks/useOfferPipeline";
import { OfferCard } from "../components/OfferCard";

export default function HomeScreen({ navigation }: any) {
  const { phase, offer, contextState, signals, error, trigger, reset } =
    useOfferPipeline();
  console.log("Phase actuelle:", phase);
  console.log("Offre:", offer?.headline ?? "—");
  const handleAccept = () => {
    if (!offer) return;
    navigation.navigate("Wallet", { offer });
    reset();
  };

  const handleDecline = () => {
    reset();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Context Panel ── */}
      <View
        style={{
          margin: 16,
          padding: 16,
          backgroundColor: "#F1EFE8",
          borderRadius: 14,
        }}
      >
        <Text style={{ fontWeight: "600", marginBottom: 10, fontSize: 13, color: "#2C2C2A" }}>
          Signaux de contexte
        </Text>

        {contextState ? (
          <>
            <Text style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 4 }}>
              🌡 {contextState.weather.temp}°C · {contextState.weather.description}
            </Text>
            <Text style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 4 }}>
              📍 Stuttgart · {contextState.nearbyMerchants[0]?.name ?? "—"}
            </Text>
            <Text style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 4 }}>
              📊 Payone : {contextState.payoneSignal}%
              {contextState.payoneSignal < 35 ? " (bas ↓)" : " (normal)"}
            </Text>
            <Text style={{ fontSize: 12, color: "#5F5E5A" }}>
              ⏰ {contextState.hour}h · Stuttgart
            </Text>
            {signals.length > 0 && (
              <View
                style={{
                  marginTop: 10,
                  padding: 8,
                  backgroundColor: "#E8F5E9",
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, color: "#2E7D32", fontWeight: "600" }}>
                  ⚡ {signals.length} signal{signals.length > 1 ? "s" : ""} détecté{signals.length > 1 ? "s" : ""}
                </Text>
                {signals.map((s, i) => (
                  <Text key={i} style={{ fontSize: 11, color: "#2E7D32" }}>
                    · {s}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={{ fontSize: 12, color: "#B4B2A9", marginBottom: 4 }}>
              🌡 — · En attente
            </Text>
            <Text style={{ fontSize: 12, color: "#B4B2A9", marginBottom: 4 }}>
              📍 — · Aucune position
            </Text>
            <Text style={{ fontSize: 12, color: "#B4B2A9", marginBottom: 4 }}>
              📊 Payone : —
            </Text>
            <Text style={{ fontSize: 12, color: "#B4B2A9" }}>
              ⏰ — · —
            </Text>
          </>
        )}
      </View>

      {/* ── Phase : sensing ── */}
      {phase === "sensing" && (
        <View
          style={{
            marginHorizontal: 16,
            padding: 14,
            backgroundColor: "#E3F2FD",
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ActivityIndicator color="#1565C0" />
          <Text style={{ color: "#1565C0", fontWeight: "600", fontSize: 13 }}>
            Analyse du contexte...
          </Text>
        </View>
      )}

      {/* ── Phase : generating ── */}
      {phase === "generating" && (
        <View
          style={{
            marginHorizontal: 16,
            padding: 14,
            backgroundColor: "#FFF3E0",
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ActivityIndicator color="#E65100" />
          <View>
            <Text style={{ color: "#E65100", fontWeight: "600", fontSize: 13 }}>
              Génération Ollama locale...
            </Text>
            <Text style={{ color: "#E65100", fontSize: 11, opacity: 0.7 }}>
              Phi-3 mini · aucune donnée envoyée au cloud
            </Text>
          </View>
        </View>
      )}

      {/* ── Phase : error ── */}
      {phase === "error" && (
        <View
          style={{
            marginHorizontal: 16,
            padding: 14,
            backgroundColor: "#FFEBEE",
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#C62828", fontWeight: "600", fontSize: 13 }}>
            ⚠ Erreur : {error}
          </Text>
          <TouchableOpacity onPress={reset} style={{ marginTop: 8 }}>
            <Text style={{ color: "#C62828", fontSize: 12, textDecorationLine: "underline" }}>
              Réessayer
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Offer Card ── */}
      {phase === "ready" && offer && (
        <View style={{ marginTop: 8 }}>
          <OfferCard
            offer={offer}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </View>
      )}

      {/* ── Bouton démo ── */}
      {phase === "idle" && (
        <TouchableOpacity
          onPress={() => trigger(true)}
          style={{
            margin: 16,
            marginTop: 8,
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

      {/* ── Navigation ── */}
      <View style={{ flexDirection: "row", gap: 8, margin: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("MerchantDashboard")}
          style={{
            flex: 1, padding: 12,
            backgroundColor: "#E8F5E9",
            borderRadius: 10, alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: "#2E7D32", fontWeight: "600" }}>
            📊 Dashboard Karl
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("MerchantScan")}
          style={{
            flex: 1, padding: 12,
            backgroundColor: "#FFF3E0",
            borderRadius: 10, alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: "#E65100", fontWeight: "600" }}>
            📷 Terminal scan
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}