// app/hooks/useGeofencing.ts
// Watches position in background, fires when user enters merchant radius
// Person A calls startGeofencing() on app launch

import * as Location from "expo-location";
import { CITY_CONFIG } from "../config/city";
import { fetchNearbyMerchants } from "../services/contextService";

export function useGeofencing(onMerchantEntered: (merchant: any) => void) {
  const startGeofencing = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    // Poll every 30s (background task in production)
    const interval = setInterval(async () => {
      const { coords } = await Location.getCurrentPositionAsync({});
      const nearby = await fetchNearbyMerchants(coords.latitude, coords.longitude);

      for (const merchant of nearby) {
        const dlat = (merchant.lat - coords.latitude) * 111000;
        const dlng = (merchant.lng - coords.longitude) * 111000;
        const dist = Math.sqrt(dlat*dlat + dlng*dlng);

        if (dist < CITY_CONFIG.geofenceRadius) {
          console.log("Geofence entered:", merchant.name, dist + "m");
          onMerchantEntered(merchant);
          clearInterval(interval); // one trigger at a time
          break;
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  return { startGeofencing };
}