import { View, Text } from "react-native";

export default function MerchantScanScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAF8" }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>📷</Text>
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#2C2C2A" }}>Terminal marchand</Text>
      <Text style={{ fontSize: 13, color: "#888", marginTop: 8 }}>Scan QR — Sprint 5</Text>
    </View>
  );
}