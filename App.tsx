import { useEffect } from 'react'; // N'oublie pas l'import !
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { testSupabase, testWeather } from './app/tests/testSupabase'; // Ton import de test

export default function App() {
  
  useEffect(() => {
    testSupabase();
    testWeather();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>City Wallet en cours... 🏙️</Text>
      <Text>Regarde ta console pour les marchands !</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});