import { supabase } from "../services/supabaseClient";
import {
  ScrollView, TouchableOpacity, Text, View,
  Switch, ActivityIndicator, Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

export default function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setProducts([]); return; }

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (!merchant) { setProducts([]); return; }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data ?? []);
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = async (id: string, current: boolean) => {
    await supabase.from("products").update({ in_stock: !current }).eq("id", id);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E65100" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate("AddProduct")}
        style={{
          backgroundColor: "#E65100", borderRadius: 12,
          paddingVertical: 12, alignItems: "center", marginBottom: 16,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>+ Add product</Text>
      </TouchableOpacity>

      {products.length === 0 ? (
        <View style={{
          alignItems: "center", paddingVertical: 32,
          backgroundColor: "#F1EFE8", borderRadius: 12,
        }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📦</Text>
          <Text style={{ fontSize: 13, color: "#888" }}>No products yet</Text>
        </View>
      ) : (
        products.map((p) => (
          <View
            key={p.id}
            style={{
              backgroundColor: "#fff", borderRadius: 12, padding: 14,
              marginBottom: 10, borderWidth: 1, borderColor: "#F1EFE8",
              flexDirection: "row", alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#2C2C2A" }}>{p.name}</Text>
              <Text style={{ fontSize: 12, color: "#888" }}>€{p.price} · {p.category}</Text>
            </View>
            <Switch
              value={p.in_stock}
              onValueChange={() => toggleStock(p.id, p.in_stock)}
              trackColor={{ true: "#4CAF50", false: "#D3D1C7" }}
            />
            <TouchableOpacity onPress={() => deleteProduct(p.id)} style={{ marginLeft: 10 }}>
              <Text style={{ color: "#C62828", fontSize: 12 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}
