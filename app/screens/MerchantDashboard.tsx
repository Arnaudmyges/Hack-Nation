import {
  View, Text, ScrollView,
  TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar,
} from "react-native";
import { useMerchantDashboard } from "../hooks/useMerchantDashboard";

function StatCard({
  label, value, sub, accent = "#E65100", bg = "#F5F3EE",
}: {
  label: string; value: string | number; sub?: string; accent?: string; bg?: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: accent }]}>{sub}</Text> : null}
    </View>
  );
}

function RedemptionRow({ item }: { item: any }) {
  const isRedeemed = item.status === "redeemed";
  const time = item.redeemed_at ?? item.created_at;
  const formatted = time
    ? new Date(time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <View style={styles.redeemRow}>
      <View style={[styles.redeemIconWrap, isRedeemed ? styles.redeemIconGreen : styles.redeemIconGrey]}>
        <Text style={styles.redeemIconText}>{isRedeemed ? "✓" : "·"}</Text>
      </View>
      <View style={styles.redeemBody}>
        <Text style={styles.redeemHeadline} numberOfLines={1}>
          {item.offers?.headline ?? "—"}
        </Text>
        <Text style={styles.redeemSub}>
          {item.offers?.merchants?.name ?? "—"} · {item.token}
        </Text>
      </View>
      <View style={styles.redeemRight}>
        <Text style={[styles.redeemDiscount, { color: isRedeemed ? "#2E7D32" : "#B4B2A9" }]}>
          −{item.offers?.discount_pct ?? 0}%
        </Text>
        <Text style={styles.redeemTime}>{formatted}</Text>
      </View>
    </View>
  );
}

