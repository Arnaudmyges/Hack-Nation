import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from "react-native";
import { supabase } from "../services/supabaseClient";

const POINTS = [
  {
    icon: "📍",
    good: true,
    title: "What stays on your device",
    detail: "Your precise GPS location, movement patterns, and browsing behavior never leave your phone. All inference runs locally via Phi-3 mini.",
  },
  {
    icon: "🤖",
    good: true,
    title: "What the AI sees",
    detail: "Only an abstract signal — e.g. {weather: cold, category: café}. No name, no address, no identity reaches the cloud.",
  },
  {
    icon: "🗄",
    good: true,
    title: "What we store",
    detail: "Anonymized offer metadata and your cashback balance. Never your location history or movement data.",
  },
  {
    icon: "🚫",
    good: false,
    title: "What we never do",
    detail: "We never sell your data, serve ads, or share your profile with third parties — ever.",
  },
];

export default function ConsentScreen({ navigation }: any) {
  const handleAccept = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        role: "customer",
        display_name: user.email?.split("@")[0] ?? "User",
      });
    }
    navigation.replace("ClientMain");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.shieldWrap}>
            <Text style={styles.shieldIcon}>🔒</Text>
          </View>
          <Text style={styles.title}>Your privacy matters</Text>
          <Text style={styles.subtitle}>
            Before we start, here is exactly how City Wallet uses your data.
          </Text>
        </View>

        {/* Points */}
        <View style={styles.pointsWrap}>
          {POINTS.map((p, i) => (
            <View key={i} style={[styles.pointCard, p.good ? styles.pointGood : styles.pointBad]}>
              <View style={[styles.pointIconWrap, p.good ? styles.iconWrapGood : styles.iconWrapBad]}>
                <Text style={styles.pointIcon}>{p.icon}</Text>
              </View>
              <View style={styles.pointContent}>
                <Text style={[styles.pointTitle, p.good ? styles.titleGood : styles.titleBad]}>
                  {p.title}
                </Text>
                <Text style={styles.pointDetail}>{p.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* GDPR badge */}
        <View style={styles.gdprBadge}>
          <Text style={styles.gdprText}>GDPR compliant · On-device AI · No tracking</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handleAccept} style={styles.cta}>
          <Text style={styles.ctaText}>I understand — let's go →</Text>
        </TouchableOpacity>

        <Text style={styles.fine}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  scroll: { padding: 24, paddingBottom: 48 },

  header: { alignItems: "center", marginBottom: 32, marginTop: 24 },
  shieldWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "#E8F5E9",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  shieldIcon: { fontSize: 28 },
  title: { fontSize: 26, fontWeight: "800", color: "#1C1C1A", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#7A7870", textAlign: "center", lineHeight: 20 },

  pointsWrap: { gap: 10, marginBottom: 20 },
  pointCard: {
    flexDirection: "row", padding: 14, borderRadius: 16,
    gap: 12, alignItems: "flex-start",
  },
  pointGood: { backgroundColor: "#F0FAF1" },
  pointBad: { backgroundColor: "#FFF4F4" },
  pointIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  iconWrapGood: { backgroundColor: "#DCF0DD" },
  iconWrapBad: { backgroundColor: "#FFE0E0" },
  pointIcon: { fontSize: 18 },
  pointContent: { flex: 1 },
  pointTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  titleGood: { color: "#1B5E20" },
  titleBad: { color: "#C62828" },
  pointDetail: { fontSize: 12, color: "#5F5E5A", lineHeight: 17 },

  gdprBadge: {
    alignSelf: "center",
    backgroundColor: "#F0EDE6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 24,
  },
  gdprText: { fontSize: 11, fontWeight: "600", color: "#7A7870" },

  cta: {
    backgroundColor: "#E65100", borderRadius: 14,
    paddingVertical: 17, alignItems: "center",
    shadowColor: "#E65100", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  fine: { marginTop: 16, fontSize: 11, color: "#B4B2A9", textAlign: "center", lineHeight: 16 },
});
