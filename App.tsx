import "./global.css";
import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { setupPushNotifications } from "./app/services/pushService";
import HomeScreen from "./app/screens/HomeScreen";
import WalletScreen from "./app/screens/WalletScreen";
import MerchantDashboard from "./app/screens/MerchantDashboard";
import MerchantScanScreen from "./app/screens/MerchantScanScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    setupPushNotifications();
  }, []);

  return (
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
  );
}