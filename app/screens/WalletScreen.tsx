import {
  View, Text, TouchableOpacity,
  ActivityIndicator, ScrollView
} from "react-native";
import { useEffect, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import { acceptOffer, RedemptionToken } from "../services/checkoutService";

export default function WalletScreen({ route, navigation }: any) {
  const { offer } = route.params ?? {};
  const [redemption, setRedemption] = useState<RedemptionToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

  // Générer le token au chargement de l'écran
  useEffect(() => {
    if (!offer?.id) {
      setError("Offre introuvable");
      setLoading(false);
      return;
    }
    generateToken();
  }, []);

  // Countdown
  useEffect(() => {
    if (!redemption) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [redemption]);

  async function generateToken() {
    try {
      setLoading(true);
      const token = await acceptOffer(
        offer.id,
        offer.discount_pct,
        offer.merchant_name
      );
      setRedemption(token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const isUrgent = timeLeft < 60;
  const isExpired = timeLeft === 0;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAF8" }}>
        <ActivityIndicator size="large" color="#E65100" />
        <Text style={{ marginTop: 12, color: "#888", fontSize: 13 }}>
          Génération du QR code...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAF8", padding: 24 }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
        <Text style={{ color: "#C62828", fontWeight: "600", textAlign: "center" }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16, padding: 12 }}
        >
          <Text style={{ color: "#E65100" }}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      contentContainerStyle={{ alignItems: "center", padding: 24 }}
    >
      {/* Header offre */}
      <View style={{
        width: "100%", padding: 16,
        backgroundColor: "#FFF3E0",
        borderRadius: 14, marginBottom: 24,
        alignItems: "center",
      }}>
        <Text style={{ fontSize: 24 }}>☕</Text>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#4E2B00", marginTop: 4 }}>
          {offer?.merchant_name}
        </Text>
        <Text style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
          {offer?.headline}
        </Text>
        <View style={{
          marginTop: 8, backgroundColor: "#E65100",
          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4,
        }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
            −{offer?.discount_pct}%
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <Text style={{ fontSize: 14, color: "#5F5E5A", marginBottom: 16, textAlign: "center" }}>
        Montrez ce QR code au commerçant
      </Text>

      {/* QR Code */}
      {!isExpired ? (
        <View style={{
          padding: 20, backgroundColor: "#fff",
          borderRadius: 16, marginBottom: 20,
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
        }}>
          <QRCode
            value={redemption?.qr_data ?? "expired"}
            size={220}
            color="#2C2C2A"
            backgroundColor="#fff"
          />
        </View>
      ) : (
        <View style={{
          width: 260, height: 260, backgroundColor: "#FFEBEE",
          borderRadius: 16, alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 40 }}>⏰</Text>
          <Text style={{ color: "#C62828", fontWeight: "700", marginTop: 8 }}>
            Offre expirée
          </Text>
        </View>
      )}

      {/* Timer */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8,
      }}>
        <Text style={{ fontSize: 13, color: isUrgent ? "#C62828" : "#5F5E5A" }}>
          ⏱ Expire dans
        </Text>
        <Text style={{
          fontSize: 20, fontWeight: "800",
          color: isUrgent ? "#C62828" : "#2C2C2A",
        }}>
          {mins}:{secs}
        </Text>
      </View>

      <Text style={{ fontSize: 11, color: "#B4B2A9", marginBottom: 32, textAlign: "center" }}>
        Token : {redemption?.token}
      </Text>

      {/* Bouton retour */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        style={{
          width: "100%", padding: 14,
          backgroundColor: "#F1EFE8",
          borderRadius: 12, alignItems: "center",
        }}
      >
        <Text style={{ color: "#5F5E5A", fontWeight: "600" }}>
          ← Retour à l'accueil
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}