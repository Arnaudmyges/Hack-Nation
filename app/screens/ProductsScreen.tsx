import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { ScrollView, TouchableOpacity, Text, View, Switch } from "react-native";

export default function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts(data ?? []);
  };

  const toggleStock = async (id: string, current: boolean) => {
    await supabase.from("products").update({ in_stock: !current }).eq("id", id);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate("AddProduct")}
        style={{ backgroundColor: "#E65100", borderRadius: 12, paddingVertical: 12,
          alignItems: "center", marginBottom: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>+ Add product</Text>
      </TouchableOpacity>

      {products.map(p => (
        <View key={p.id} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 14,
          marginBottom: 10, borderWidth: 1, borderColor: "#F1EFE8",
          flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#2C2C2A" }}>{p.name}</Text>
            <Text style={{ fontSize: 12, color: "#888" }}>€{p.price} · {p.category}</Text>
          </View>
          <Switch value={p.in_stock} onValueChange={() => toggleStock(p.id, p.in_stock)}
            trackColor={{ true: "#4CAF50", false: "#D3D1C7" }} />
          <TouchableOpacity onPress={() => deleteProduct(p.id)} style={{ marginLeft: 10 }}>
            <Text style={{ color: "#C62828", fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}