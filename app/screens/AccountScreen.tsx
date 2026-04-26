import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StatusBar,
} from "react-native";
import { supabase } from "../services/supabaseClient";

export default function AccountScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [declinedOffers, setDeclinedOffers] = useState<any[]>([]);
  const [cashback, setCashback] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setEmail(session.user.email ?? "");

      const [{ data: profile }, { data: offers }] = await Promise.all([
        supabase.from("profiles")
          .select("display_name, cashback_balance")
          .eq("id", session.user.id)
          .single(),
        supabase.from("offers")
          .select("id, headline")
          .eq("status", "declined")
          .eq("user_id", session.user.id),
      ]);

      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setCashback(profile.cashback_balance ?? 0);
      }
      setDeclinedOffers(offers ?? []);
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveName() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", session?.user.id);
    setSaving(false);
    if (!error) Alert.alert("Saved", "Your name has been updated.");
  }

  async function removePreference(offerId: string) {
    const { error } = await supabase.from("offers").update({ status: "expired" }).eq("id", offerId);
    if (!error) setDeclinedOffers((prev) => prev.filter((o) => o.id !== offerId));
    else Alert.alert("Error", "Could not remove preference.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#E65100" />
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {displayName?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{displayName || "—"}</Text>
            <Text style={styles.headerEmail}>{email}</Text>
          </View>
          {cashback > 0 && (
            <View style={styles.cashbackBadge}>
              <Text style={styles.cashbackBadgeLabel}>Balance</Text>
              <Text style={styles.cashbackBadgeValue}>€{cashback.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Edit name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your display name"
            placeholderTextColor="#B4B2A9"
          />
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveName}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save name"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Declined preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offer preferences</Text>
          <Text style={styles.sectionHint}>
            These offer types have been declined. The AI will avoid similar offers.
          </Text>

          {declinedOffers.length === 0 ? (
            <View style={styles.emptyPref}>
              <Text style={styles.emptyPrefText}>No declined offers recorded.</Text>
            </View>
          ) : (
            <View style={styles.prefList}>
              {declinedOffers.map((off) => (
                <View key={off.id} style={styles.prefRow}>
                  <View style={styles.prefDot} />
                  <Text style={styles.prefText} numberOfLines={1}>{off.headline}</Text>
                  <TouchableOpacity
                    onPress={() => removePreference(off.id)}
                    style={styles.prefRemoveBtn}
                  >
                    <Text style={styles.prefRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* GDPR info */}
        <View style={styles.gdprCard}>
          <Text style={styles.gdprTitle}>🔒 Your data & privacy</Text>
          <Text style={styles.gdprText}>
            City Wallet processes all location inference on-device using Phi-3 mini. Only anonymized intent signals are sent upstream. You can delete your account and all associated data at any time.
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, paddingBottom: 32 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
    marginTop: 4,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: "#E65100",
    alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { fontSize: 24, fontWeight: "800", color: "#fff" },
  headerText: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: "700", color: "#1C1C1A" },
  headerEmail: { fontSize: 12, color: "#9E9C96", marginTop: 2 },
  cashbackBadge: {
    backgroundColor: "#E8F5E9", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8, alignItems: "center",
  },
  cashbackBadgeLabel: { fontSize: 9, fontWeight: "700", color: "#388E3C", textTransform: "uppercase" },
  cashbackBadgeValue: { fontSize: 16, fontWeight: "800", color: "#1B5E20" },

  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EDE6",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1C1C1A", marginBottom: 12 },
  sectionHint: { fontSize: 12, color: "#9E9C96", marginBottom: 12, lineHeight: 17 },

  input: {
    backgroundColor: "#F5F3EE",
    borderRadius: 10, padding: 14,
    fontSize: 14, color: "#1C1C1A", marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: "#E65100", borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  emptyPref: { paddingVertical: 12, alignItems: "center" },
  emptyPrefText: { color: "#B4B2A9", fontSize: 13, fontStyle: "italic" },

  prefList: { gap: 8 },
  prefRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F5F3EE", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  prefDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C62828" },
  prefText: { flex: 1, fontSize: 13, color: "#1C1C1A" },
  prefRemoveBtn: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: "#FFEBEE",
    alignItems: "center", justifyContent: "center",
  },
  prefRemoveText: { fontSize: 16, color: "#C62828", fontWeight: "700", lineHeight: 18 },

  gdprCard: {
    backgroundColor: "#F5F3EE", borderRadius: 14,
    padding: 16, marginBottom: 14,
  },
  gdprTitle: { fontSize: 13, fontWeight: "700", color: "#1C1C1A", marginBottom: 8 },
  gdprText: { fontSize: 12, color: "#7A7870", lineHeight: 18 },

  logoutBtn: {
    backgroundColor: "#fff", borderRadius: 14,
    paddingVertical: 15, alignItems: "center",
    borderWidth: 1.5, borderColor: "#F0EDE6",
  },
  logoutText: { color: "#C62828", fontWeight: "700", fontSize: 15 },
});
