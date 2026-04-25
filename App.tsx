import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Tes imports de tests
import { testSupabase, testWeather } from './app/tests/testSupabase';
import { testFallback, testOllamaParsing } from './app/tests/testOllama';

// Tes écrans
import HomeScreen from "./app/screens/HomeScreen";
import WalletScreen from "./app/screens/WalletScreen";
import MerchantDashboard from "./app/screens/MerchantDashboard";
import MerchantScanScreen from "./app/screens/MerchantScanScreen";

// Import CSS/Global si nécessaire
import "./global.css";

const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#FAFAF8" },
          headerTintColor: "#2C2C2A",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: "City Wallet" }} 
        />
        <Stack.Screen 
          name="Wallet" 
          component={WalletScreen} 
          options={{ title: "Mon Wallet" }} 
        />
        <Stack.Screen 
          name="MerchantDashboard" 
          component={MerchantDashboard} 
          options={{ title: "Dashboard Karl" }} 
        />
        <Stack.Screen 
          name="MerchantScan" 
          component={MerchantScanScreen} 
          options={{ title: "Terminal" }} 
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

// Les styles ne sont plus vraiment nécessaires ici car la navigation gère l'affichage,
// mais on peut les garder pour référence.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});