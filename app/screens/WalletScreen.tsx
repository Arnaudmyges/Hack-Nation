import {
  View, Text, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, StyleSheet
} from "react-native"; // <-- Le StyleSheet manquant était ici
import { useEffect, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "../services/supabaseClient";
import { acceptOffer, RedemptionToken } from "../services/checkoutService";
import { DEMO_FAILSAFE_TOKEN } from "../services/demoFailsafe";
import { creditCashback, useCashback } from "../services/cashbackService";

export default function WalletScreen({ route, navigation }: any) {
  const { offer } = route.params ?? {};
  const [redemption, setRedemption] = useState<RedemptionToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); 
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!offer?.id) {
      setError("Offer not found");
      setLoading(false);
      return;
    }
    
    const init = async () => {
      await generateToken();
      await refreshBalance();
    };
    init();
  }, []);

  useEffect(() => {
    if (!redemption) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [redemption]);

  const refreshBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("cashback_balance")
        .eq("id", user.id)
        .single();
      setBalance(data?.cashback_balance ?? 0);
    }
  };

  async function generateToken() {
    if (offer?.id === "demo-failsafe-001") {
      setRedemption(DEMO_FAILSAFE_TOKEN as any);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await acceptOffer(
        offer.id,
        offer.discount_pct,
        offer.merchant_name
      );
      setRedemption(token);
    } catch (e: any) {
      console.warn("API/DB Error, using failsafe token");
      setRedemption(DEMO_FAILSAFE_TOKEN as any);
    } finally {
      setLoading(false);
    }
  }

  const handleUseCashbackAction = async () => {
    if (!redemption?.id || balance <= 0) return;
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newBal = await useCashback(user.id, redemption.id, balance);
      setBalance(newBal);
      
      Alert.alert("Succès", `€${balance.toFixed(2)} déduits !`);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de déduire le cashback.");
    } finally {
      setLoading(false);
    }
  };

  const handleEarnCashbackAction = async () => {
    if (!redemption?.id) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newBal = await creditCashback(user.id, redemption.id, offer.discount_pct);
      setBalance(newBal);
      
      Alert.alert("Bravo", "Cashback crédité !");
      navigation.navigate("Home");
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créditer le cashback.");
    } finally {
      setLoading(false);
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const isExpired = timeLeft === 0;

  if (loading && !redemption) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E65100" />
        <Text style={styles.loadingText}>Génération du QR Code...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.main} contentContainerStyle={{ alignItems: "center", padding: 24 }}>
      
      <View style={styles.offerHeader}>
        <Text style={{ fontSize: 32 }}>{offer?.emoji || "🎁"}</Text>
        <Text style={styles.merchantName}>{offer?.merchant_name}</Text>
        <Text style={styles.offerHeadline}>{offer?.headline}</Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>−{offer?.discount_pct}%</Text>
        </View>
      </View>
      
      {!isExpired && (
        <CashbackChoice 
          balance={balance}
          offer={offer} 
          onUseCashback={handleUseCashbackAction}
          onSkip={handleEarnCashbackAction}
          loading={loading}
        />
      )}
      
      <Text style={styles.instruction}>Présentez ce code au marchand</Text>

      {!isExpired ? (
        <View style={styles.qrContainer}>
          <QRCode
            value={redemption?.qr_data ?? "expired"}
            size={220}
            color="#2C2C2A"
            backgroundColor="#fff"
          />
        </View>
      ) : (
        <View style={styles.expiredContainer}>
          <Text style={{ fontSize: 40 }}>⏰</Text>
          <Text style={styles.expiredText}>Offre expirée</Text>
        </View>
      )}

      <View style={styles.timerRow}>
        <Text style={{ fontSize: 13, color: timeLeft < 60 ? "#C62828" : "#5F5E5A" }}>
          ⏱ Expire dans
        </Text>
        <Text style={[styles.timerValue, { color: timeLeft < 60 ? "#C62828" : "#2C2C2A" }]}>
          {mins}:{secs}
        </Text>
      </View>

      <Text style={styles.tokenId}>Token ID: {redemption?.token}</Text>

      <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.backButton}>
        <Text style={{ color: "#5F5E5A", fontWeight: "600" }}>← Retour à l'accueil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function CashbackChoice({ balance, offer, onUseCashback, onSkip, loading }: any) {
  const potentialEarn = (8.50 * offer.discount_pct / 100).toFixed(2);

  return (
    <View style={styles.cashbackCard}>
      <Text style={styles.cashbackTitle}>💳 Votre Cashback</Text>
      <Text style={styles.cashbackStats}>
        Solde : €{balance.toFixed(2)} · Gain : +€{potentialEarn}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity 
          disabled={loading || balance <= 0}
          onPress={onUseCashback}
          style={[styles.cashbackBtn, { backgroundColor: balance > 0 ? "#2E7D32" : "#B4B2A9" }]}>
          <Text style={styles.btnText}>Utiliser €{balance.toFixed(2)}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          disabled={loading}
          onPress={onSkip}
          style={[styles.cashbackBtn, { backgroundColor: "#F1EFE8" }]}>
          <Text style={[styles.btnText, { color: "#5F5E5A" }]}>Cumuler +€{potentialEarn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: "#FAFAF8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: "#888", fontSize: 13 },
  offerHeader: { width: "100%", padding: 20, backgroundColor: "#FFF3E0", borderRadius: 18, marginBottom: 20, alignItems: "center" },
  merchantName: { fontSize: 18, fontWeight: "800", color: "#4E2B00", marginTop: 8 },
  offerHeadline: { fontSize: 13, color: "#888", textAlign: "center" },
  discountBadge: { marginTop: 10, backgroundColor: "#E65100", borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6 },
  discountText: { color: "#fff", fontWeight: "800", fontSize: 20 },
  instruction: { fontSize: 13, color: "#888", marginBottom: 15 },
  qrContainer: { padding: 20, backgroundColor: "#fff", borderRadius: 20, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 25 },
  timerValue: { fontSize: 22, fontWeight: "900" },
  tokenId: { fontSize: 10, color: "#B4B2A9", marginTop: 10 },
  backButton: { width: "100%", padding: 16, backgroundColor: "#F1EFE8", borderRadius: 14, alignItems: "center", marginTop: 30 },
  expiredContainer: { width: 260, height: 260, backgroundColor: "#FFEBEE", borderRadius: 20, alignItems: "center", justifyContent: "center" },
  expiredText: { color: "#C62828", fontWeight: "700", marginTop: 10 },
  cashbackCard: { width: '100%', padding: 16, backgroundColor: "#E8F5E9", borderRadius: 16, marginBottom: 20 },
  cashbackTitle: { fontSize: 15, fontWeight: "700", color: "#1B5E20", marginBottom: 4 },
  cashbackStats: { fontSize: 12, color: "#2E7D32", marginBottom: 12 },
  cashbackBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 }
});