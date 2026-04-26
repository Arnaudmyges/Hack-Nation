import { supabase } from "../../services/supabaseClient";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (loading) return;
    if (isSignUp && !displayName) return Alert.alert("Error", "Please enter your name");
    
    setLoading(true);
    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password 
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: authData.user.id, 
                display_name: displayName, 
                role: role,
                cashback_balance: 0 
              }
            ]);
          
          if (profileError) console.error("Profile creation error:", profileError.message);
          Alert.alert("Success", "Account created! You can now sign in.");
          setIsSignUp(false);
        }
      } else {
        // Simple Sign In
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#FAFAF8" }}>
      <Text style={{ fontSize: 32, fontWeight: "800", marginBottom: 8, color: "#2C2C2A" }}>
        City Wallet
      </Text>
      <Text style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>
        {isSignUp ? "Create your account" : "Sign in to continue"}
      </Text>

      {/* Champ Nom (uniquement pour Sign Up) */}
      {isSignUp && (
        <TextInput
          value={displayName} onChangeText={setDisplayName}
          placeholder="Your Full Name"
          style={styles.input}
        />
      )}

      <TextInput
        value={email} onChangeText={setEmail}
        placeholder="Email" keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      
      <TextInput
        value={password} onChangeText={setPassword}
        placeholder="Password" secureTextEntry
        style={styles.input}
      />

      {/* Sélecteur de Rôle (uniquement pour Sign Up) */}
      {isSignUp && (
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
          <TouchableOpacity 
            onPress={() => setRole('customer')}
            style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
          >
            <Text style={{ color: role === 'customer' ? '#FFF' : '#888', fontWeight: '600' }}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setRole('merchant')}
            style={[styles.roleBtn, role === 'merchant' && styles.roleBtnActive]}
          >
            <Text style={{ color: role === 'merchant' ? '#FFF' : '#888', fontWeight: '600' }}>Merchant</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={handleAuth} disabled={loading}
        style={{ backgroundColor: "#E65100", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            {isSignUp ? "Create account" : "Sign in"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={{ color: "#888", fontSize: 13 }}>
          {isSignUp ? "Already have an account? Sign in" : "No account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  input: { 
    backgroundColor: "#F1EFE8", borderRadius: 10, padding: 14,
    fontSize: 14, marginBottom: 12, color: "#2C2C2A" 
  },
  roleBtn: {
    flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#EEE'
  },
  roleBtnActive: {
    backgroundColor: '#2C2C2A'
  }
};