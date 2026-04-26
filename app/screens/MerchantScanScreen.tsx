import React, { useState } from "react";
// 1. Ne pas oublier les imports UI de base
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { validateToken } from "../services/checkoutService";

// 2. Petit composant interne pour afficher le résultat du scan (Module 04 : Redemption)
function ValidationResult({ result, onReset }: { result: any, onReset: () => void }) {
  const isValid = result?.valid;
  return (
    <View style={[styles.container, { backgroundColor: isValid ? "#E8F5E9" : "#FFEBEE" }]}>
      <Text style={{ fontSize: 48, marginBottom: 20 }}>{isValid ? "✅" : "❌"}</Text>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: isValid ? "#2E7D32" : "#C62828" }}>
        {isValid ? "Offre Validée !" : "Échec du scan"}
      </Text>
      {result?.discount && (
        <Text style={{ fontSize: 16, marginTop: 8 }}>Remise : {result.discount}%</Text>
      )}
      <Text style={{ fontSize: 14, color: "#666", marginTop: 12, textAlign: 'center' }}>
        {result?.reason || "Token vérifié sur la blockchain/DB"}
      </Text>
      
      <TouchableOpacity onPress={onReset} style={styles.button}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Scanner à nouveau</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MerchantScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // On tente de parser le JSON du QR Code
      const qrParsed = JSON.parse(data);
      const validation = await validateToken(qrParsed.token);
      setResult(validation);
    } catch (e) {
      // Fallback si le QR code est juste une chaîne brute (token direct)
      const validation = await validateToken(data);
      setResult(validation);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          L'accès à la caméra est requis pour valider les offres DSV.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!result ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          {/* Overlay de visée */}
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer}></View>
              <View style={styles.focusedContainer}></View>
              <View style={styles.unfocusedContainer}></View>
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          
          <Text style={styles.scanInstruction}>Cadrez le QR Code de l'offre</Text>
        </>
      ) : (
        <ValidationResult result={result} onReset={() => { setScanned(false); setResult(null); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  button: { 
    backgroundColor: "#E65100", 
    borderRadius: 12, 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    marginTop: 30 
  },
  permissionText: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  middleContainer: { flexDirection: 'row', height: 250 },
  focusedContainer: { width: 250, borderWidth: 2, borderColor: '#E65100', borderRadius: 12 },
  scanInstruction: { 
    position: 'absolute', 
    bottom: 100, 
    width: '100%', 
    textAlign: 'center', 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  }
});