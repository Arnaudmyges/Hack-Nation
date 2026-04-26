import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert, StyleSheet, StatusBar,
} from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

interface Rule {
  max_discount_pct: number;
  trigger_time_start: string;
  trigger_time_end: string;
  trigger_weather: string[];
  trigger_payone_threshold: number;
  active: boolean;
}

const DEFAULT_RULE: Rule = {
  max_discount_pct: 20,
  trigger_time_start: "11:00",
  trigger_time_end: "17:00",
  trigger_weather: ["cold", "rain", "overcast"],
  trigger_payone_threshold: 35,
  active: true,
};

const WEATHER_OPTIONS = [
  { id: "cold", label: "Cold", icon: "🥶" },
  { id: "rain", label: "Rain", icon: "🌧️" },
  { id: "overcast", label: "Overcast", icon: "☁️" },
  { id: "sunny", label: "Sunny", icon: "☀️" },
];

const AI_GENERATES = [
  "Headline & emotional tone",
  "Exact discount % (within your max)",
  "Offer expiry duration",
  "Visual theme matching the context",
  "Call-to-action label",
];

export default function MerchantRuleScreen({ navigation }: any) {
  const [rule, setRule] = useState<Rule>(DEFAULT_RULE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadRule();
  }, []);

  async function loadRule() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: merchant } = await supabase
      .from("merchants").select("id").eq("owner_id", user.id).maybeSingle();
    if (!merchant) return;
    const { data } = await supabase
      .from("merchant_rules").select("*")
      .eq("merchant_id", merchant.id).eq("active", true).maybeSingle();
    if (data) setRule({ ...DEFAULT_RULE, ...data });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: merchant } = await supabase
        .from("merchants").select("id").eq("owner_id", user.id).maybeSingle();
      if (!merchant) throw new Error("No merchant linked to this account");

      const payload = {
        merchant_id: merchant.id,
        max_discount_pct: Number(rule.max_discount_pct),
        trigger_time_start: rule.trigger_time_start,
        trigger_time_end: rule.trigger_time_end,
        trigger_weather: rule.trigger_weather,
        trigger_payone_threshold: Number(rule.trigger_payone_threshold),
        active: rule.active,
      };

      const { data: existing } = await supabase
        .from("merchant_rules").select("id").eq("merchant_id", merchant.id).maybeSingle();
      const { error } = existing
        ? await supabase.from("merchant_rules").update(payload).eq("id", existing.id)
        : await supabase.from("merchant_rules").insert(payload);

      if (error) throw new Error(error.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      Alert.alert("Save failed", e.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleWeather(w: string) {
    setRule((r) => ({
      ...r,
      trigger_weather: r.trigger_weather.includes(w)
        ? r.trigger_weather.filter((x) => x !== w)
        : [...r.trigger_weather, w],
    }));
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Merchant header */}
        <View style={styles.merchantCard}>
          <View style={styles.merchantAvatar}>
            <Text style={{ fontSize: 24 }}>🏪</Text>
          </View>
          <View style={styles.merchantInfo}>
            <Text style={styles.merchantName}>Café Müller</Text>
            <Text style={styles.merchantSub}>Stuttgart · Active partner</Text>
          </View>
          <View style={styles.switchWrap}>
            <Switch
              value={rule.active}
              onValueChange={(val) => setRule((r) => ({ ...r, active: val }))}
              trackColor={{ true: "#4CAF50", false: "#D3D1C7" }}
              thumbColor="#fff"
            />
            <Text style={[styles.switchLabel, { color: rule.active ? "#2E7D32" : "#B4B2A9" }]}>
              {rule.active ? "Active" : "Paused"}
            </Text>
          </View>
        </View>

        {/* Objective */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Objective</Text>
          <Text style={styles.objectiveText}>Fill quiet hours with spontaneous foot traffic</Text>
          <Text style={styles.objectiveHint}>The AI generates the offer automatically within your rules</Text>
        </View>

        {/* AI goal prompt */}
        <TouchableOpacity
          onPress={() => navigation.navigate("GoalPrompt", {
            onRuleExtracted: (r: Partial<Rule>) => setRule((prev) => ({ ...prev, ...r })),
          })}
          style={styles.aiPromptBtn}
        >
          <Text style={styles.aiPromptIcon}>💬</Text>
          <View>
            <Text style={styles.aiPromptTitle}>Define by goal (AI)</Text>
            <Text style={styles.aiPromptSub}>Describe in plain language, AI extracts the rule</Text>
          </View>
          <Text style={styles.aiPromptArrow}>→</Text>
        </TouchableOpacity>

        {/* Rule parameters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Rule parameters</Text>

          <View style={styles.paramRow}>
            <View>
              <Text style={styles.paramLabel}>Max discount</Text>
              <Text style={styles.paramHint}>AI will never exceed this</Text>
            </View>
            <View style={styles.paramBadge}>
              <Text style={styles.paramBadgeText}>{rule.max_discount_pct}%</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.paramRow}>
            <View>
              <Text style={styles.paramLabel}>Active window</Text>
              <Text style={styles.paramHint}>Offers only trigger in this range</Text>
            </View>
            <View style={styles.paramBadge}>
              <Text style={styles.paramBadgeText}>
                {rule.trigger_time_start} – {rule.trigger_time_end}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.paramRow}>
            <View>
              <Text style={styles.paramLabel}>Payone threshold</Text>
              <Text style={styles.paramHint}>Triggers when foot traffic drops below</Text>
            </View>
            <View style={styles.paramBadge}>
              <Text style={styles.paramBadgeText}>{"<"} {rule.trigger_payone_threshold}%</Text>
            </View>
          </View>

          <View style={[styles.divider, { marginBottom: 14 }]} />

          <Text style={styles.weatherLabel}>Weather triggers</Text>
          <View style={styles.weatherRow}>
            {WEATHER_OPTIONS.map((w) => {
              const isOn = rule.trigger_weather.includes(w.id);
              return (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => toggleWeather(w.id)}
                  style={[styles.weatherChip, isOn && styles.weatherChipOn]}
                >
                  <Text style={styles.weatherChipIcon}>{w.icon}</Text>
                  <Text style={[styles.weatherChipText, isOn && styles.weatherChipTextOn]}>
                    {w.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI generates */}
        <View style={styles.aiSection}>
          <Text style={styles.aiTitle}>🤖 AI generates automatically</Text>
          {AI_GENERATES.map((item, i) => (
            <View key={i} style={styles.aiItem}>
              <View style={styles.aiDot} />
              <Text style={styles.aiItemText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveBtn,
            saved && styles.saveBtnSuccess,
            saving && styles.saveBtnDisabled,
          ]}
        >
          <Text style={styles.saveBtnText}>
            {saved ? "✓ Rule saved!" : saving ? "Saving..." : "Save rule"}
          </Text>
        </TouchableOpacity>

        {/* GDPR */}
        <View style={styles.gdprNote}>
          <Text style={styles.gdprText}>
            🔒 Only your rule parameters are stored. Customer location data never reaches the cloud — all inference runs locally via Phi-3 mini.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  scroll: { padding: 20, paddingBottom: 40 },

  merchantCard: {
    backgroundColor: "#E8F5E9", borderRadius: 20,
    padding: 16, marginBottom: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  merchantAvatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "#DCF0DD",
    alignItems: "center", justifyContent: "center",
  },
  merchantInfo: { flex: 1 },
  merchantName: { fontSize: 16, fontWeight: "700", color: "#1B5E20" },
  merchantSub: { fontSize: 12, color: "#388E3C", marginTop: 2 },
  switchWrap: { alignItems: "center" },
  switchLabel: { fontSize: 10, fontWeight: "700", marginTop: 4 },

  section: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: "#F0EDE6",
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1C1C1A", marginBottom: 12 },

  objectiveText: { fontSize: 14, color: "#1C1C1A", fontWeight: "500" },
  objectiveHint: { fontSize: 11, color: "#B4B2A9", marginTop: 4 },

  aiPromptBtn: {
    backgroundColor: "#EFF4FF", borderRadius: 14,
    padding: 14, marginBottom: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  aiPromptIcon: { fontSize: 22 },
  aiPromptTitle: { fontSize: 13, fontWeight: "700", color: "#1565C0" },
  aiPromptSub: { fontSize: 11, color: "#7A99C8", marginTop: 2 },
  aiPromptArrow: { marginLeft: "auto", fontSize: 16, color: "#1565C0" },

  paramRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 12,
  },
  paramLabel: { fontSize: 13, fontWeight: "600", color: "#1C1C1A" },
  paramHint: { fontSize: 11, color: "#9E9C96", marginTop: 2 },
  paramBadge: {
    backgroundColor: "#E8F5E9", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  paramBadgeText: { fontSize: 13, fontWeight: "700", color: "#2E7D32" },
  divider: { height: 1, backgroundColor: "#F5F3EE" },

  weatherLabel: { fontSize: 11, fontWeight: "600", color: "#9E9C96", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  weatherRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  weatherChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#F5F3EE",
    borderWidth: 1.5, borderColor: "transparent",
  },
  weatherChipOn: { borderColor: "#2E7D32", backgroundColor: "#E8F5E9" },
  weatherChipIcon: { fontSize: 14 },
  weatherChipText: { fontSize: 12, fontWeight: "600", color: "#888" },
  weatherChipTextOn: { color: "#2E7D32" },

  aiSection: {
    backgroundColor: "#FFF8F0", borderRadius: 16,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: "#FFE0B2",
  },
  aiTitle: { fontSize: 14, fontWeight: "700", color: "#E65100", marginBottom: 12 },
  aiItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E65100" },
  aiItemText: { fontSize: 12, color: "#BF360C" },

  saveBtn: {
    backgroundColor: "#E65100", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginBottom: 16,
    shadowColor: "#E65100", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  saveBtnSuccess: { backgroundColor: "#2E7D32", shadowColor: "#2E7D32" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  gdprNote: { backgroundColor: "#F5F3EE", borderRadius: 12, padding: 14 },
  gdprText: { fontSize: 11, color: "#7A7870", lineHeight: 17 },
});
