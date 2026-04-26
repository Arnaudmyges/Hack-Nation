import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, StatusBar,
} from "react-native";
import { useOfferPipeline } from "../hooks/useOfferPipeline";
import { OfferCard } from "../components/OfferCard";
import { useGeofencing } from "../hooks/useGeofencing";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen({ navigation }: any) {
  const { phase, offer, contextState, signals, error, trigger, reset } = useOfferPipeline();
  const [userName, setUserName] = useState("");
  const [cashback, setCashback] = useState(0);

  const { startGeofencing } = useGeofencing(() => {
    if (phase === "idle") trigger(false);
  });

  useEffect(() => {
    startGeofencing();
    loadProfile();
    const unsub = navigation.addListener("focus", loadProfile);
    return unsub;
  }, [navigation]);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, cashback_balance")
      .eq("id", session.user.id)
      .single();
    if (data?.display_name) setUserName(data.display_name);
    if (data?.cashback_balance != null) setCashback(data.cashback_balance);
  }

  const handleAccept = () => {
    if (!offer) return;
    navigation.navigate("Wallet", { offer });
    reset();
  };

  const handleDecline = async () => {
    if (offer?.id) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from("offers")
          .update({ status: "declined", user_id: session.user.id })
          .eq("id", offer.id);
      }
    }
    reset();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{userName || "—"}</Text>
          </View>
          {cashback > 0 && (
            <View style={styles.cashbackChip}>
              <Text style={styles.cashbackLabel}>Cashback</Text>
              <Text style={styles.cashbackValue}>€{cashback.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* ── Context Panel ── */}
        <View style={styles.ctxCard}>
          <Text style={styles.ctxHeadline}>Context signals</Text>

          {contextState ? (
            <View style={styles.ctxBody}>
              {/* Row 1 */}
              <View style={styles.ctxRow}>
                <View style={styles.ctxChip}>
                  <Text style={styles.ctxChipIcon}>🌡</Text>
                  <Text style={styles.ctxChipText}>
                    {contextState.weather.temp}°C · {contextState.weather.description}
                  </Text>
                </View>
                <View style={styles.ctxChip}>
                  <Text style={styles.ctxChipIcon}>⏰</Text>
                  <Text style={styles.ctxChipText}>{contextState.hour}h · Stuttgart</Text>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.ctxRow}>
                <View style={styles.ctxChip}>
                  <Text style={styles.ctxChipIcon}>📍</Text>
                  <Text style={styles.ctxChipText}>
                    {contextState.nearbyMerchants[0]?.name ?? "No merchant nearby"}
                  </Text>
                </View>
              </View>

              {/* Payone bar */}
              <View style={styles.payoneWrap}>
                <View style={styles.payoneHeader}>
                  <Text style={styles.payoneLabel}>Payone transaction density</Text>
                  <Text style={[
                    styles.payoneValue,
                    { color: contextState.payoneSignal < 35 ? "#FFAB40" : "#69F0AE" },
                  ]}>
                    {contextState.payoneSignal}%{" "}
                    {contextState.payoneSignal < 35 ? "↓ quiet" : "→ normal"}
                  </Text>
                </View>
                <View style={styles.payoneBar}>
                  <View style={[
                    styles.payoneFill,
                    {
                      width: `${contextState.payoneSignal}%`,
                      backgroundColor: contextState.payoneSignal < 35 ? "#FFAB40" : "#69F0AE",
                    },
                  ]} />
                </View>
              </View>

              {/* Events */}
              {contextState.nearbyEvents?.length > 0 && (
                <View style={styles.eventsWrap}>
                  {contextState.nearbyEvents.map((ev: any, i: number) => (
                    <View key={ev.id ?? i} style={styles.eventChip}>
                      <Text style={styles.eventText}>🎉 {ev.name}</Text>
                      {ev.category ? (
                        <View style={styles.eventBadge}>
                          <Text style={styles.eventBadgeText}>{ev.category}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}

              {/* Signals */}
              {signals.length > 0 && (
                <View style={styles.signalsWrap}>
                  <Text style={styles.signalsTitle}>
                    ⚡ {signals.length} trigger{signals.length > 1 ? "s" : ""} detected
                  </Text>
                  {signals.map((s, i) => (
                    <Text key={i} style={styles.signalItem}>· {s}</Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.ctxBody}>
              {["Weather", "Location", "Time"].map((label) => (
                <View key={label} style={styles.ctxChipEmpty}>
                  <Text style={styles.ctxChipEmptyText}>{label} — awaiting</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Pipeline phases ── */}
        {phase === "sensing" && (
          <View style={[styles.phaseBanner, { backgroundColor: "#E3F2FD" }]}>
            <ActivityIndicator color="#1565C0" size="small" />
            <Text style={[styles.phaseText, { color: "#1565C0" }]}>Analysing context...</Text>
          </View>
        )}

        {phase === "generating" && (
          <View style={[styles.phaseBanner, { backgroundColor: "#FFF3E0" }]}>
            <ActivityIndicator color="#E65100" size="small" />
            <View>
              <Text style={[styles.phaseText, { color: "#E65100" }]}>
                Generating offer locally...
              </Text>
              <Text style={[styles.phaseSub, { color: "#E65100" }]}>
                Phi-3 mini · no data sent to cloud
              </Text>
            </View>
          </View>
        )}

        {phase === "error" && (
          <View style={[styles.phaseBanner, { backgroundColor: "#FFEBEE", flexDirection: "column", alignItems: "flex-start" }]}>
            <Text style={[styles.phaseText, { color: "#C62828" }]}>⚠ {error}</Text>
            <TouchableOpacity onPress={reset} style={{ marginTop: 6 }}>
              <Text style={{ color: "#C62828", fontSize: 12, textDecorationLine: "underline" }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Offer Card ── */}
        {phase === "ready" && offer && (
          <OfferCard offer={offer} onAccept={handleAccept} onDecline={handleDecline} />
        )}

        {/* ── Idle: demo buttons ── */}
        {phase === "idle" && (
          <View style={styles.idleSection}>
            <Text style={styles.idleHeadline}>Ready to find your perfect offer</Text>
            <Text style={styles.idleSub}>
              The AI will match real-time context signals to generate an offer just for this moment.
            </Text>

            <TouchableOpacity onPress={() => trigger(true)} style={styles.demoBtnPrimary}>
              <Text style={styles.demoBtnPrimaryText}>Simulate Mia's arrival</Text>
              <Text style={styles.demoBtnPrimaryHint}>Cold · Café Müller 83m · Payone 22%</Text>
            </TouchableOpacity>

          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  scroll: { paddingBottom: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: { fontSize: 13, color: "#9E9C96", fontWeight: "500" },
  userName: { fontSize: 22, fontWeight: "800", color: "#1C1C1A", marginTop: 2 },
  cashbackChip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  cashbackLabel: { fontSize: 10, fontWeight: "600", color: "#388E3C", textTransform: "uppercase" },
  cashbackValue: { fontSize: 16, fontWeight: "800", color: "#1B5E20" },

  // Context panel (dark premium card)
  ctxCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#1C1C1A",
    borderRadius: 20,
    padding: 18,
  },
  ctxHeadline: {
    fontSize: 11, fontWeight: "700", color: "#6E6C67",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14,
  },
  ctxBody: { gap: 8 },
  ctxRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  ctxChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#2A2A28", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  ctxChipIcon: { fontSize: 12 },
  ctxChipText: { fontSize: 12, color: "#C8C6C0", fontWeight: "500" },
  ctxChipEmpty: {
    backgroundColor: "#2A2A28", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  ctxChipEmptyText: { fontSize: 12, color: "#4A4A48" },

  payoneWrap: { marginTop: 4 },
  payoneHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  payoneLabel: { fontSize: 11, color: "#6E6C67" },
  payoneValue: { fontSize: 11, fontWeight: "700" },
  payoneBar: {
    height: 4, backgroundColor: "#2A2A28", borderRadius: 4, overflow: "hidden",
  },
  payoneFill: { height: "100%", borderRadius: 4 },

  eventsWrap: { marginTop: 6, gap: 6 },
  eventChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#2A1A44", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  eventText: { fontSize: 12, color: "#C4BCEF", flex: 1 },
  eventBadge: { backgroundColor: "#3D2B6B", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  eventBadgeText: { fontSize: 10, color: "#A09AE0" },

  signalsWrap: {
    marginTop: 6, backgroundColor: "#0F2419", borderRadius: 10, padding: 10,
  },
  signalsTitle: { fontSize: 11, fontWeight: "700", color: "#69F0AE", marginBottom: 4 },
  signalItem: { fontSize: 11, color: "#4CAF50" },

  // Phase banners
  phaseBanner: {
    marginHorizontal: 16, marginBottom: 14,
    padding: 14, borderRadius: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  phaseText: { fontSize: 13, fontWeight: "600" },
  phaseSub: { fontSize: 11, opacity: 0.7, marginTop: 2 },

  // Idle section
  idleSection: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  idleHeadline: { fontSize: 18, fontWeight: "700", color: "#1C1C1A" },
  idleSub: { fontSize: 13, color: "#7A7870", lineHeight: 18, marginBottom: 4 },
  demoBtnPrimary: {
    backgroundColor: "#E65100", borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#E65100", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  demoBtnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  demoBtnPrimaryHint: { color: "#FFD0B8", fontSize: 11, marginTop: 3 },
  demoBtnSecondary: {
    backgroundColor: "#F0EDE6", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  demoBtnSecondaryText: { color: "#5F5E5A", fontWeight: "600", fontSize: 13 },
});
