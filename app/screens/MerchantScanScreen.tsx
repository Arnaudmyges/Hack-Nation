import {
  View, Text, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator
} from "react-native";
import { useState } from "react";
import { validateToken } from "../services/checkoutService";

type ValidationResult =
  | { valid: true; discount_pct: number; merchant_name: string; headline: string }
  | { valid: false; reason: string };

export default function MerchantScanScreen() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await validateToken(token.trim());
      setResult(res as ValidationResult);
    } catch (e: any) {
      setResult({ valid: false, reason: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setToken("");
    setResult(null);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 24 }}
    >
      <Text style={{ fontSize: 13, color: "#888", marginBottom: 24, textAlign: "center" }}>
        Validation Terminal — Merchant View
      </Text>

      {/* Manual token input */}
      <View style={{
        backgroundColor: "#F1EFE8", borderRadius: 14,
        padding: 16, marginBottom: 16,
      }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#5F5E5A", marginBottom: 8 }}>
          Enter token manually
        </Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="e.g.: cw_X4K9ZM2QR"
          placeholderTextColor="#B4B2A9"
          style={{
            backgroundColor: "#fff", borderRadius: 8,
            padding: 12, fontSize: 14,
            color: "#2C2C2A", fontFamily: "monospace",
            borderWidth: 1, borderColor: "#D3D1C7",
          }}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      {/* Validate button */}
      <TouchableOpacity
        onPress={handleValidate}
        disabled={loading || !token.trim()}
        style={{
          backgroundColor: token.trim() ? "#2E7D32" : "#B4B2A9",
          borderRadius: 14, paddingVertical: 14,
          alignItems: "center", marginBottom: 16,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            ✓ Validate Token
          </Text>
        )}
      </TouchableOpacity>

      {/* Validation Result */}
      {result && (
        <View style={{
          padding: 20, borderRadius: 16,
          backgroundColor: result.valid ? "#E8F5E9" : "#FFEBEE",
          marginBottom: 16,
          alignItems: "center",
        }}>
          {result.valid ? (
            <>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>✅</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#1B5E20" }}>
                Discount Validated!
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "900", color: "#2E7D32", marginTop: 8 }}>
                −{result.discount_pct}%
              </Text>
              <Text style={{ fontSize: 14, color: "#2E7D32", marginTop: 4 }}>
                {result.merchant_name}
              </Text>
              <Text style={{ fontSize: 12, color: "#4CAF50", marginTop: 4, textAlign: "center" }}>
                {result.headline}
              </Text>
              <View style={{
                marginTop: 16, padding: 12,
                backgroundColor: "#C8E6C9", borderRadius: 10,
                width: "100%",
              }}>
                <Text style={{ fontSize: 13, color: "#1B5E20", fontWeight: "600", textAlign: "center" }}>
                  Simulated Transaction
                </Text>
                <Text style={{ fontSize: 12, color: "#388E3C", textAlign: "center", marginTop: 4 }}>
                  Regular price: €8.50 → Discounted: {(8.50 * (1 - result.discount_pct / 100)).toFixed(2)}€
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>❌</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#B71C1C" }}>
                Invalid Token
              </Text>
              <Text style={{ fontSize: 13, color: "#C62828", marginTop: 4, textAlign: "center" }}>
                {result.reason}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Reset button */}
      {result && (
        <TouchableOpacity
          onPress={handleReset}
          style={{
            padding: 12, alignItems: "center",
            backgroundColor: "#F1EFE8", borderRadius: 10,
          }}
        >
          <Text style={{ color: "#5F5E5A", fontWeight: "600" }}>
            ↺ New Scan
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}