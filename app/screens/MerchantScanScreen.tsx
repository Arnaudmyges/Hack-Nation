import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { validateToken } from "../services/checkoutService";

// --- COMPOSANT RÉSULTAT (Identique à précédemment) ---
function ValidationResult({ result, onReset }: { result: any, onReset: () => void }) {
  const isValid = result?.valid;
  return (
    <View style={[styles.container, { backgroundColor: isValid ? "#E8F5E9" : "#FFEBEE" }]}>
      <Text style={{ fontSize: 48, marginBottom: 20 }}>{isValid ? "✅" : "❌"}</Text>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: isValid ? "#2E7D32" : "#C62828" }}>
        {isValid ? "Offre Validée !" : "Échec"}
      </Text>
      {result?.discount_pct && (
        <Text style={{ fontSize: 16, marginTop: 8 }}>Remise : {result.discount_pct}%</Text>
      )}
      <Text style={{ fontSize: 14, color: "#666", marginTop: 12, textAlign: 'center' }}>
        {result?.reason || "Token vérifié sur la blockchain/DB"}
      </Text>
      
      {result?.discount_pct && <Text>Remise : {result.discount_pct}%</Text>}
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

  const processValidation = async (token: string) => {
    const validation = await validateToken(token);
    setResult(validation);
  };

  const reset = () => {
    setResult(null);
    setMode('menu');
    setManualToken("");
  };

  // 1. Écran de Résultat
  if (result) return <ValidationResult result={result} onReset={reset} />;

  // 2. Mode SCANNER QR (Axe C.1)
  if (mode === 'qr') {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <Text>Autorisation requise pour la caméra</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.button}>
            <Text style={{ color: "#fff" }}>Autoriser</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
          <Text style={{ color: "#fff" }}>← Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Mode SAISIE MANUELLE
  if (mode === 'manual') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Saisie Manuelle</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez le token (ex: cw_DEMO12345)"
          value={manualToken}
          onChangeText={setManualToken}
          autoFocus
        />
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#2C2C2A' }]} 
          onPress={() => processValidation(manualToken)}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Valider le token</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('menu')} style={{ marginTop: 20 }}>
          <Text style={{ color: "#888" }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 4. MENU DE SÉLECTION (Ton souhait initial)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terminal Marchand</Text>
      <Text style={styles.subtitle}>Choisissez une méthode de validation</Text>

      <TouchableOpacity 
        style={[styles.menuOption, { backgroundColor: '#E65100' }]} 
        onPress={() => setMode('qr')}
      >
        <Text style={{ fontSize: 32 }}>📷</Text>
        <Text style={styles.menuText}>Scanner un QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.menuOption, { backgroundColor: '#2C2C2A' }]} 
        onPress={() => setMode('manual')}
      >
        <Text style={{ fontSize: 32 }}>⌨️</Text>
        <Text style={styles.menuText}>Saisir un code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: '#FAFAF8' },
  title: { fontSize: 24, fontWeight: "800", color: "#2C2C2A", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 40 },
  menuOption: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  menuText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10 },
  input: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: "#D3D1C7", 
    borderRadius: 12, 
    padding: 18, 
    fontSize: 16, 
    backgroundColor: "#fff", 
    marginBottom: 20 
  },
  button: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 12 },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 }
});