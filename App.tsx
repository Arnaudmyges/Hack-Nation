import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { testSupabase, testWeather } from './app/tests/testSupabase';
import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./app/screens/HomeScreen";
import WalletScreen from "./app/screens/WalletScreen";
import MerchantDashboard from "./app/screens/MerchantDashboard";
import MerchantScanScreen from "./app/screens/MerchantScanScreen";

const Stack = createNativeStackNavigator();

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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#FAFAF8" },
          headerTintColor: "#2C2C2A",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "City Wallet" }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: "Mon Wallet" }} />
        <Stack.Screen name="MerchantDashboard" component={MerchantDashboard} options={{ title: "Dashboard Karl" }} />
        <Stack.Screen name="MerchantScan" component={MerchantScanScreen} options={{ title: "Terminal" }} />
      </Stack.Navigator>
    </NavigationContainer>
