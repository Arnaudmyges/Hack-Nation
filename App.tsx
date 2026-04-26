import "./global.css";
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

// --- IMPORT SUPABASE ---
import { supabase } from "./app/services/supabaseClient";

// --- IMPORT SERVICES ---
import { setupPushNotifications } from "./app/services/pushService";

// --- IMPORT ECRANS (AUTH & CONSENT) ---
import LoginScreen from "./app/screens/auth/LoginScreen";
import ConsentScreen from "./app/screens/ConsentScreen";

// --- IMPORT ECRANS (USER JOURNEY - PERSON A) ---
import HomeScreen from "./app/screens/HomeScreen";
import WalletScreen from "./app/screens/WalletScreen";
// import DemoNarrativeScreen from "./app/screens/DemoNarrativeScreen";

// --- IMPORT ECRANS (MERCHANT PLATFORM - PERSON B) ---
import MerchantDashboard from "./app/screens/MerchantDashboard";
import MerchantScanScreen from "./app/screens/MerchantScanScreen";
import MerchantRuleScreen from "./app/screens/MerchantRuleScreen";
import OfferTemplatesScreen from "./app/screens/OfferTemplatesScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialisation des notifications
    setupPushNotifications();

    // 1. Vérifier la session au lancement (récupérée via AsyncStorage dans le client)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();

    // 2. Écouter les changements d'état d'authentification (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Écran de chargement pendant que Supabase vérifie le token
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAF8" }}>
        <ActivityIndicator size="large" color="#E65100" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#FAFAF8" },
          headerTintColor: "#2C2C2A",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        {/* CONDITION D'ACCÈS : Si pas de session, on force le Login */}
        {!session ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          /* SI CONNECTÉ : Accès à toute l'application */
          <>
            {/* Écran de consentement RGPD (Étape A2) */}
            <Stack.Screen
              name="Consent"
              component={ConsentScreen}
              options={{ title: "Privacy Consent", headerShown: false }}
            />

            {/* Accueil */}
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "City Wallet" }}
            />

            {/* Wallet & QR Code (Étape A3) */}
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{ title: "My Wallet" }}
            />

            {/* --- SECTION MARCHAND --- */}
            <Stack.Screen
              name="MerchantDashboard"
              component={MerchantDashboard}
              options={{ title: "Karl's Dashboard" }}
            />
            <Stack.Screen
              name="MerchantScan"
              component={MerchantScanScreen}
              options={{ title: "Merchant Terminal" }}
            />
            <Stack.Screen
              name="MerchantRule"
              component={MerchantRuleScreen}
              options={{ title: "Rule Config" }}
            />
            <Stack.Screen
              name="OfferTemplates"
              component={OfferTemplatesScreen}
              options={{ title: "Offer Templates" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}