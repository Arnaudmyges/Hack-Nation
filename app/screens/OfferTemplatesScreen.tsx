import {
  View, Text, ScrollView,
  TouchableOpacity, TextInput,
  Alert, ActivityIndicator,
  StyleSheet,Platform
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabaseClient";

interface Template {
  id: string;
  name: string;
  max_discount_pct: number;
  trigger_time_start: string;
  trigger_time_end: string;
  trigger_weather: string[];
  trigger_payone_threshold: number;
}

export default function OfferTemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Champs du formulaire
  const [name, setName] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("20");
  const [timeStart, setTimeStart] = useState("11:00");
  const [timeEnd, setTimeEnd] = useState("17:00");
  const [threshold, setThreshold] = useState("35");
  const [selectedWeather, setSelectedWeather] = useState<string[]>(["rain", "cold"]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("offer_templates")
        .select("*")
        .order("created_at", { ascending: false });
      setTemplates(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const toggleWeather = (w: string) => {
    setSelectedWeather(prev => 
      prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
    );
  };

  const createTemplate = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom du template est obligatoire");
      return;
    }
    
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: merchant } = await supabase
        .from("merchants").select("id").eq("owner_id", user?.id).maybeSingle();

      if (!merchant) throw new Error("Marchand non trouvé");

      const { error } = await supabase.from("offer_templates").insert({
        merchant_id: merchant.id,
        name: name.trim(),
        max_discount_pct: Number(maxDiscount),
        trigger_time_start: timeStart,
        trigger_time_end: timeEnd,
        trigger_weather: selectedWeather,
        trigger_payone_threshold: Number(threshold),
      });

      if (error) throw error;

      setName("");
      fetchData();
      Alert.alert("Succès", "Template sauvegardé !");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setCreating(false);
    }
  };

  const performDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("offer_templates").delete().eq("id", id);
      
      if (error) {
        throw error;
      }

      // Mise à jour de l'affichage immédiatement
      setTemplates(prevTemplates => prevTemplates.filter(tmpl => tmpl.id !== id));
      
    } catch (e: any) {
      console.error("Erreur lors de la suppression:", e);
      if (Platform.OS !== "web") {
        Alert.alert("Erreur de suppression", e.message);
      } else {
        alert("Erreur de suppression : " + e.message);
      }
    }
  };

  // La fonction déclenchée par le bouton
  const deleteTemplate = (id: string) => {
    console.log("Demande de suppression pour l'ID :", id);

    if (Platform.OS === "web") {
      // Sur le web, on utilise la boîte de dialogue standard du navigateur
      const confirmDelete = window.confirm("Confirmer la suppression ?");
      if (confirmDelete) {
        performDelete(id);
      }
    } else {
      // Sur mobile, on utilise l'alerte native de React Native
      Alert.alert("Supprimer", "Confirmer la suppression ?", [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: () => performDelete(id)
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
         <ActivityIndicator color="#E65100" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FAFAF8" }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      
      {/* --- FORMULAIRE DE CRÉATION --- */}
      <View style={styles.formContainer}>
        <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12, color: "#2C2C2A" }}>🆕 Nouveau Template</Text>
        
        <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Nom du template</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Ex: Happy Hour Pluie" placeholderTextColor="#B4B2A9" style={styles.input} />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Remise Max (%)</Text>
            <TextInput value={maxDiscount} onChangeText={setMaxDiscount} keyboardType="numeric" style={styles.input} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Seuil Payone (%)</Text>
            <TextInput value={threshold} onChangeText={setThreshold} keyboardType="numeric" style={styles.input} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Heure de début</Text>
            <TextInput value={timeStart} onChangeText={setTimeStart} placeholder="11:00" placeholderTextColor="#B4B2A9" style={styles.input} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Heure de fin</Text>
            <TextInput value={timeEnd} onChangeText={setTimeEnd} placeholder="17:00" placeholderTextColor="#B4B2A9" style={styles.input} />
          </View>
        </View>

        <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Météo déclencheuse</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 15 }}>
          {["rain", "cold", "overcast", "sunny"].map(w => (
            <TouchableOpacity key={w} onPress={() => toggleWeather(w)} 
              style={[styles.badge, { backgroundColor: selectedWeather.includes(w) ? "#E65100" : "#F1EFE8" }]}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: selectedWeather.includes(w) ? "#fff" : "#5F5E5A" }}>{w}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={createTemplate} disabled={creating} style={styles.saveBtn}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{creating ? "Création..." : "Sauvegarder le template"}</Text>
        </TouchableOpacity>
      </View>

      {/* --- LISTE DES TEMPLATES --- */}
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#2C2C2A", marginBottom: 10 }}>Mes Templates ({templates.length})</Text>
      
      {templates.length === 0 ? (
         <View style={{ alignItems: "center", paddingVertical: 32, backgroundColor: "#F1EFE8", borderRadius: 12 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
            <Text style={{ fontSize: 13, color: "#888" }}>Aucun template pour le moment</Text>
         </View>
      ) : (
        templates.map(tmpl => (
          <View key={tmpl.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: "#2C2C2A", marginBottom: 4 }}>{tmpl.name}</Text>
              <Text style={{ fontSize: 11, color: "#888" }}>Max {tmpl.max_discount_pct}% • {tmpl.trigger_time_start}-{tmpl.trigger_time_end} • Trafic &lt;{tmpl.trigger_payone_threshold}%</Text>
              <View style={{ flexDirection: "row", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {tmpl.trigger_weather.map(w => (
                    <View key={w} style={{ backgroundColor: "#E8F5E9", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, color: "#2E7D32", fontWeight: "600" }}>{w}</Text>
                    </View>
                  ))}
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteTemplate(tmpl.id)} style={{ padding: 10, backgroundColor: "#FFEBEE", borderRadius: 8 }}>
              <Text style={{ color: "#C62828", fontSize: 12, fontWeight: "600" }}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// Les styles gérés correctement pour TypeScript
const styles = StyleSheet.create({
  formContainer: { 
    backgroundColor: "#fff", 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: "#F1EFE8" 
  },
  input: { 
    backgroundColor: "#F1EFE8", 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12, 
    fontSize: 13,
    color: "#2C2C2A"
  },
  badge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  saveBtn: { 
    backgroundColor: "#E65100", 
    borderRadius: 10, 
    paddingVertical: 14, 
    alignItems: "center" 
  },
  card: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 10, 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#F1EFE8" 
  }
});