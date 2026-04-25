import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from './lib/supabase'; // Assure-toi que ce fichier existe

export default function App() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMerchants() {
      // Module 01 : Récupération des marchands pour le Context Sensing 
      const { data, error } = await supabase
        .from('merchants')
        .select('*');
      
      if (error) console.error("Erreur Supabase :", error.message);
      else setMerchants(data || []);
      setIsLoading(false);
    }

    fetchMerchants();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>City Wallet 🏙️</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#ff0000" />
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.subtitle}>Marchands à proximité :</Text>
          <FlatList
            data={merchants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.merchantName}>{item.name}</Text>
                <Text style={styles.category}>{item.category} • {item.address}</Text>
              </View>
            )}
          />
        </View>
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
  },
  category: {
    color: '#888',
    marginTop: 4,
  },
});