import {
  View, Text, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, StyleSheet, StatusBar,
} from "react-native";
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
  const [cashbackUsed, setCashbackUsed] = useState(false);

  useEffect(() => {
    if (!offer?.id) {
      setError("Offer not found");
      setLoading(false);
      return;
    }
    Promise.all([generateToken(), refreshBalance()]);
  }, []);

  useEffect(() => {
    if (!redemption) return;
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [redemption]);

  async function refreshBalance() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("cashback_balance")
      .eq("id", user.id)
      .single();
    setBalance(data?.cashback_balance ?? 0);
  }

  async function generateToken() {
    if (offer?.id === "demo-failsafe-001") {
      setRedemption(DEMO_FAILSAFE_TOKEN as any);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = await acceptOffer(offer.id, offer.discount_pct, offer.merchant_name);
      setRedemption(token);
    } catch {
      setRedemption(DEMO_FAILSAFE_TOKEN as any);
    } finally {
      setLoading(false);
    }
  }

  async function handleUseCashback() {
    if (!redemption?.id || balance <= 0 || cashbackUsed) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const newBal = await useCashback(user.id, redemption.id, balance);
      setBalance(newBal);
      setCashbackUsed(true);
      Alert.alert("Applied!", `€${balance.toFixed(2)} cashback deducted from your balance.`);
    } catch {
      Alert.alert("Error", "Could not apply cashback.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEarnCashback() {
    if (!redemption?.id) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const newBal = await creditCashback(user.id, redemption.id, offer.discount_pct);
      setBalance(newBal);
      Alert.alert("Cashback earned!", `+€${(8.5 * offer.discount_pct / 100).toFixed(2)} added to your wallet.`);
      navigation.navigate("ClientMain");
    } catch {
      Alert.alert("Error", "Could not credit cashback.");
    } finally {
      setLoading(false);
    }
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const isExpired = timeLeft === 0;
  const isUrgent = timeLeft < 60 && !isExpired;
  const progress = timeLeft / (15 * 60);
  const potentialEarn = (8.5 * (offer?.discount_pct ?? 0) / 100).toFixed(2);

  if (loading && !redemption) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#E65100" />
        <Text style={styles.loadingText}>Generating secure QR code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Offer summary */}
        <View style={styles.offerCard}>
          <View style={styles.offerCardTop}>
            <Text style={styles.offerMerchant}>{offer?.merchant_name}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>−{offer?.discount_pct}%</Text>
            </View>
          </View>
          <Text style={styles.offerHeadline}>{offer?.headline}</Text>
          <Text style={styles.offerSub}>{offer?.sub_text}</Text>
        </View>

        {/* Timer */}
        <View style={[styles.timerCard, isUrgent && styles.timerCardUrgent, isExpired && styles.timerCardExpired]}>
          <View style={styles.timerRow}>
            <Text style={[styles.timerLabel, isUrgent && { color: "#FF5252" }, isExpired && { color: "#888" }]}>
              {isExpired ? "Offer expired" : "Expires in"}
            </Text>
            <Text style={[styles.timerValue, isUrgent && { color: "#FF5252" }, isExpired && { color: "#888" }]}>
              {mins}:{secs}
            </Text>
          </View>
          <View style={styles.timerBar}>
            <View style={[
              styles.timerFill,
              { width: `${progress * 100}%` },
              isUrgent && { backgroundColor: "#FF5252" },
              isExpired && { width: "0%" },
            ]} />
          </View>
        </View>

        {/* Cashback choice */}
        {!isExpired && !cashbackUsed && (
          <View style={styles.cashbackCard}>
            <Text style={styles.cashbackTitle}>💳 Cashback options</Text>
            <Text style={styles.cashbackSub}>
              Balance: €{balance.toFixed(2)} · Potential earn: +€{potentialEarn}
            </Text>
            <View style={styles.cashbackBtns}>
              <TouchableOpacity
                onPress={handleUseCashback}
                disabled={balance <= 0 || loading}
                style={[
                  styles.cashbackBtn,
                  { backgroundColor: balance > 0 ? "#2E7D32" : "#D3D1C7" },
                ]}
              >
                <Text style={styles.cashbackBtnText}>Use €{balance.toFixed(2)}</Text>
                <Text style={styles.cashbackBtnHint}>Deduct now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEarnCashback}
                disabled={loading}
                style={[styles.cashbackBtn, { backgroundColor: "#E65100" }]}
              >
                <Text style={styles.cashbackBtnText}>+€{potentialEarn}</Text>
                <Text style={styles.cashbackBtnHint}>Earn cashback</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* QR code */}
        <View style={styles.qrSection}>
          <Text style={styles.qrInstruction}>Show this code to the merchant</Text>

          {!isExpired ? (
            <View style={styles.qrWrap}>
              <QRCode
                value={redemption?.qr_data ?? "expired"}
                size={200}
                color="#1C1C1A"
                backgroundColor="#fff"
              />
            </View>
          ) : (
            <View style={styles.expiredWrap}>
              <Text style={styles.expiredIcon}>⏰</Text>
              <Text style={styles.expiredText}>Offer expired</Text>
            </View>
          )}

          <View style={styles.tokenRow}>
            <Text style={styles.tokenLabel}>Token</Text>
            <Text style={styles.tokenValue}>{redemption?.token}</Text>
          </View>
        </View>

        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ClientMain")}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#9E9C96", fontSize: 13 },
  scroll: { padding: 20, paddingBottom: 40 },

  offerCard: {
    backgroundColor: "#1C1C1A",
    borderRadius: 20, padding: 20,
    marginBottom: 14,
  },
  offerCardTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  offerMerchant: { fontSize: 13, fontWeight: "600", color: "#9E9C96" },
  discountBadge: {
    backgroundColor: "#E65100", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  discountText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  offerHeadline: { fontSize: 20, fontWeight: "800", color: "#FAFAF8", marginBottom: 6 },
  offerSub: { fontSize: 13, color: "#6E6C67" },

  timerCard: {
    backgroundColor: "#F0EDE6", borderRadius: 14,
    padding: 14, marginBottom: 14,
  },
  timerCardUrgent: { backgroundColor: "#FFF0F0" },
  timerCardExpired: { backgroundColor: "#F5F5F5" },
  timerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  timerLabel: { fontSize: 12, fontWeight: "600", color: "#5F5E5A" },
  timerValue: { fontSize: 20, fontWeight: "800", color: "#1C1C1A" },
  timerBar: { height: 4, backgroundColor: "#E0DDD5", borderRadius: 4, overflow: "hidden" },
  timerFill: { height: "100%", backgroundColor: "#E65100", borderRadius: 4 },

  cashbackCard: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: "#F0EDE6",
  },
  cashbackTitle: { fontSize: 15, fontWeight: "700", color: "#1C1C1A", marginBottom: 4 },
  cashbackSub: { fontSize: 12, color: "#9E9C96", marginBottom: 14 },
  cashbackBtns: { flexDirection: "row", gap: 10 },
  cashbackBtn: {
    flex: 1, borderRadius: 12,
    paddingVertical: 12, alignItems: "center",
  },
  cashbackBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cashbackBtnHint: { color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 2 },

  qrSection: { alignItems: "center", marginBottom: 20 },
  qrInstruction: { fontSize: 13, color: "#9E9C96", marginBottom: 16 },
  qrWrap: {
    padding: 24, backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  expiredWrap: {
    width: 248, height: 248,
    backgroundColor: "#F5F5F5", borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  expiredIcon: { fontSize: 40, marginBottom: 10 },
  expiredText: { fontSize: 15, fontWeight: "700", color: "#888" },

  tokenRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tokenLabel: { fontSize: 11, color: "#B4B2A9", fontWeight: "600" },
  tokenValue: { fontSize: 11, color: "#B4B2A9", fontFamily: "monospace" },

  backBtn: {
    backgroundColor: "#F0EDE6", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  backText: { color: "#5F5E5A", fontWeight: "600", fontSize: 14 },
});
