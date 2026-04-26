import {
  View, Text, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, Modal
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabaseClient";

interface Product {
  id: string;
  name: string;
  category: string;
}

interface Template {
  id: string;
  name: string;
  product_id: string | null;
}

export default function ProductAssociationScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gestion de la modale d'association
  const [modalVisible, setModalVisible] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchant } = await supabase
        .from("merchants").select("id").eq("owner_id", user.id).maybeSingle();
      
      if (!merchant) return;

      const [{ data: prodData }, { data: tmplData }] = await Promise.all([
        supabase.from("products").select("*").eq("merchant_id", merchant.id),
        supabase.from("offer_templates").select("*").eq("merchant_id", merchant.id).order("created_at", { ascending: false }),
      ]);

      setProducts(prodData ?? []);
      setTemplates(tmplData ?? []);
    } catch (e: any) {
      Alert.alert("Erreur de chargement", e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const openLinkModal = (productId: string) => {
    setActiveProductId(productId);
    setModalVisible(true);
  };

  const toggleTemplateLink = async (template: Template) => {
    if (!activeProductId) return;

    // Si le template est déjà lié à CE produit, on le détache (null). Sinon on l'attache à CE produit.
    const isLinkedToCurrent = template.product_id === activeProductId;
    const newProductId = isLinkedToCurrent ? null : activeProductId;

    try {
      const { error } = await supabase
        .from("offer_templates")
        .update({ product_id: newProductId })
        .eq("id", template.id);

      if (error) throw error;
      
      // Mise à jour de l'UI localement sans recharger toute la base de données
      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, product_id: newProductId } : t));
      
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const unlinkTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("offer_templates")
        .update({ product_id: null })
        .eq("id", templateId);

      if (error) throw error;
      
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, product_id: null } : t));
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E65100" />
      </View>
    );
  }

  const activeProduct = products.find(p => p.id === activeProductId);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        
        <View style={styles.headerBox}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 4 }}>
            🔗 Association Produits & Templates
          </Text>
          <Text style={{ fontSize: 12, color: "#888" }}>
            Liez vos templates d'offres à vos produits. Un produit peut déclencher plusieurs templates en fonction des règles météo ou horaires.
          </Text>
        </View>

        {products.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>Aucun produit trouvé.</Text>
        ) : (
          products.map(product => {
            const linkedTemplates = templates.filter(t => t.product_id === product.id);

            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: "#2C2C2A" }}>{product.name}</Text>
                    <Text style={{ fontSize: 11, color: "#888" }}>{product.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => openLinkModal(product.id)} style={styles.addBtn}>
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>+ Ajouter un template</Text>
                  </TouchableOpacity>
                </View>

                {linkedTemplates.length === 0 ? (
                  <Text style={{ fontSize: 12, color: "#B4B2A9", fontStyle: "italic", marginTop: 10 }}>
                    Aucun template associé à ce produit.
                  </Text>
                ) : (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    {linkedTemplates.map(tmpl => (
                      <View key={tmpl.id} style={styles.templateRow}>
                        <Text style={{ fontSize: 13, color: "#5F5E5A", flex: 1 }}>{tmpl.name}</Text>
                        <TouchableOpacity onPress={() => unlinkTemplate(tmpl.id)} style={styles.unlinkBtn}>
                          <Text style={{ color: "#C62828", fontSize: 11, fontWeight: "600" }}>Retirer</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODALE D'ASSOCIATION DE TEMPLATES */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
              Templates pour {activeProduct?.name}
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {templates.length === 0 ? (
                <Text style={{ color: "#888", textAlign: "center", padding: 20 }}>Aucun template créé.</Text>
              ) : (
                templates.map(tmpl => {
                  const isLinkedToCurrent = tmpl.product_id === activeProductId;
                  const isLinkedToOther = tmpl.product_id && tmpl.product_id !== activeProductId;

                  return (
                    <TouchableOpacity 
                      key={tmpl.id} 
                      onPress={() => toggleTemplateLink(tmpl)}
                      style={[
                        styles.modalTemplateRow,
                        isLinkedToCurrent && { borderColor: "#2E7D32", backgroundColor: "#E8F5E9" }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "600", color: isLinkedToCurrent ? "#2E7D32" : "#2C2C2A" }}>
                          {tmpl.name}
                        </Text>
                        {isLinkedToOther && (
                          <Text style={{ fontSize: 10, color: "#E65100", marginTop: 2 }}>
                            ⚠️ Déjà lié à un autre produit
                          </Text>
                        )}
                      </View>
                      
                      <View style={[styles.checkbox, isLinkedToCurrent && styles.checkboxActive]}>
                        {isLinkedToCurrent && <Text style={{ color: "#fff", fontSize: 10 }}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Terminer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1EFE8",
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1EFE8",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1EFE8",
    paddingBottom: 10,
  },
  addBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EFE8",
    padding: 10,
    borderRadius: 8,
  },
  unlinkBtn: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTemplateRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1EFE8",
    borderRadius: 10,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D3D1C7",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  closeBtn: {
    backgroundColor: "#2C2C2A",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  }
});