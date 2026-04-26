import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, StatusBar, Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { validateToken } from "../services/checkoutService";

const { width } = Dimensions.get("window");
const SCAN_SIZE = Math.min(width * 0.72, 300);

function ValidationResult({ result, onReset }: { result: any; onReset: () => void }) {
  const isValid = result?.valid;
  return (
    <View style={[styles.root, styles.resultWrap]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.resultCard, isValid ? styles.resultCardGood : styles.resultCardBad]}>
        <Text style={styles.resultEmoji}>{isValid ? "✓" : "✕"}</Text>
        <Text style={[styles.resultTitle, { color: isValid ? "#2E7D32" : "#C62828" }]}>
          {isValid ? "Offer Validated" : "Validation Failed"}
        </Text>
        {result?.discount_pct ? (
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>−{result.discount_pct}% applied</Text>
          </View>
        ) : null}
        <Text style={styles.resultReason}>{result?.reason ?? "Token verified successfully"}</Text>
      </View>
      <TouchableOpacity onPress={onReset} style={styles.resetBtn}>
        <Text style={styles.resetBtnText}>← Back to terminal</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MerchantScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<"menu" | "qr" | "manual">("menu");
  const [result, setResult] = useState<any>(null);
  const [manualToken, setManualToken] = useState("");
  const [processing, setProcessing] = useState(false);

  async function processToken(raw: string) {
    if (processing) return;
    setProcessing(true);
    try {
      let token = raw;
      try {
        const parsed = JSON.parse(raw);
        token = parsed.token || raw;
      } catch {}
      setResult(await validateToken(token));
    } catch {
      setResult({ valid: false, reason: "Technical error — please retry" });
    } finally {
      setProcessing(false);
    }
  }

  if (result) {
    return (
      <ValidationResult
        result={result}
        onReset={() => { setResult(null); setMode("menu"); }}
      />
    );
  }

  if (mode === "qr") {
    if (!permission?.granted) {
      return (
        <View style={[styles.root, styles.centerWrap]}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.permissionCard}>
            <Text style={styles.permissionIcon}>📷</Text>
            <Text style={styles.permissionTitle}>Camera access required</Text>
            <Text style={styles.permissionSub}>To scan customer QR codes, please allow camera access.</Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
              <Text style={styles.permissionBtnText}>Allow camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar barStyle="light-content" />
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={({ data }) => processToken(data)}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />

        {/* Dark overlay with scan window */}
        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.overlayTop} />
          <View style={styles.overlaySides}>
            <View style={styles.overlaySide} />
            <View style={[styles.scanWindow, { width: SCAN_SIZE, height: SCAN_SIZE }]}>
              {/* Corner marks */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.scanInstruction}>Point the camera at the customer's QR code</Text>
            <TouchableOpacity
              onPress={() => setMode("menu")}
              style={styles.cancelScanBtn}
            >
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (mode === "manual") {
    return (
      <View style={[styles.root, styles.centerWrap]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.manualCard}>
          <Text style={styles.manualTitle}>Enter token manually</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. cw_DEMO12345"
            placeholderTextColor="#B4B2A9"
            value={manualToken}
            onChangeText={setManualToken}
            autoFocus
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.manualBtn, !manualToken && styles.manualBtnDisabled]}
            onPress={() => processToken(manualToken)}
            disabled={!manualToken}
          >
            <Text style={styles.manualBtnText}>Validate →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode("menu")} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.menuScroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.menuHeader}>
          <View style={styles.menuAvatarWrap}>
            <Text style={{ fontSize: 28 }}>📷</Text>
          </View>
          <Text style={styles.menuTitle}>Merchant Terminal</Text>
          <Text style={styles.menuSub}>Validate customer offers quickly and securely</Text>
        </View>

        {/* Main option */}
        <TouchableOpacity
          style={styles.menuCardPrimary}
          onPress={() => setMode("qr")}
          activeOpacity={0.88}
        >
          <View style={styles.menuCardIcon}>
            <Text style={{ fontSize: 32 }}>📷</Text>
          </View>
          <View style={styles.menuCardBody}>
            <Text style={styles.menuCardTitle}>Scan QR Code</Text>
            <Text style={styles.menuCardSub}>Point camera at customer's phone</Text>
          </View>
          <Text style={styles.menuCardArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCardSecondary}
          onPress={() => setMode("manual")}
          activeOpacity={0.88}
        >
          <View style={[styles.menuCardIcon, { backgroundColor: "#F0EDE6" }]}>
            <Text style={{ fontSize: 32 }}>⌨️</Text>
          </View>
          <View style={styles.menuCardBody}>
            <Text style={[styles.menuCardTitle, { color: "#1C1C1A" }]}>Enter code manually</Text>
            <Text style={styles.menuCardSub}>Type the customer's token</Text>
          </View>
          <Text style={[styles.menuCardArrow, { color: "#5F5E5A" }]}>→</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            🔒 Each QR code is single-use and expires after 15 minutes. Tokens are validated securely via the City Wallet API.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  centerWrap: { alignItems: "center", justifyContent: "center", padding: 24 },

  // Result
  resultWrap: { justifyContent: "center", padding: 28 },
  resultCard: {
    borderRadius: 24, padding: 28,
    alignItems: "center", marginBottom: 20,
  },
  resultCardGood: { backgroundColor: "#E8F5E9" },
  resultCardBad: { backgroundColor: "#FFEBEE" },
  resultEmoji: { fontSize: 52, marginBottom: 12 },
  resultTitle: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  resultBadge: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12,
  },
  resultBadgeText: { fontSize: 15, fontWeight: "700", color: "#1C1C1A" },
  resultReason: { fontSize: 13, color: "#5F5E5A", textAlign: "center" },
  resetBtn: {
    backgroundColor: "#fff", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#F0EDE6",
  },
  resetBtnText: { color: "#5F5E5A", fontWeight: "600", fontSize: 14 },

  // Permission
  permissionCard: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 28, alignItems: "center", width: "100%",
  },
  permissionIcon: { fontSize: 40, marginBottom: 14 },
  permissionTitle: { fontSize: 18, fontWeight: "700", color: "#1C1C1A", marginBottom: 8 },
  permissionSub: { fontSize: 13, color: "#9E9C96", textAlign: "center", marginBottom: 20 },
  permissionBtn: {
    backgroundColor: "#E65100", borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 28,
  },
  permissionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // QR scanner overlay
  overlayTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  overlaySides: { flexDirection: "row", height: SCAN_SIZE },
  overlaySide: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  overlayBottom: {
    flex: 1.2, backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center", justifyContent: "center", gap: 20,
  },
  scanWindow: {
    position: "relative",
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: "#E65100",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 6 },
  scanInstruction: { color: "#fff", fontSize: 14, fontWeight: "500", textAlign: "center", paddingHorizontal: 32 },
  cancelScanBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24,
  },
  cancelScanText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  // Manual
  manualCard: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 24, width: "100%",
  },
  manualTitle: { fontSize: 18, fontWeight: "700", color: "#1C1C1A", marginBottom: 16 },
  manualInput: {
    backgroundColor: "#F5F3EE", borderRadius: 12,
    padding: 16, fontSize: 15, color: "#1C1C1A",
    marginBottom: 14,
  },
  manualBtn: {
    backgroundColor: "#1C1C1A", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginBottom: 14,
  },
  manualBtnDisabled: { opacity: 0.4 },
  manualBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backLink: { alignItems: "center", paddingVertical: 8 },
  backLinkText: { color: "#9E9C96", fontSize: 13 },

  // Menu
  menuScroll: { padding: 24, paddingBottom: 40 },
  menuHeader: { alignItems: "center", marginBottom: 36, marginTop: 8 },
  menuAvatarWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: "#1C1C1A",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  menuTitle: { fontSize: 24, fontWeight: "800", color: "#1C1C1A", marginBottom: 6 },
  menuSub: { fontSize: 13, color: "#9E9C96", textAlign: "center" },

  menuCardPrimary: {
    backgroundColor: "#1C1C1A", borderRadius: 20,
    padding: 20, marginBottom: 12,
    flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 6,
  },
  menuCardSecondary: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 20, marginBottom: 24,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: "#F0EDE6",
  },
  menuCardIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "#2A2A28",
    alignItems: "center", justifyContent: "center",
  },
  menuCardBody: { flex: 1 },
  menuCardTitle: { fontSize: 16, fontWeight: "700", color: "#FAFAF8" },
  menuCardSub: { fontSize: 12, color: "#6E6C67", marginTop: 3 },
  menuCardArrow: { fontSize: 18, color: "#FAFAF8" },

  infoCard: { backgroundColor: "#F5F3EE", borderRadius: 14, padding: 14 },
  infoText: { fontSize: 11, color: "#7A7870", lineHeight: 17 },
});
