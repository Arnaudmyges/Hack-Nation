import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { validateToken } from "../services/checkoutService";

// On récupère la largeur de l'écran pour centrer parfaitement si besoin
const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = 320; // On passe de 260 à 320

function ValidationResult({ result, onReset }: { result: any, onReset: () => void }) {
  const isValid = result?.valid;
  return (
    <View style={[styles.container, { backgroundColor: isValid ? "#E8F5E9" : "#FFEBEE" }]}>
      <Text style={{ fontSize: 48, marginBottom: 20 }}>{isValid ? "✅" : "❌"}</Text>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: isValid ? "#2E7D32" : "#C62828" }}>
        {isValid ? "Offre Validée !" : "Échec du scan"}
      </Text>
      {result?.discount_pct && (
        <Text style={{ fontSize: 16, marginTop: 8 }}>Remise : {result.discount_pct}%</Text>
      )}
      <Text style={{ fontSize: 14, color: "#666", marginTop: 12, textAlign: 'center' }}>
        {result?.reason || "Token vérifié avec succès"}
      </Text>
      
      <TouchableOpacity onPress={onReset} style={styles.button}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Retour au menu</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MerchantScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'menu' | 'qr' | 'manual'>('menu');
  const [result, setResult] = useState<any>(null);
  const [manualToken, setManualToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const processValidation = async (rawData: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      let token = rawData;
      try {
        const parsed = JSON.parse(rawData);
        token = parsed.token || rawData;
      } catch { }

      const validation = await validateToken(token);
      setResult(validation);
    } catch (e) {
      setResult({ valid: false, reason: "Erreur technique" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) return <ValidationResult result={result} onReset={() => {setResult(null); setMode('menu');}} />;

  if (mode === 'qr') {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.permissionText}>Accès caméra requis</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.button}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Autoriser</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={({ data }) => processValidation(data)}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        
        {/* Overlay de visée élargi */}
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />
          <View style={[styles.middleContainer, { height: SCAN_AREA_SIZE }]}>
            <View style={styles.unfocusedContainer} />
            <View style={[styles.focusedContainer, { width: SCAN_AREA_SIZE }]} />
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>← Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.scanInstruction}>Cadrez le QR Code</Text>
      </View>
    );
  }

  if (mode === 'manual') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Saisie Manuelle</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: cw_DEMO12345"
          value={manualToken}
          onChangeText={setManualToken}
          autoFocus
        />
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#2C2C2A', width: '100%' }]} 
          onPress={() => processValidation(manualToken)}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Valider</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('menu')} style={{ marginTop: 25 }}>
          <Text style={{ color: "#888" }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terminal Marchand</Text>
      <TouchableOpacity style={[styles.menuCard, { backgroundColor: '#E65100' }]} onPress={() => setMode('qr')}>
        <Text style={{ fontSize: 32 }}>📷</Text>
        <Text style={styles.menuCardText}>Scanner QR Code</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuCard, { backgroundColor: '#2C2C2A' }]} onPress={() => setMode('manual')}>
        <Text style={{ fontSize: 32 }}>⌨️</Text>
        <Text style={styles.menuCardText}>Code manuel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: '#FAFAF8' },
  title: { fontSize: 24, fontWeight: "800", color: "#2C2C2A", marginBottom: 40 },
  button: { backgroundColor: "#E65100", borderRadius: 12, paddingVertical: 15, paddingHorizontal: 30, alignItems: 'center' },
  menuCard: { width: '100%', padding: 30, borderRadius: 20, alignItems: 'center', marginBottom: 20, elevation: 4 },
  menuCardText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10 },
  input: { width: '100%', borderWidth: 1, borderColor: "#D3D1C7", borderRadius: 12, padding: 18, backgroundColor: "#fff", marginBottom: 20 },
  permissionText: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 16 },
  overlay: { ...StyleSheet.absoluteFillObject },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }, // Plus sombre pour mieux voir le centre
  middleContainer: { flexDirection: 'row' },
  focusedContainer: { 
    borderWidth: 3, // Bordure un peu plus épaisse
    borderColor: '#E65100', 
    borderRadius: 20,
    backgroundColor: 'transparent'
  },
  scanInstruction: { position: 'absolute', bottom: 80, width: '100%', textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 }
});