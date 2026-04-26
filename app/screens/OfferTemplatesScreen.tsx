import {
  View, Text, ScrollView,
  TouchableOpacity, TextInput,
  Alert, ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

interface Template {
  id: string;
  name: string;
  max_discount_pct: number;
  trigger_time_start: string;
  trigger_time_end: string;
  trigger_weather: string[];
  trigger_payone_threshold: number;
  product_id?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  in_stock: boolean;
}

export default function OfferTemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // ── Fetch templates + products ──────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: tmplData }, { data: prodData }] = await Promise.all([
        supabase.from("offer_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").eq("in_stock", true),
      ]);
      setTemplates(tmplData ?? []);
      setProducts(prodData ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Create a template from current merchant_rules ───────────
  const createTemplate = async () => {
    if (!newTemplateName.trim()) {
      Alert.alert("Name required", "Give your template a name before saving.");
      return;
    }
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: merchant } = await supabase
        .from("merchants").select("id").eq("owner_id", user.id).single();
      if (!merchant) throw new Error("No merchant linked to this account");

      // Load current active rule as the template base
      const { data: rule } = await supabase
        .from("merchant_rules")
        .select("*")
        .eq("merchant_id", merchant.id)
        .eq("active", true)
        .single();

      await supabase.from("offer_templates").insert({
        merchant_id: merchant.id,
        name: newTemplateName.trim(),
        max_discount_pct: rule?.max_discount_pct ?? 20,
        trigger_time_start: rule?.trigger_time_start ?? "11:00",
        trigger_time_end: rule?.trigger_time_end ?? "17:00",
        trigger_weather: rule?.trigger_weather ?? ["cold", "rain"],
        trigger_payone_threshold: rule?.trigger_payone_threshold ?? 35,
        product_id: selectedProductId ?? null,
      });

      setNewTemplateName("");
      setSelectedProductId(null);
      fetchData();
      Alert.alert("Saved", "Template created from your current rule.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Apply a template → creates a new merchant_rule ──────────
  // THIS is where applyTemplate is called — from the "Apply" button on each card
  const applyTemplate = async (templateId: string, productId: string) => {
    setApplyingId(templateId);
    try {
      const { data: tmpl } = await supabase
        .from("offer_templates").select("*").eq("id", templateId).single();

      if (!tmpl) throw new Error("Template not found");

      // Deactivate existing rules first
      await supabase
        .from("merchant_rules")
        .update({ active: false })
        .eq("merchant_id", tmpl.merchant_id);

      // Insert new rule from template
      await supabase.from("merchant_rules").insert({
        merchant_id: tmpl.merchant_id,
        max_discount_pct: tmpl.max_discount_pct,
        trigger_weather: tmpl.trigger_weather,
        trigger_time_start: tmpl.trigger_time_start,
        trigger_time_end: tmpl.trigger_time_end,
        trigger_payone_threshold: tmpl.trigger_payone_threshold,
        product_id: productId,
        active: true,
      });

      Alert.alert("Applied", `Template "${tmpl.name}" is now active.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setApplyingId(null);
    }
  };

  // ── Delete a template ────────────────────────────────────────
  const deleteTemplate = async (id: string) => {
    Alert.alert("Delete template", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await supabase.from("offer_templates").delete().eq("id", id);
          fetchData();
        },
      },
    ]);
  };

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
      {/* ── Create new template ── */}
      <View style={{
        backgroundColor: "#fff", borderRadius: 14,
        padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: "#F1EFE8",
      }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 12 }}>
          💾 Save current rule as template
        </Text>

        <TextInput
          value={newTemplateName}
          onChangeText={setNewTemplateName}
          placeholder='e.g. "Quiet afternoon coffee"'
          placeholderTextColor="#B4B2A9"
          style={{
            backgroundColor: "#F1EFE8", borderRadius: 8,
            padding: 12, fontSize: 13, color: "#2C2C2A",
            marginBottom: 10,
          }}
        />

        {/* Optional: link to a product */}
        <Text style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
          Link to a product (optional)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setSelectedProductId(null)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 20, marginRight: 8,
              backgroundColor: !selectedProductId ? "#E65100" : "#F1EFE8",
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: "600",
              color: !selectedProductId ? "#fff" : "#5F5E5A",
            }}>
              None
            </Text>
          </TouchableOpacity>
          {products.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setSelectedProductId(p.id)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 20, marginRight: 8,
                backgroundColor: selectedProductId === p.id ? "#E65100" : "#F1EFE8",
              }}
            >
              <Text style={{
                fontSize: 12, fontWeight: "600",
                color: selectedProductId === p.id ? "#fff" : "#5F5E5A",
              }}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={createTemplate}
          disabled={creating}
          style={{
            backgroundColor: creating ? "#B4B2A9" : "#E65100",
            borderRadius: 10, paddingVertical: 12, alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
            {creating ? "Saving..." : "Save as template"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Templates list ── */}
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 10 }}>
        Saved templates ({templates.length})
      </Text>

      {templates.length === 0 ? (
        <View style={{
          alignItems: "center", paddingVertical: 32,
          backgroundColor: "#F1EFE8", borderRadius: 12,
        }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
          <Text style={{ fontSize: 13, color: "#888" }}>No templates yet</Text>
          <Text style={{ fontSize: 11, color: "#B4B2A9", marginTop: 4 }}>
            Save your current rule above to reuse it
          </Text>
        </View>
      ) : (
        templates.map(tmpl => (
          <View key={tmpl.id} style={{
            backgroundColor: "#fff", borderRadius: 12,
            padding: 14, marginBottom: 10,
            borderWidth: 1, borderColor: "#F1EFE8",
          }}>
            {/* Template name */}
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 6 }}>
              {tmpl.name}
            </Text>

            {/* Template params */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              <View style={{ backgroundColor: "#FFF3E0", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: "#E65100", fontWeight: "600" }}>
                  max {tmpl.max_discount_pct}%
                </Text>
              </View>
              <View style={{ backgroundColor: "#E3F2FD", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: "#1565C0", fontWeight: "600" }}>
                  {tmpl.trigger_time_start} – {tmpl.trigger_time_end}
                </Text>
              </View>
              {tmpl.trigger_weather.map(w => (
                <View key={w} style={{ backgroundColor: "#E8F5E9", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, color: "#2E7D32", fontWeight: "600" }}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Apply + Delete */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* Apply to first available product if none linked */}
              <TouchableOpacity
                onPress={() => applyTemplate(
                  tmpl.id,
                  tmpl.product_id ?? products[0]?.id ?? ""
                )}
                disabled={applyingId === tmpl.id}
                style={{
                  flex: 1, backgroundColor: applyingId === tmpl.id ? "#B4B2A9" : "#2E7D32",
                  borderRadius: 8, paddingVertical: 8, alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                  {applyingId === tmpl.id ? "Applying..." : "▶ Apply"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteTemplate(tmpl.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8,
                  backgroundColor: "#FFEBEE", borderRadius: 8, alignItems: "center",
                }}
              >
                <Text style={{ color: "#C62828", fontWeight: "600", fontSize: 12 }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}