import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
} from "react-native-reanimated";
import { useEffect, useState } from "react";

const THEMES = {
  warm_amber:  { bg: "#FFF3E0", accent: "#E65100", text: "#4E2B00", emoji: "☕" },
  cool_blue:   { bg: "#E3F2FD", accent: "#1565C0", text: "#0D2B4E", emoji: "🧊" },
  fresh_green: { bg: "#E8F5E9", accent: "#2E7D32", text: "#1A3D1C", emoji: "🌿" },
  urgent_red:  { bg: "#FFEBEE", accent: "#C62828", text: "#4A0000", emoji: "⚡" },
};

interface OfferCardProps {
  offer: {
    headline: string;
    sub_text: string;
    discount_pct: number;
    visual_mood: keyof typeof THEMES;
    cta_label: string;
    expiry_minutes: number;
    merchant_name: string;
    distance_meters: number;
  };
  onAccept: () => void;
  onDecline: () => void;
}

export function OfferCard({ offer, onAccept, onDecline }: OfferCardProps) {
  const theme = THEMES[offer.visual_mood] ?? THEMES.warm_amber;
  const [timeLeft, setTimeLeft] = useState(offer.expiry_minutes * 60);
  const translateY = useSharedValue(500);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
    opacity.value = withSpring(1);
    const interval = setInterval(
      () => setTimeLeft((t) => Math.max(0, t - 1)),
      1000
    );
    return () => clearInterval(interval);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const isUrgent = timeLeft < 60;

  return (
    <Animated.View
      style={[
        animStyle,
        {
          backgroundColor: theme.bg,
          borderRadius: 20,
          padding: 20,
          marginHorizontal: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 8,
        },
      ]}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 13, color: theme.text, opacity: 0.7 }}>
          📍 {offer.merchant_name} · {offer.distance_meters}m
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: isUrgent ? "#C62828" : theme.text }}>
          ⏱ {mins}:{secs}
        </Text>
      </View>

      {/* Emoji + Headline */}
      <Text style={{ fontSize: 40, marginBottom: 8 }}>{theme.emoji}</Text>
      <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, marginBottom: 4, lineHeight: 28 }}>
        {offer.headline}
      </Text>
      <Text style={{ fontSize: 14, color: theme.text, opacity: 0.65, marginBottom: 16 }}>
        {offer.sub_text}
      </Text>

      {/* Badge remise */}
      <View style={{
        alignSelf: "flex-start",
        backgroundColor: theme.accent,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginBottom: 20,
      }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
          −{offer.discount_pct}%
        </Text>
      </View>

      {/* Bouton accepter */}
      <TouchableOpacity
        onPress={onAccept}
        style={{
          backgroundColor: theme.accent,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          {offer.cta_label}
        </Text>
      </TouchableOpacity>

      {/* Bouton refuser */}
      <TouchableOpacity onPress={onDecline} style={{ paddingVertical: 8, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: theme.text, opacity: 0.4 }}>Non merci</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}