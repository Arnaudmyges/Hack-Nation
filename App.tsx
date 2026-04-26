import "./global.css";
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { supabase } from "./app/services/supabaseClient";
import { setupPushNotifications } from "./app/services/pushService";

import LoginScreen from "./app/screens/auth/LoginScreen";
import ConsentScreen from "./app/screens/ConsentScreen";
import ClientNavigator from "./app/screens/ClientNavigator";
import WalletScreen from "./app/screens/WalletScreen";
import MerchantDashboard from "./app/screens/MerchantDashboard";
import MerchantScanScreen from "./app/screens/MerchantScanScreen";
import MerchantRuleScreen from "./app/screens/MerchantRuleScreen";
import OfferTemplatesScreen from "./app/screens/OfferTemplatesScreen";
import GoalPromptScreen from "./app/screens/GoalPromptScreen";
import ProductsScreen from "./app/screens/ProductsScreen";
import AddProductScreen from "./app/screens/AddProductScreen";
import ProductAssociationScreen from "./app/screens/ProductAssociationScreen";

const Stack = createNativeStackNavigator();

const HEADER = {
  headerStyle: { backgroundColor: "#FAFAF8" },
  headerTintColor: "#1C1C1A",
  headerTitleStyle: { fontWeight: "700" as const },
  headerShadowVisible: false,
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [userRole, setUserRole] = useState<"customer" | "merchant">("customer");

  useEffect(() => {
    // Push setup is best-effort — never block app startup on it
    setupPushNotifications().catch(() => {});

    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s?.user) {
          await loadProfile(s.user.id);
        }
      } catch (e) {
        // getSession failed (expired token, network, etc.) → show Login
        console.warn("Session init failed:", e);
      } finally {
        // Always dismiss the loading screen, no matter what
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        if (s?.user) {
          await loadProfile(s.user.id).catch(() => {});
        } else {
          setHasConsent(false);
          setUserRole("customer");
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", userId)
      .single();

    setHasConsent(!!data?.display_name);
    setUserRole((data?.role as "customer" | "merchant") ?? "customer");
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAF8" }}>
        <ActivityIndicator size="large" color="#E65100" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={HEADER}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : !hasConsent ? (
          <Stack.Screen name="Consent" component={ConsentScreen} options={{ headerShown: false }} />
        ) : userRole === "merchant" ? (
          <>
            <Stack.Screen name="MerchantDashboard" component={MerchantDashboard} options={{ headerShown: false }} />
            <Stack.Screen name="MerchantScan" component={MerchantScanScreen} options={{ title: "Merchant Terminal" }} />
            <Stack.Screen name="MerchantRule" component={MerchantRuleScreen} options={{ title: "Rule Config" }} />
            <Stack.Screen name="OfferTemplates" component={OfferTemplatesScreen} options={{ title: "Offer Templates" }} />
            <Stack.Screen name="GoalPrompt" component={GoalPromptScreen} options={{ title: "Set goal" }} />
            <Stack.Screen name="Products" component={ProductsScreen} options={{ title: "Products" }} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: "Add product" }} />
            <Stack.Screen name="ProductAssociation" component={ProductAssociationScreen} options={{ title: "Link templates" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="ClientMain" component={ClientNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: "My Offer" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
