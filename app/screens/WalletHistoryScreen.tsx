import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, StatusBar,
} from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function WalletHistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: redemptions }, { data: profile }] = await Promise.all([
      supabase
        .from("redemptions")
        .select("id, token, status, created_at, redeemed_at, offers(headline, discount_pct, merchants(name))")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("profiles").select("cashback_balance").eq("id", user.id).single(),
    ]);

    setItems(redemptions ?? []);
    setBalance(profile?.cashback_balance ?? 0);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#E65100" />
      </View>
    );
  }

  const redeemed = items.filter((i) => i.status === "redeemed").length;
  const pending = items.filter((i) => i.status !== "redeemed").length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Wallet</Text>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View>
              <Text style={styles.balanceLabel}>Cashback balance</Text>
              <Text style={styles.balanceAmount}>€{balance.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceIcon}>
              <Text style={{ fontSize: 24 }}>💳</Text>
            </View>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatValue}>{redeemed}</Text>
              <Text style={styles.balanceStatLabel}>Redeemed</Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatValue}>{pending}</Text>
              <Text style={styles.balanceStatLabel}>Pending</Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatValue}>{items.length}</Text>
              <Text style={styles.balanceStatLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>Transaction history</Text>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyHint}>
              Accept an offer from the home screen to get started
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              const merchant = Array.isArray(offer?.merchants) ? offer.merchants[0] : offer?.merchants;
              const isRedeemed = item.status === "redeemed";
              const date = new Date(item.created_at);
              return (
                <View key={item.id} style={styles.row}>
                  <View style={[styles.rowIcon, isRedeemed ? styles.rowIconGreen : styles.rowIconGrey]}>
                    <Text style={{ fontSize: 16 }}>{isRedeemed ? "✓" : "·"}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowHeadline} numberOfLines={1}>
                      {offer?.headline ?? "—"}
                    </Text>
                    <Text style={styles.rowSub}>
                      {merchant?.name ?? "—"} · {date.toLocaleDateString("en-GB", {
                        day: "numeric", month: "short",
                      })}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={[styles.discountTag, isRedeemed ? styles.discountTagGreen : styles.discountTagGrey]}>
                      <Text style={[styles.discountTagText, isRedeemed ? { color: "#2E7D32" } : { color: "#888" }]}>
                        −{offer?.discount_pct ?? 0}%
                      </Text>
                    </View>
                    <Text style={styles.rowStatus}>
                      {isRedeemed ? "Used" : "Pending"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* GDPR note */}
        <View style={styles.gdprNote}>
          <Text style={styles.gdprText}>
            🔒 Only anonymized offer metadata is stored. Location data never leaves your device.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, paddingBottom: 32 },

  header: { marginBottom: 20, marginTop: 4 },
  title: { fontSize: 28, fontWeight: "800", color: "#1C1C1A" },

  balanceCard: {
    backgroundColor: "#1C1C1A",
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  balanceLabel: { fontSize: 12, fontWeight: "600", color: "#6E6C67", marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" },
  balanceAmount: { fontSize: 40, fontWeight: "800", color: "#FAFAF8" },
  balanceIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "#2A2A28",
    alignItems: "center", justifyContent: "center",
  },
  balanceDivider: { height: 1, backgroundColor: "#2A2A28", marginVertical: 20 },
  balanceStats: { flexDirection: "row", justifyContent: "space-around" },
  balanceStat: { alignItems: "center" },
  balanceStatValue: { fontSize: 20, fontWeight: "800", color: "#FAFAF8" },
  balanceStatLabel: { fontSize: 11, color: "#6E6C67", marginTop: 3 },
  balanceStatDivider: { width: 1, backgroundColor: "#2A2A28" },

  sectionTitle: {
    fontSize: 16, fontWeight: "700", color: "#1C1C1A", marginBottom: 12,
  },

  list: { gap: 8, marginBottom: 24 },
  row: {
    backgroundColor: "#fff", borderRadius: 14,
    padding: 14, flexDirection: "row", alignItems: "center",
    gap: 12,
    borderWidth: 1, borderColor: "#F0EDE6",
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  rowIconGreen: { backgroundColor: "#E8F5E9" },
  rowIconGrey: { backgroundColor: "#F5F3EE" },
  rowBody: { flex: 1 },
  rowHeadline: { fontSize: 13, fontWeight: "600", color: "#1C1C1A", marginBottom: 3 },
  rowSub: { fontSize: 11, color: "#9E9C96" },
  rowRight: { alignItems: "flex-end", gap: 4 },
  discountTag: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  discountTagGreen: { backgroundColor: "#E8F5E9" },
  discountTagGrey: { backgroundColor: "#F5F3EE" },
  discountTagText: { fontSize: 12, fontWeight: "700" },
  rowStatus: { fontSize: 10, color: "#B4B2A9" },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1C1C1A", marginBottom: 6 },
  emptyHint: { fontSize: 13, color: "#9E9C96", textAlign: "center" },

  gdprNote: {
    backgroundColor: "#F0EDE6", borderRadius: 12,
    padding: 12, marginTop: 8,
  },
  gdprText: { fontSize: 11, color: "#7A7870", lineHeight: 16 },
});
