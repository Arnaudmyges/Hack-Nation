import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "../services/supabaseClient";

const CATEGORIES = ["cafe", "bakery", "retail", "restaurant"];

export default function AddProductScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("cafe");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: merchant } = await supabase
        .from("merchants").select("id").eq("owner_id", user.id).single();
      if (!merchant) throw new Error("No merchant linked");

      const { error } = await supabase.from("products").insert({
        merchant_id: merchant.id,
        name: name.trim(),
        price: parseFloat(price),
        category,
        in_stock: true,
      });
      if (error) throw error;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 16 }}>
        New product
      </Text>

      <TextInput value={name} onChangeText={setName} placeholder="Product name"
        placeholderTextColor="#B4B2A9"
        style={{ backgroundColor: "#F1EFE8", borderRadius: 10, padding: 12,
          fontSize: 14, color: "#2C2C2A", marginBottom: 12 }} />

      <TextInput value={price} onChangeText={setPrice} placeholder="Price (e.g. 3.50)"
        keyboardType="decimal-pad" placeholderTextColor="#B4B2A9"
        style={{ backgroundColor: "#F1EFE8", borderRadius: 10, padding: 12,
          fontSize: 14, color: "#2C2C2A", marginBottom: 12 }} />

      <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Category</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: category === c ? "#E65100" : "#F1EFE8" }}>
            <Text style={{ fontSize: 13, fontWeight: "600",
              color: category === c ? "#fff" : "#5F5E5A" }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleAdd} disabled={saving || !name.trim() || !price}
        style={{ backgroundColor: saving ? "#B4B2A9" : "#E65100",
          borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {saving ? "Saving..." : "Add product"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}