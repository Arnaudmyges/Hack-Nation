import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { extractRuleFromGoalPrompt } from "../services/ollamaService";

export interface MerchantRule {
  max_discount_pct: number;
  trigger_time_start: string;
  trigger_time_end: string;
  trigger_weather: string[];
  trigger_payone_threshold: number;
  active?: boolean;
}

export default function GoalPromptScreen({ route, navigation }: any) {
  const { onRuleExtracted } = route.params ?? {};
  const [goal, setGoal] = useState("");
  const [extracted, setExtracted] = useState<Partial<MerchantRule> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const rule = await extractRuleFromGoalPrompt(goal);
      setExtracted(rule);
    } catch {
      // Fallback si Ollama KO
      setExtracted({ max_discount_pct: 15, trigger_weather: ["cold", "rain"],
        trigger_time_start: "14:00", trigger_time_end: "17:00", trigger_payone_threshold: 35 });
      setError("Ollama offline — default values applied");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (extracted && onRuleExtracted) onRuleExtracted(extracted);
    navigation.goBack();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 12 }}>
        💬 Describe your goal in plain language
      </Text>
      <TextInput
        value={goal} onChangeText={setGoal} multiline numberOfLines={3}
        placeholder='e.g. "Fill my café between 2pm and 5pm on cold rainy days, max 20% off"'
        placeholderTextColor="#B4B2A9"
        style={{ backgroundColor: "#F1EFE8", borderRadius: 10, padding: 12,
          fontSize: 13, color: "#2C2C2A", minHeight: 80, marginBottom: 12 }}
      />
      <TouchableOpacity onPress={handleAnalyze} disabled={loading || !goal.trim()}
        style={{ backgroundColor: loading ? "#B4B2A9" : "#E65100",
          borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 16 }}>
        {loading ? <ActivityIndicator color="#fff" /> :
          <Text style={{ color: "#fff", fontWeight: "700" }}>🤖 Extract rule with AI</Text>}
      </TouchableOpacity>
      {error && <Text style={{ color: "#C62828", fontSize: 12, marginBottom: 8 }}>{error}</Text>}
      {extracted && (
        <View style={{ backgroundColor: "#E8F5E9", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1B5E20", marginBottom: 8 }}>
            ✅ Extracted rule
          </Text>
          {Object.entries(extracted).map(([k, v]) => (
            <Text key={k} style={{ fontSize: 12, color: "#2E7D32", marginBottom: 3 }}>
              · {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
            </Text>
          ))}
          <TouchableOpacity onPress={handleApply}
            style={{ backgroundColor: "#2E7D32", borderRadius: 10, paddingVertical: 10,
              alignItems: "center", marginTop: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Apply this rule →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}