export default function MerchantDashboard({ navigation }: any) {
  const { stats, recentRedemptions, loading, refresh } = useMerchantDashboard();

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.merchantAvatar}>
              <Text style={styles.merchantAvatarText}>K</Text>
            </View>
            <View>
              <Text style={styles.merchantName}>Karl's Café</Text>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live · Supabase Realtime</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>↺</Text>
          </TouchableOpacity>
        </View>

        {/* ── Active rule banner ── */}
        <View style={styles.ruleBanner}>
          <View style={styles.ruleIcon}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </View>
          <View style={styles.ruleBody}>
            <Text style={styles.ruleTitle}>Active rule — Café Müller</Text>
            <Text style={styles.ruleSub}>Max 20% · 11:00–17:00 · Cold / Rain / Overcast</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("MerchantRule")}
            style={styles.ruleEditBtn}
          >
            <Text style={styles.ruleEditText}>Edit →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Generated"
            value={stats.offers_generated}
            bg="#F5F3EE"
            accent="#1C1C1A"
          />
          <StatCard
            label="Accepted"
            value={stats.offers_accepted}
            sub={`${stats.acceptance_rate}% rate`}
            bg="#E3F2FD"
            accent="#1565C0"
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label="Redeemed"
            value={stats.offers_redeemed}
            sub={`${stats.redemption_rate}% of accepted`}
            bg="#E8F5E9"
            accent="#2E7D32"
          />
          <StatCard
            label="Avg discount"
            value={`${stats.avg_discount_pct}%`}
            bg="#FFF3E0"
            accent="#E65100"
          />
        </View>

        {/* Last redemption */}
        {stats.last_redemption_at && (
          <View style={styles.lastRedeemBanner}>
            <Text style={styles.lastRedeemIcon}>🕐</Text>
            <Text style={styles.lastRedeemText}>
              Last redemption at{" "}
              <Text style={{ fontWeight: "700" }}>
                {new Date(stats.last_redemption_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </Text>
            </Text>
          </View>
        )}

        {/* ── Quick actions ── */}
        <Text style={styles.sectionTitle}>Merchant tools</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            onPress={() => navigation.navigate("MerchantScan")}
            style={[styles.actionCard, { backgroundColor: "#1C1C1A" }]}
          >
            <Text style={styles.actionEmoji}>📷</Text>
            <Text style={styles.actionLabel}>Scan QR</Text>
            <Text style={styles.actionSub}>Validate offer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("MerchantRule")}
            style={[styles.actionCard, { backgroundColor: "#E8F5E9" }]}
          >
            <Text style={styles.actionEmoji}>⚙️</Text>
            <Text style={[styles.actionLabel, { color: "#1B5E20" }]}>Rules</Text>
            <Text style={[styles.actionSub, { color: "#388E3C" }]}>Configure triggers</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate("OfferTemplates")}
            style={styles.actionRowBtn}
          >
            <Text style={styles.actionRowBtnText}>📋 Offer templates</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Products")}
            style={styles.actionRowBtn}
          >
            <Text style={styles.actionRowBtnText}>📦 Products</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recent activity ── */}
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <View style={styles.activityCard}>
          {recentRedemptions.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptySub}>Generate an offer to see it here</Text>
            </View>
          ) : (
            recentRedemptions.map((item) => (
              <RedemptionRow key={item.id} item={item} />
            ))
          )}
        </View>

        {/* GDPR */}
        <View style={styles.gdprNote}>
          <Text style={styles.gdprText}>
            🔒 All offer generation runs locally via Phi-3 mini (Ollama). Only anonymized intent signals and offer metadata are stored. No personal data leaves the device.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#9E9C96", fontSize: 13 },
  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20, marginTop: 4,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  merchantAvatar: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "#2E7D32",
    alignItems: "center", justifyContent: "center",
  },
  merchantAvatarText: { fontSize: 22, fontWeight: "800", color: "#fff" },
  merchantName: { fontSize: 18, fontWeight: "700", color: "#1C1C1A" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4CAF50" },
  liveText: { fontSize: 11, color: "#4CAF50", fontWeight: "600" },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#E8F5E9",
    alignItems: "center", justifyContent: "center",
  },
  refreshText: { fontSize: 18, color: "#2E7D32" },

  ruleBanner: {
    backgroundColor: "#F0FAF1", borderRadius: 16,
    padding: 14, marginBottom: 20,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  ruleIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#DCF0DD",
    alignItems: "center", justifyContent: "center",
  },
  ruleBody: { flex: 1 },
  ruleTitle: { fontSize: 13, fontWeight: "700", color: "#1B5E20" },
  ruleSub: { fontSize: 11, color: "#388E3C", marginTop: 2 },
  ruleEditBtn: {
    backgroundColor: "#2E7D32", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  ruleEditText: { fontSize: 12, color: "#fff", fontWeight: "600" },

  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: "center",
  },
  statValue: { fontSize: 30, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#9E9C96", marginTop: 4, textAlign: "center" },
  statSub: { fontSize: 10, fontWeight: "700", marginTop: 4 },

  lastRedeemBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#E8F5E9", borderRadius: 12,
    padding: 12, marginBottom: 24,
  },
  lastRedeemIcon: { fontSize: 16 },
  lastRedeemText: { fontSize: 12, color: "#2E7D32" },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1C1C1A", marginBottom: 12 },

  actionsGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  actionCard: {
    flex: 1, borderRadius: 16, padding: 16,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  actionEmoji: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: "700", color: "#FAFAF8" },
  actionSub: { fontSize: 11, color: "#6E6C67", marginTop: 2 },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  actionRowBtn: {
    flex: 1, backgroundColor: "#fff",
    borderRadius: 12, paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1, borderColor: "#F0EDE6",
  },
  actionRowBtnText: { fontSize: 12, fontWeight: "600", color: "#5F5E5A" },

  activityCard: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: "#F0EDE6",
  },
  redeemRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, gap: 12,
    borderBottomWidth: 1, borderBottomColor: "#F5F3EE",
  },
  redeemIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  redeemIconGreen: { backgroundColor: "#E8F5E9" },
  redeemIconGrey: { backgroundColor: "#F5F3EE" },
  redeemIconText: { fontSize: 14, fontWeight: "700", color: "#2E7D32" },
  redeemBody: { flex: 1 },
  redeemHeadline: { fontSize: 13, fontWeight: "600", color: "#1C1C1A" },
  redeemSub: { fontSize: 11, color: "#9E9C96", marginTop: 2 },
  redeemRight: { alignItems: "flex-end" },
  redeemDiscount: { fontSize: 14, fontWeight: "700" },
  redeemTime: { fontSize: 10, color: "#B4B2A9", marginTop: 2 },

  emptyActivity: { alignItems: "center", paddingVertical: 24 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#1C1C1A" },
  emptySub: { fontSize: 12, color: "#9E9C96", marginTop: 4 },

  gdprNote: {
    backgroundColor: "#F5F3EE", borderRadius: 12, padding: 14,
  },
  gdprText: { fontSize: 11, color: "#7A7870", lineHeight: 17 },
});
