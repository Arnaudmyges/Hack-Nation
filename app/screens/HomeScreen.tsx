import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useOfferPipeline } from "../hooks/useOfferPipeline";
import { OfferCard } from "../components/OfferCard";
import { testSupabase, testWeather } from "../tests/testSupabase";
import { testOllamaParsing, testFallback } from "../tests/testOllama";
import { testFullPipeline } from "../tests/testPipeline";
import { useGeofencing } from "../hooks/useGeofencing";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function HomeScreen({ navigation }: any) {
  const { phase, offer, contextState, signals, error, trigger, reset } =
    useOfferPipeline();
  console.log("Phase actuelle:", phase);
  console.log("Offre:", offer?.headline ?? "—");
  const handleAccept = async () => {
  if (!offer || !offer.id) return;

  const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('offers')
        .update({ 
          status: 'accepted',
          user_id: session.user.id 
        })
        .eq('id', offer.id);
    }
    navigation.navigate("Wallet", { offer });
    reset();
  };
  
  const { startGeofencing } = useGeofencing((merchant) => {
    if (phase === "idle") trigger(false);
  });
  
  useEffect(() => {
    startGeofencing();
  }, []);

  const handleDecline = async () => {
    if (offer && offer.id) {
      const { data: { session } } = await supabase.auth.getSession();
    
      if (session?.user) {
        console.log("Enregistrement du refus pour l'offre:", offer.id);
        
        const { error } = await supabase
          .from('offers')
          .update({ 
            status: 'declined',
            user_id: session.user.id
          })
          .eq('id', offer.id);

        if (error) console.error("Erreur lors du déclin:", error);
      }
    }
    reset();
  };
  const [userName, setUserName] = useState("Chargement...");

useEffect(() => {
  async function getUserProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .single();
      if (data?.display_name) setUserName(data.display_name);
    }
  }
  getUserProfile();

  const unsubscribe = navigation.addListener('focus', () => {
    getUserProfile();
  });
    return unsubscribe;
  }, [navigation]);
  return (
    <ScrollView style={{ flex: 1 }}>
      {/* CUSTOM HEADER */}
      <View style={styles.topHeader}>
        <Text style={styles.appName}>User</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Account')}
          style={styles.profileButton}
        >
          <Text style={styles.profileName}>{userName} 👤</Text>
        </TouchableOpacity>
      </View>
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
            {contextState.nearbyEvents?.length > 0 && (
              <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: "#E0DDD5", paddingTop: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#7F77DD", marginBottom: 4 }}>
                  ÉVÉNEMENTS EVENTBRITE PROCHES :
                </Text>
                {contextState.nearbyEvents.map((ev, idx) => (
                  <View key={ev.id || idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: "#5F5E5A" }}>
                      🎉 {ev.name} 
                    </Text>
                    <View style={{ 
                      marginLeft: 6, 
                      paddingHorizontal: 4, 
                      backgroundColor: '#7F77DD22', 
                      borderRadius: 4 
                    }}>
                      <Text style={{ fontSize: 10, color: '#7F77DD' }}>{ev.category}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
        <View style={{ margin: 16, gap: 10 }}>
          {/* Main demo button */}
          <TouchableOpacity
            onPress={() => trigger(true)}
            style={{
              backgroundColor: "#E65100",
              borderRadius: 14, paddingVertical: 16,
              alignItems: "center",
              shadowColor: "#E65100",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
              🎬 Simulate User's arrival
            </Text>
            <Text style={{ color: "#fff", fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              Cold · Café Müller 83m · Payone 22%
            </Text>
          </TouchableOpacity>

          {/* Secondary: real context */}
          <TouchableOpacity
            onPress={() => trigger(false)}
            style={{
              backgroundColor: "#F1EFE8",
              borderRadius: 14, paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#5F5E5A", fontWeight: "600", fontSize: 13 }}>
              📡 Use real context (live weather)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Navigation ── */}
      <View style={{ margin: 16, gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("MerchantDashboard")}
            style={{
              flex: 1, padding: 14,
              backgroundColor: "#E8F5E9",
              borderRadius: 12, alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 2 }}>📊</Text>
            <Text style={{ fontSize: 12, color: "#2E7D32", fontWeight: "600" }}>
              Merchant's Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("MerchantScan")}
            style={{
              flex: 1, padding: 14,
              backgroundColor: "#FFF3E0",
              borderRadius: 12, alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 2 }}>📷</Text>
            <Text style={{ fontSize: 12, color: "#E65100", fontWeight: "600" }}>
              Merchant Terminal
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("MerchantRule")}
          style={{
            padding: 14,
            backgroundColor: "#F1EFE8",
            borderRadius: 12, alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: "#5F5E5A", fontWeight: "600" }}>
            ⚙️ Merchant rule config
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2C2C2A",
  },
  profileButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#E8E4DD",
    borderRadius: 12,
  },
  profileName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C2C2A",
  },
});

