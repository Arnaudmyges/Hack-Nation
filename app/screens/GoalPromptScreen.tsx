import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, StatusBar,
} from "react-native";
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

const EXAMPLES = [
  "Fill my café between 2pm and 5pm on cold rainy days, max 20% off",
  "Drive lunch traffic 11am–1pm when it's quiet, up to 15% discount",
];

export default function GoalPromptScreen({ route, navigation }: any) {
  const { onRuleExtracted } = route.params ?? {};
  const [goal, setGoal] = useState("");
  const [extracted, setExtracted] = useState<Partial<MerchantRule> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const rule = await extractRuleFromGoalPrompt(goal);
      setExtracted(rule);
    } catch {
      setExtracted({
        max_discount_pct: 15,
        trigger_weather: ["cold", "rain"],
        trigger_time_start: "14:00",
        trigger_time_end: "17:00",
        trigger_payone_threshold: 35,
      });
      setError("Ollama offline — default values applied");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (extracted && onRuleExtracted) onRuleExtracted(extracted);
    navigation.goBack();
  }

  const RULE_LABELS: Record<string, string> = {
    max_discount_pct: "Max discount",
    trigger_time_start: "Start time",
    trigger_time_end: "End time",
    trigger_weather: "Weather triggers",
    trigger_payone_threshold: "Payone threshold",
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.aiIcon}>
            <Text style={{ fontSize: 24 }}>🤖</Text>
          </View>
          <Text style={styles.title}>Define by goal</Text>
          <Text style={styles.subtitle}>
            Describe your objective in plain language. The AI will extract the rule parameters automatically.
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Your goal</Text>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            multiline
            numberOfLines={4}
            placeholder='e.g. "Fill my café between 2pm and 5pm on cold rainy days, max 20% off"'
            placeholderTextColor="#B4B2A9"
            style={styles.input}
          />

          <Text style={styles.exampleLabel}>Examples</Text>
          <View style={styles.examples}>
            {EXAMPLES.map((ex, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setGoal(ex)}
                style={styles.exampleChip}
              >
                <Text style={styles.exampleText}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAnalyze}
          disabled={loading || !goal.trim()}
          style={[styles.analyzeBtn, (loading || !goal.trim()) && styles.analyzeBtnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.analyzeBtnText}>🤖 Extract rule with AI</Text>
          }
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {/* Extracted rule */}
        {extracted && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>✓ Rule extracted</Text>
            <View style={styles.resultRows}>
              {Object.entries(extracted).map(([k, v]) => (
                <View key={k} style={styles.resultRow}>
                  <Text style={styles.resultKey}>{RULE_LABELS[k] ?? k}</Text>
                  <Text style={styles.resultValue}>
                    {Array.isArray(v) ? v.join(", ") : String(v)}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply this rule →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { alignItems: "center", marginBottom: 24, marginTop: 8 },
  aiIcon: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: "#EFF4FF",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#1C1C1A", marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#7A7870", textAlign: "center", lineHeight: 19 },

  inputCard: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: "#F0EDE6",
  },
  inputLabel: {
    fontSize: 11, fontWeight: "700", color: "#9E9C96",
    marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F5F3EE", borderRadius: 12,
    padding: 14, fontSize: 14, color: "#1C1C1A",
    minHeight: 100, textAlignVertical: "top",
    marginBottom: 16,
  },
  exampleLabel: {
    fontSize: 11, fontWeight: "600", color: "#B4B2A9",
    marginBottom: 8, textTransform: "uppercase",
  },
  examples: { gap: 8 },
  exampleChip: {
    backgroundColor: "#F5F3EE", borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: "#EBE8E2",
  },
  exampleText: { fontSize: 12, color: "#5F5E5A", lineHeight: 17 },

  analyzeBtn: {
    backgroundColor: "#1565C0", borderRadius: 14,
    paddingVertical: 15, alignItems: "center",
    marginBottom: 14,
    shadowColor: "#1565C0", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  analyzeBtnDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
  analyzeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  errorBanner: {
    backgroundColor: "#FFF3E0", borderRadius: 10,
    padding: 12, marginBottom: 14,
  },
  errorText: { fontSize: 12, color: "#E65100" },

  resultCard: {
    backgroundColor: "#E8F5E9", borderRadius: 16,
    padding: 16,
  },
  resultTitle: { fontSize: 15, fontWeight: "700", color: "#1B5E20", marginBottom: 14 },
  resultRows: { gap: 10, marginBottom: 16 },
  resultRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FAF1", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  resultKey: { fontSize: 12, color: "#388E3C", fontWeight: "600" },
  resultValue: { fontSize: 12, color: "#1B5E20", fontWeight: "700", maxWidth: "55%", textAlign: "right" },
  applyBtn: {
    backgroundColor: "#2E7D32", borderRadius: 12,
    paddingVertical: 13, alignItems: "center",
  },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
