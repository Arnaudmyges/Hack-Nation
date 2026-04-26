import {
  View, Text, ScrollView,
  TouchableOpacity, Switch,
  Alert,
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

function RuleRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={{
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: "#F1EFE8",
    }}>
      <View>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#2C2C2A" }}>
          {label}
        </Text>
        {sub && (
          <Text style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            {sub}
          </Text>
        )}
      </View>
      <View style={{
        backgroundColor: "#E8F5E9", borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
      }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#2E7D32" }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function WeatherBadge({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  const icons: Record<string, string> = {
    cold: "🥶",
    rain: "🌧️",
    overcast: "☁️",
    sunny: "☀️",
  };
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: active ? "#E8F5E9" : "#F1EFE8",
      borderWidth: 1,
      borderColor: active ? "#2E7D32" : "#D3D1C7",
    }}>
      <Text style={{ fontSize: 14 }}>{icons[label] ?? "🌤️"}</Text>
      <Text style={{
        fontSize: 12, fontWeight: "600",
        color: active ? "#2E7D32" : "#888",
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function MerchantRuleScreen({ navigation }: any) {
  const [rule, setRule] = useState<Rule>(DEFAULT_RULE);

  useEffect(() => {
    const loadRule = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: merchant } = await supabase
        .from("merchants").select("id").eq("owner_id", user.id).single();
      if (!merchant) return;
      const { data } = await supabase
        .from("merchant_rules").select("*")
        .eq("merchant_id", merchant.id).eq("active", true).single();
      if (data) setRule({ ...DEFAULT_RULE, ...data });
    };
    loadRule();
  }, []);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!merchant) throw new Error("No merchant linked to this account");

      await supabase.from("merchant_rules").upsert({
        merchant_id: merchant.id,
        max_discount_pct: rule.max_discount_pct,
        trigger_time_start: rule.trigger_time_start,
        trigger_time_end: rule.trigger_time_end,
        trigger_weather: rule.trigger_weather,
        trigger_payone_threshold: rule.trigger_payone_threshold,
        active: rule.active,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      Alert.alert("Error saving rule", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{
        backgroundColor: "#E8F5E9", borderRadius: 14,
        padding: 16, marginBottom: 20,
        flexDirection: "row", alignItems: "center", gap: 12,
      }}>
        <Text style={{ fontSize: 32 }}>🏪</Text>
        <View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1B5E20" }}>
            Café Müller
          </Text>
          <Text style={{ fontSize: 12, color: "#388E3C" }}>
            Stuttgart · Active partner
          </Text>
        </View>
        <View style={{ marginLeft: "auto", alignItems: "center" }}>
          <Switch
            value={rule.active}
            onValueChange={() => {}}
            trackColor={{ true: "#4CAF50", false: "#D3D1C7" }}
          />
          <Text style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            {rule.active ? "Active" : "Paused"}
          </Text>
        </View>
      </View>

      {/* Goal section */}
      <View style={{
        backgroundColor: "#fff", borderRadius: 14,
        padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: "#F1EFE8",
      }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 4 }}>
          🎯 Objective
        </Text>
        <Text style={{ fontSize: 13, color: "#5F5E5A" }}>
          Fill quiet hours with spontaneous foot traffic
        </Text>
        <Text style={{ fontSize: 11, color: "#B4B2A9", marginTop: 4 }}>
          The AI generates the offer automatically within your rules
        </Text>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("GoalPrompt", {
        onRuleExtracted: (r: Partial<Rule>) => setRule(prev => ({ ...prev, ...r }))
      })} style={{ backgroundColor: "#E3F2FD", borderRadius: 10, padding: 12,
        alignItems: "center", marginBottom: 16 }}>
        <Text style={{ color: "#1565C0", fontWeight: "600" }}>💬 Define by goal (AI)</Text>
      </TouchableOpacity>

      {/* Rules */}
      <View style={{
        backgroundColor: "#fff", borderRadius: 14,
        padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: "#F1EFE8",
      }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 8 }}>
          ⚙️ Rule parameters
        </Text>
        <RuleRow
          label="Max discount"
          value={`${rule.max_discount_pct}%`}
          sub="AI will never exceed this"
        />
        <RuleRow
          label="Active window"
          value={`${rule.trigger_time_start} – ${rule.trigger_time_end}`}
          sub="Offer only triggers in this range"
        />
        <RuleRow
          label="Payone threshold"
          value={`< ${rule.trigger_payone_threshold}%`}
          sub="Triggers when foot traffic drops below"
        />

        {/* Weather triggers */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
            Weather triggers
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {["cold", "rain", "overcast", "sunny"].map((w) => (
              <TouchableOpacity
                key={w}
                onPress={() => setRule(r => ({
                  ...r,
                  trigger_weather: r.trigger_weather.includes(w)
                    ? r.trigger_weather.filter(x => x !== w)
                    : [...r.trigger_weather, w]
                }))}
              >
                <WeatherBadge
                  label={w}
                  active={rule.trigger_weather.includes(w)}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* AI generates section */}
      <View style={{
        backgroundColor: "#FFF3E0", borderRadius: 14,
        padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: "#FFE0B2",
      }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#E65100", marginBottom: 8 }}>
          🤖 AI generates automatically
        </Text>
        {[
          "Headline & emotional tone",
          "Exact discount % (within your max)",
          "Offer expiry duration",
          "Visual theme matching the context",
          "Call-to-action label",
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: "#E65100" }}>→</Text>
            <Text style={{ fontSize: 12, color: "#BF360C" }}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Save button */}
      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: saved ? "#2E7D32" : "#E65100",
          borderRadius: 14, paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          {saved ? "✓ Rule saved!" : "Save rule"}
        </Text>
      </TouchableOpacity>

      {/* GDPR notice */}
      <View style={{
        marginTop: 16, backgroundColor: "#F1EFE8",
        borderRadius: 10, padding: 12,
        flexDirection: "row", gap: 8,
      }}>
        <Text style={{ fontSize: 14 }}>🔒</Text>
        <Text style={{ fontSize: 11, color: "#888", flex: 1, lineHeight: 16 }}>
          Only your rule parameters are stored. Customer location data never reaches the cloud — all inference runs locally via Phi-3 mini.
        </Text>
      </View>
    </ScrollView>
  );
}