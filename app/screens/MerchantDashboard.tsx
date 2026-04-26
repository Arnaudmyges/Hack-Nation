import {
  View, Text, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useMerchantDashboard } from "../hooks/useMerchantDashboard";

function StatCard({
  label,
  value,
  sub,
  color = "#2C2C2A",
  bg = "#F1EFE8",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: bg,
      borderRadius: 12, padding: 14,
      alignItems: "center",
    }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: "#888", marginTop: 2, textAlign: "center" }}>
        {label}
      </Text>
      {sub && (
        <Text style={{ fontSize: 10, color, marginTop: 4, fontWeight: "600" }}>
          {sub}
        </Text>
      )}
    </View>
  );
}

function RedemptionRow({ item }: { item: any }) {
  const isRedeemed = item.status === "redeemed";
  const time = item.redeemed_at ?? item.created_at;
  const timeFormatted = time
    ? new Date(time).toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: "#F1EFE8",
    }}>
      <Text style={{ fontSize: 18, marginRight: 10 }}>
        {isRedeemed ? "✅" : "⏳"}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#2C2C2A" }} numberOfLines={1}>
          {item.offers?.headline ?? "—"}
        </Text>
        <Text style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
          {item.offers?.merchants?.name ?? "—"} · token: {item.token}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{
          fontSize: 13, fontWeight: "700",
          color: isRedeemed ? "#2E7D32" : "#888",
        }}>
          −{item.offers?.discount_pct ?? 0}%
        </Text>
        <Text style={{ fontSize: 10, color: "#B4B2A9", marginTop: 2 }}>
          {timeFormatted}
        </Text>
      </View>
    </View>
  );
}

export default function MerchantDashboard({ navigation }: any) {  const { stats, recentRedemptions, loading, refresh } = useMerchantDashboard();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAF8" }}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 12, color: "#888", fontSize: 13 }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#2C2C2A" }}>
            Karl's Dashboard
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4CAF50" }} />
            <Text style={{ fontSize: 11, color: "#4CAF50", fontWeight: "600" }}>
              Live — Supabase Realtime
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={refresh}
          style={{
            padding: 8, backgroundColor: "#E8F5E9",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: "#2E7D32", fontWeight: "600" }}>
            ↺ Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* Merchant rule reminder */}
      <View style={{
        backgroundColor: "#E8F5E9", borderRadius: 12,
        padding: 12, marginBottom: 16,
        flexDirection: "row", alignItems: "center", gap: 8,
      }}>
        <Text style={{ fontSize: 20 }}>⚙️</Text>
        <View>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B5E20" }}>
            Active rule — Café Müller
          </Text>
          <Text style={{ fontSize: 11, color: "#388E3C" }}>
            Max 20% · 11:00–17:00 · Cold / Rain / Overcast
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate("MerchantRule")}
        style={{
          backgroundColor: "#fff", borderRadius: 12,
          padding: 12, marginBottom: 16,
          flexDirection: "row", alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1, borderColor: "#F1EFE8",
        }}
      >
        <Text style={{ fontSize: 13, color: "#2C2C2A", fontWeight: "600" }}>
          ⚙️ Configure rule
        </Text>
        <Text style={{ fontSize: 13, color: "#888" }}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("OfferTemplates")}
        style={{
          padding: 12, backgroundColor: "#E3F2FD",
          borderRadius: 10, alignItems: "center", marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 12, color: "#1565C0", fontWeight: "600" }}>
          📋 Offer templates
        </Text>
      </TouchableOpacity>

      {/* Stats grid row 1 */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        <StatCard
          label="Offers generated"
          value={stats.offers_generated}
          bg="#F1EFE8"
          color="#2C2C2A"
        />
        <StatCard
          label="Accepted"
          value={stats.offers_accepted}
          sub={`${stats.acceptance_rate}% rate`}
          bg="#E3F2FD"
          color="#1565C0"
        />
      </View>

      {/* Stats grid row 2 */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        <StatCard
          label="Redeemed"
          value={stats.offers_redeemed}
          sub={`${stats.redemption_rate}% of accepted`}
          bg="#E8F5E9"
          color="#2E7D32"
        />
        <StatCard
          label="Avg discount"
          value={`${stats.avg_discount_pct}%`}
          bg="#FFF3E0"
          color="#E65100"
        />
      </View>

      {/* Last redemption */}
      {stats.last_redemption_at && (
        <View style={{
          backgroundColor: "#E8F5E9", borderRadius: 10,
          padding: 12, marginBottom: 16,
          flexDirection: "row", alignItems: "center", gap: 8,
        }}>
          <Text style={{ fontSize: 16 }}>🕐</Text>
          <Text style={{ fontSize: 12, color: "#2E7D32" }}>
            Last redemption at{" "}
            <Text style={{ fontWeight: "700" }}>
              {new Date(stats.last_redemption_at).toLocaleTimeString("en-GB", {
                hour: "2-digit", minute: "2-digit",
              })}
            </Text>
          </Text>
        </View>
      )}

      {/* Recent redemptions list */}
      <View style={{
        backgroundColor: "#fff", borderRadius: 14,
        padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: "#F1EFE8",
      }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 12 }}>
          Recent activity
        </Text>

        {recentRedemptions.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
            <Text style={{ fontSize: 13, color: "#B4B2A9" }}>
              No activity yet
            </Text>
            <Text style={{ fontSize: 11, color: "#D3D1C7", marginTop: 4 }}>
              Generate an offer to see it appear here
            </Text>
          </View>
        ) : (
          recentRedemptions.map((item) => (
            <RedemptionRow key={item.id} item={item} />
          ))
        )}
      </View>

      {/* GDPR notice */}
      <View style={{
        backgroundColor: "#F1EFE8", borderRadius: 10,
        padding: 12,
        flexDirection: "row", gap: 8,
      }}>
        <Text style={{ fontSize: 14 }}>🔒</Text>
        <Text style={{ fontSize: 11, color: "#888", flex: 1, lineHeight: 16 }}>
          All offer generation runs locally via Phi-3 mini (Ollama). Only anonymized intent signals and offer metadata are stored in Supabase. No personal data leaves the device.
        </Text>
      </View>
    </ScrollView>
  );
}