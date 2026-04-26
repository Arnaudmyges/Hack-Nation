import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
} from "react-native-reanimated";
import { useEffect, useState } from "react";

const THEMES = {
  warm_amber: {
    bg: "#1A0F00", card: "#2A1800", accent: "#E65100",
    text: "#FFD0A0", sub: "#C8906A", badge: "#E65100",
    emoji: "☕",
  },
  cool_blue: {
    bg: "#00091A", card: "#001428", accent: "#2196F3",
    text: "#A0C8FF", sub: "#6A9AC8", badge: "#1565C0",
    emoji: "🧊",
  },
  fresh_green: {
    bg: "#001A05", card: "#002810", accent: "#43A047",
    text: "#A0FFB8", sub: "#6AC882", badge: "#2E7D32",
    emoji: "🌿",
  },
  urgent_red: {
    bg: "#1A0000", card: "#280000", accent: "#E53935",
    text: "#FFA0A0", sub: "#C86A6A", badge: "#C62828",
    emoji: "⚡",
  },
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
  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 22, stiffness: 120 });
    opacity.value = withSpring(1, { damping: 20, stiffness: 100 });
    scale.value = withSpring(1, { damping: 18, stiffness: 100 });

    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const isUrgent = timeLeft < 60;
  const progress = timeLeft / (offer.expiry_minutes * 60);

  return (
    <Animated.View style={[animStyle, styles.wrap]}>
      <View style={[styles.card, { backgroundColor: theme.bg }]}>

        {/* Top strip: merchant + timer */}
        <View style={styles.topRow}>
          <View style={styles.merchantInfo}>
            <View style={[styles.merchantDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.merchantName, { color: theme.sub }]}>
              {offer.merchant_name}
            </Text>
            <Text style={[styles.distance, { color: theme.sub }]}>
              · {offer.distance_meters}m
            </Text>
          </View>
          <View style={[styles.timerPill, isUrgent && styles.timerPillUrgent]}>
            <Text style={[styles.timerText, { color: isUrgent ? "#FF5252" : theme.text }]}>
              {mins}:{secs}
            </Text>
          </View>
        </View>

        {/* Timer bar */}
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: isUrgent ? "#FF5252" : theme.accent },
          ]} />
        </View>

        {/* Main content */}
        <View style={[styles.content, { backgroundColor: theme.card }]}>
          <Text style={styles.emoji}>{theme.emoji}</Text>

          <Text style={[styles.headline, { color: theme.text }]}>
            {offer.headline}
          </Text>
          <Text style={[styles.subText, { color: theme.sub }]}>
            {offer.sub_text}
          </Text>

          {/* Discount badge */}
          <View style={[styles.discountBadge, { backgroundColor: theme.badge }]}>
            <Text style={styles.discountText}>−{offer.discount_pct}%</Text>
          </View>

          {/* Accept CTA */}
          <TouchableOpacity
            onPress={onAccept}
            style={[styles.acceptBtn, { backgroundColor: theme.accent }]}
            activeOpacity={0.85}
          >
            <Text style={styles.acceptText}>{offer.cta_label}</Text>
          </TouchableOpacity>

          {/* Decline */}
          <TouchableOpacity onPress={onDecline} style={styles.declineBtn}>
            <Text style={[styles.declineText, { color: theme.sub }]}>No thanks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 16 },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },

  topRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  merchantInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  merchantDot: { width: 6, height: 6, borderRadius: 3 },
  merchantName: { fontSize: 13, fontWeight: "600" },
  distance: { fontSize: 13 },
  timerPill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  timerPillUrgent: { backgroundColor: "rgba(255,82,82,0.15)" },
  timerText: { fontSize: 13, fontWeight: "700" },

  progressBar: { height: 2, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 16 },
  progressFill: { height: "100%", borderRadius: 2 },

  content: {
    margin: 10, borderRadius: 18,
    padding: 20,
  },
  emoji: { fontSize: 44, marginBottom: 12 },
  headline: { fontSize: 24, fontWeight: "800", lineHeight: 30, marginBottom: 6 },
  subText: { fontSize: 14, lineHeight: 19, marginBottom: 18 },

  discountBadge: {
    alignSelf: "flex-start", borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 20,
  },
  discountText: { color: "#fff", fontSize: 22, fontWeight: "800" },

  acceptBtn: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginBottom: 10,
  },
  acceptText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  declineBtn: { paddingVertical: 8, alignItems: "center" },
  declineText: { fontSize: 13 },
});
