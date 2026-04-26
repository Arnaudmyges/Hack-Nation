// app/screens/WalletHistoryScreen.tsx
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function WalletHistoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: redemptions }, { data: profile }] = await Promise.all([
        supabase.from("redemptions")
          .select("id, token, status, created_at, redeemed_at, offers(headline, discount_pct, merchants(name))")
          .order("created_at", { ascending: false }).limit(20),
        supabase.from("profiles").select("cashback_balance").eq("id", user.id).single(),
      ]);

      setItems(redemptions ?? []);
      setBalance(profile?.cashback_balance ?? 0);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#E65100" />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 16 }}>
      {/* Solde */}
      <View style={{ backgroundColor: "#E8F5E9", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 13, color: "#388E3C" }}>Cashback balance</Text>
        <Text style={{ fontSize: 32, fontWeight: "800", color: "#1B5E20" }}>€{balance.toFixed(2)}</Text>
      </View>

      <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 10 }}>
        Past offers
      </Text>

      {items.length === 0 && (
        <Text style={{ color: "#B4B2A9", textAlign: "center", marginTop: 40 }}>
          No offers yet
        </Text>
      )}

      {items.map((item: any) => {
        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        const merchant = Array.isArray(offer?.merchants) ? offer.merchants[0] : offer?.merchants;
        const isRedeemed = item.status === "redeemed";
        return (
          <View key={item.id} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 14,
            marginBottom: 8, borderWidth: 1, borderColor: "#F1EFE8",
            flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>{isRedeemed ? "✅" : "⏳"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#2C2C2A" }} numberOfLines={1}>
                {offer?.headline ?? "—"}
              </Text>
              <Text style={{ fontSize: 11, color: "#888" }}>
                {merchant?.name ?? "—"} · {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: isRedeemed ? "#2E7D32" : "#888" }}>
              −{offer?.discount_pct ?? 0}%
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}