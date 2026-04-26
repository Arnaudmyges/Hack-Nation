import { supabase } from "../../services/supabaseClient";
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar, StyleSheet,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"customer" | "merchant">("customer");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Ces données seront lues par le trigger SQL ci-dessus
            data: {
              display_name: displayName,
              role: role,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          Alert.alert("Succès", "Compte créé ! Vérifiez vos emails ou connectez-vous.");
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoGlyph}>◈</Text>
          </View>
          <Text style={styles.heroTitle}>City Wallet</Text>
          <Text style={styles.heroSub}>Hyperpersonalized offers, in the moment</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isSignUp ? "Create account" : "Welcome back"}
          </Text>

          {isSignUp && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Your name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Mia Weber"
                placeholderTextColor="#B4B2A9"
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="mia@example.com"
              placeholderTextColor="#B4B2A9"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#B4B2A9"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {isSignUp && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>I am a</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  onPress={() => setRole("customer")}
                  style={[styles.roleBtn, role === "customer" && styles.roleBtnOn]}
                >
                  <Text style={styles.roleEmoji}>🛍</Text>
                  <Text style={[styles.roleTitle, role === "customer" && styles.roleTitleOn]}>
                    Customer
                  </Text>
                  <Text style={[styles.roleSub, role === "customer" && styles.roleSubOn]}>
                    Discover offers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole("merchant")}
                  style={[styles.roleBtn, role === "merchant" && styles.roleBtnOn]}
                >
                  <Text style={styles.roleEmoji}>🏪</Text>
                  <Text style={[styles.roleTitle, role === "merchant" && styles.roleTitleOn]}>
                    Merchant
                  </Text>
                  <Text style={[styles.roleSub, role === "merchant" && styles.roleSubOn]}>
                    Create offers
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            style={[styles.cta, loading && styles.ctaDisabled]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>
                  {isSignUp ? "Create account →" : "Sign in →"}
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isSignUp ? "Already have an account? " : "No account yet? "}
              <Text style={styles.switchLink}>
                {isSignUp ? "Sign in" : "Sign up"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1C1C1A" },
  hero: { paddingTop: 80, paddingBottom: 40, alignItems: "center", paddingHorizontal: 24 },
  logoWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "#E65100",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#E65100", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  logoGlyph: { fontSize: 28, color: "#fff" },
  heroTitle: { fontSize: 32, fontWeight: "800", color: "#FAFAF8", letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "#6E6C67", marginTop: 6, textAlign: "center" },

  card: {
    flex: 1, backgroundColor: "#FAFAF8",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 56,
  },
  cardTitle: { fontSize: 22, fontWeight: "700", color: "#1C1C1A", marginBottom: 24 },

  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: "700", color: "#9E9C96",
    marginBottom: 7, letterSpacing: 0.6, textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#F0EDE6", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15, color: "#1C1C1A",
  },

  roleRow: { flexDirection: "row", gap: 10 },
  roleBtn: {
    flex: 1, padding: 14, borderRadius: 14,
    backgroundColor: "#F0EDE6", alignItems: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  roleBtnOn: { borderColor: "#E65100", backgroundColor: "#FFF3E0" },
  roleEmoji: { fontSize: 22, marginBottom: 5 },
  roleTitle: { fontSize: 13, fontWeight: "700", color: "#5F5E5A" },
  roleTitleOn: { color: "#E65100" },
  roleSub: { fontSize: 10, color: "#B4B2A9", marginTop: 2 },
  roleSubOn: { color: "#F4956A" },

  cta: {
    backgroundColor: "#E65100", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
    marginTop: 8,
    shadowColor: "#E65100", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  ctaDisabled: { opacity: 0.6, shadowOpacity: 0, elevation: 0 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  switchRow: { marginTop: 22, alignItems: "center" },
  switchText: { fontSize: 13, color: "#9E9C96" },
  switchLink: { color: "#E65100", fontWeight: "700" },
});
