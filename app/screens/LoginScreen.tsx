import { supabase } from "../services/supabaseClient";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert("Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigation.replace("Home");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#FAFAF8" }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8, color: "#2C2C2A" }}>
        City Wallet
      </Text>
      <Text style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>
        {isSignUp ? "Create your account" : "Sign in to continue"}
      </Text>

      <TextInput
        value={email} onChangeText={setEmail}
        placeholder="Email" keyboardType="email-address"
        autoCapitalize="none"
        style={{ backgroundColor: "#F1EFE8", borderRadius: 10, padding: 14,
          fontSize: 14, marginBottom: 12, color: "#2C2C2A" }}
      />
      <TextInput
        value={password} onChangeText={setPassword}
        placeholder="Password" secureTextEntry
        style={{ backgroundColor: "#F1EFE8", borderRadius: 10, padding: 14,
          fontSize: 14, marginBottom: 20, color: "#2C2C2A" }}
      />

      <TouchableOpacity
        onPress={handleAuth} disabled={loading}
        style={{ backgroundColor: "#E65100", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 16, alignItems: "center" }}>
        <Text style={{ color: "#888", fontSize: 13 }}>
          {isSignUp ? "Already have an account? Sign in" : "No account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}