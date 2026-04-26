import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../services/supabaseClient';
import WalletHistoryScreen from './WalletHistoryScreen';

export default function AccountScreen() {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [declinedOffers, setDeclinedOffers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfileAndPreferences();
  }, []);
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erreur déconnexion:", error.message);
  };
  async function fetchProfileAndPreferences() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single();
      if (profile) setDisplayName(profile.display_name);

      const { data: offers } = await supabase
        .from('offers')
        .select('id, headline')
        .eq('status', 'declined')
        .eq('user_id', session.user.id);

      setDeclinedOffers(offers || []);
    } catch (error) {
      console.error("Erreur fetch:", error);
    } finally {
      setLoading(false);
    }
  }

  async function removePreference(offerId: string) {
    const { error } = await supabase
      .from('offers')
      .update({ status: 'expired' })
      .eq('id', offerId);

    if (!error) {
      setDeclinedOffers(prev => prev.filter(o => o.id !== offerId));
    } else {
      Alert.alert("Erreur", "Impossible de supprimer cette préférence.");
    }
  }

  async function updateProfile() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', session?.user.id);

    setSaving(false);
    if (!error) Alert.alert("Succès", "Profil mis à jour !");
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} color="#E65100" />;

  return (
    <ScrollView style={styles.container}>
      {/* SECTION PROFIL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Mon Profil</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Ton nom d'affichage"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={updateProfile} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? "Enregistrement..." : "Mettre à jour mon nom"}</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION PRÉFÉRENCES (REFUS) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚫 Mes préférences (Offres refusées)</Text>
        <Text style={styles.infoText}>Mia ne vous proposera plus ces offres.</Text>
        
        {declinedOffers.length === 0 ? (
          <Text style={styles.emptyText}>Aucun refus enregistré.</Text>
        ) : (
          declinedOffers.map((off) => (
            <View key={off.id} style={styles.declinedItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.declinedText}>{off.headline}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => removePreference(off.id)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* SECTION CASHBACK (WALLET) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Mon Cashback</Text>
        <WalletHistoryScreen />
      </View>

      {/* SECTION LOGOUT */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F3', padding: 16 },
  section: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 12, color: '#2C2C2A' },
  input: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  saveBtn: { backgroundColor: '#E65100', borderRadius: 8, padding: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
  infoText: { fontSize: 12, color: '#8E8E93', marginBottom: 15 },
  declinedItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F2' 
  },
  declinedText: { fontSize: 14, color: '#2C2C2A', fontWeight: '500' },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#FFEBEE' },
  deleteBtnText: { color: '#C62828', fontSize: 11, fontWeight: '700' },
  emptyText: { color: '#ADADAD', fontStyle: 'italic', textAlign: 'center', padding: 10 },
  logoutBtn: { backgroundColor: '#E65100', borderRadius: 8, padding: 12, alignItems: 'center' },
  logoutBtnText: { color: '#FFF', fontWeight: 'bold' }
});