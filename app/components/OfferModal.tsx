import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar,
} from "react-native";
import Animated, {
  useSharedValue, withSpring, withTiming,
  useAnimatedStyle, runOnJS,
} from "react-native-reanimated";
import { useEffect, useState } from "react";

const { height: SCREEN_H } = Dimensions.get("window");

const THEMES = {
  warm_amber: {
    bg: "#1A0F00", card: "#2A1800", accent: "#E65100",
    text: "#FFD0A0", sub: "#C8906A", badge: "#E65100", emoji: "☕",
  },
  cool_blue: {
    bg: "#00091A", card: "#001428", accent: "#2196F3",
    text: "#A0C8FF", sub: "#6A9AC8", badge: "#1565C0", emoji: "🧊",
  },
  fresh_green: {
    bg: "#001A05", card: "#002810", accent: "#43A047",
    text: "#A0FFB8", sub: "#6AC882", badge: "#2E7D32", emoji: "🌿",
  },
  urgent_red: {
    bg: "#1A0000", card: "#280000", accent: "#E53935",
    text: "#FFA0A0", sub: "#C86A6A", badge: "#C62828", emoji: "⚡",
  },
};

interface OfferModalProps {
  visible: boolean;
  offer: {
    headline: string;
    sub_text: string;
    discount_pct: number;
    visual_mood: keyof typeof THEMES;
    cta_label: string;
    expiry_minutes: number;
    merchant_name: string;
    distance_meters: number;
  } | null;
  onAccept: () => void;
  onDecline: () => void;
}

interface ModalContentProps {
  offer: NonNullable<OfferModalProps["offer"]>;
  onAccept: () => void;
  onDecline: () => void;
}

function ModalContent({ offer, onAccept, onDecline }: ModalContentProps) {
  const theme = THEMES[offer.visual_mood] ?? THEMES.warm_amber;
  const [timeLeft, setTimeLeft] = useState(offer.expiry_minutes * 60);

  const slideY = useSharedValue(SCREEN_H);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    slideY.value = withSpring(0, { damping: 24, stiffness: 130 });
    backdropOpacity.value = withTiming(1, { duration: 280 });

    const interval = setInterval(
      () => setTimeLeft((t) => Math.max(0, t - 1)),
      1000
    );
    return () => clearInterval(interval);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  function animateOut(cb: () => void) {
    slideY.value = withTiming(SCREEN_H, { duration: 320 }, (done) => {
      if (done) runOnJS(cb)();
    });
    backdropOpacity.value = withTiming(0, { duration: 280 });
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  const isUrgent = timeLeft < 60;
  const progress = timeLeft / (offer.expiry_minutes * 60);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        pointerEvents="none"
      />

      {/* Bottom sheet card */}
      <Animated.View style={[styles.sheet, cardStyle]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header strip */}
        <View style={[styles.headerStrip, { backgroundColor: theme.bg }]}>
          <View style={styles.merchantRow}>
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

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.bg }]}>
          <View style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: isUrgent ? "#FF5252" : theme.accent },
          ]} />
        </View>

        {/* Body */}
        <View style={[styles.body, { backgroundColor: theme.card }]}>
          <Text style={styles.emoji}>{theme.emoji}</Text>

          <Text style={[styles.headline, { color: theme.text }]}>
            {offer.headline}
          </Text>
          <Text style={[styles.subText, { color: theme.sub }]}>
            {offer.sub_text}
          </Text>

          <View style={[styles.discountBadge, { backgroundColor: theme.badge }]}>
            <Text style={styles.discountText}>−{offer.discount_pct}%</Text>
          </View>

          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: theme.accent }]}
            activeOpacity={0.85}
            onPress={() => animateOut(onAccept)}
          >
            <Text style={styles.acceptText}>{offer.cta_label}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => animateOut(onDecline)}
          >
            <Text style={[styles.declineText, { color: theme.sub }]}>No thanks</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

export function OfferModal({ visible, offer, onAccept, onDecline }: OfferModalProps) {
  if (!visible || !offer) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none" visible={visible}>
      <StatusBar barStyle="light-content" />
      <ModalContent offer={offer} onAccept={onAccept} onDecline={onDecline} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    // Slight shadow on top edge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
    // Render handle on the header strip background
    position: "absolute",
    top: 10,
    zIndex: 10,
  },

  headerStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  merchantRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  merchantDot: { width: 8, height: 8, borderRadius: 4 },
  merchantName: { fontSize: 14, fontWeight: "600" },
  distance: { fontSize: 13 },

  timerPill: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  timerPillUrgent: { backgroundColor: "rgba(255,82,82,0.2)" },
  timerText: { fontSize: 14, fontWeight: "700" },

  progressTrack: { height: 3 },
  progressFill: { height: "100%", borderRadius: 2 },

  body: {
    padding: 24,
    paddingBottom: 40,
  },
  emoji: { fontSize: 48, marginBottom: 14 },
  headline: { fontSize: 26, fontWeight: "800", lineHeight: 32, marginBottom: 8 },
  subText: { fontSize: 14, lineHeight: 20, marginBottom: 20 },

  discountBadge: {
    alignSelf: "flex-start",
    borderRadius: 22, paddingHorizontal: 18, paddingVertical: 7, marginBottom: 24,
  },
  discountText: { color: "#fff", fontSize: 24, fontWeight: "800" },

  acceptBtn: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: "center", marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptText: { color: "#fff", fontWeight: "800", fontSize: 17 },

  declineBtn: { paddingVertical: 10, alignItems: "center" },
  declineText: { fontSize: 14 },
});
