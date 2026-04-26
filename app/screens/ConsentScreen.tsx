import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { supabase } from "../services/supabaseClient";

export default function ConsentScreen({ navigation }: any) {
  const handleAccept = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id, role: "customer",
        display_name: user.email?.split("@")[0] ?? "User",
      });
    }
    navigation.replace("Home");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#2C2C2A", marginBottom: 8 }}>
        Your privacy matters
      </Text>
      <Text style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Before we start, here is exactly how City Wallet uses your data.
      </Text>

      {[
        { icon: "✅", title: "What stays on your device", detail: "Your precise GPS location, movement patterns, and browsing behavior never leave your phone." },
        { icon: "✅", title: "What the AI sees", detail: "Only an abstract signal: {weather: cold, category: cafe}. No name, no address, no identity." },
        { icon: "✅", title: "What we store", detail: "Anonymized offer metadata and your cashback balance. Never your location history." },
        { icon: "❌", title: "What we never do", detail: "We never sell your data, show ads, or share your profile with third parties." },
      ].map((item, i) => (
        <View key={i} style={{ backgroundColor: i < 3 ? "#E8F5E9" : "#FFEBEE",
          borderRadius: 10, padding: 14, marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#2C2C2A", marginBottom: 4 }}>
            {item.icon} {item.title}
          </Text>
          <Text style={{ fontSize: 12, color: "#5F5E5A" }}>{item.detail}</Text>
        </View>
      ))}

      <TouchableOpacity onPress={handleAccept}
        style={{ backgroundColor: "#E65100", borderRadius: 12, paddingVertical: 14,
          alignItems: "center", marginTop: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          I understand — let's go
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}