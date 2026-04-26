import "./global.css";
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import ProductAssociationScreen from './app/screens/ProductAssociationScreen';
import WalletHistoryScreen from "./app/screens/WalletHistoryScreen";

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
import AccountScreen from './app/screens/AccountScreen';

// --- IMPORT ECRANS (MERCHANT PLATFORM - PERSON B) ---
import MerchantDashboard from "./app/screens/MerchantDashboard";
import MerchantScanScreen from "./app/screens/MerchantScanScreen";
import MerchantRuleScreen from "./app/screens/MerchantRuleScreen";
import OfferTemplatesScreen from "./app/screens/OfferTemplatesScreen";
import GoalPromptScreen from "./app/screens/GoalPromptScreen";
import ProductsScreen from "./app/screens/ProductsScreen";
import AddProductScreen from "./app/screens/AddProductScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    setupPushNotifications();

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", session.user.id)
          .single();
        setHasConsent(!!data?.display_name);
      }

      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        initialRouteName={!session ? "Login" : hasConsent ? "Home" : "Consent"}
        screenOptions={{
          headerStyle: { backgroundColor: "#FAFAF8" },
          headerTintColor: "#2C2C2A",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        {!session ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Consent"
              component={ConsentScreen}
              options={{ title: "Privacy Consent", headerShown: false }}
            />

            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "City Wallet" }}
            />

            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{ title: "My Wallet" }}
            />

            {/* ✅ Ajout de l'historique ici */}
            <Stack.Screen 
              name="WalletHistory" 
              component={WalletHistoryScreen} 
              options={{ title: "My Wallet" }} 
            />
            <Stack.Screen 
              name="Account" 
              component={AccountScreen} 
              options={{ title: "Mon Profil" }} 
            />
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
            <Stack.Screen 
              name="GoalPrompt" 
              component={GoalPromptScreen} 
              options={{ title: "Set goal" }} 
            />
            <Stack.Screen 
              name="Products" 
              component={ProductsScreen} 
              options={{ title: "Products" }} 
            />
            <Stack.Screen 
              name="AddProduct" 
              component={AddProductScreen} 
              options={{ title: "Add product" }} 
            />
            <Stack.Screen 
              name="ProductAssociation" 
              component={ProductAssociationScreen} 
              options={{ title: 'Associer les templates' }} // Titre optionnel pour le header
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}