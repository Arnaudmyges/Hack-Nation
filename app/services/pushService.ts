import * as Notifications from "expo-notifications";

// ── Configuration globale (appeler au démarrage de l'app) ──
export async function setupPushNotifications() {
  // Comportement quand une notif arrive (app ouverte)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true, 
      shouldShowList: true,
    }),
  });

  // Demander la permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn("Permission notifications refusée");
    return false;
  }

  console.log("✅ Push notifications configurées");
  return true;
}

// ── Envoyer une notification quand une offre est générée ──
export async function sendOfferNotification(offer: {
  merchant_name: string;
  headline: string;
  discount_pct: number;
  distance_meters: number;
  id?: string;
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${offer.merchant_name} · ${offer.distance_meters}m`,
      body: offer.headline,
      data: { offerId: offer.id, screen: "Home" },
      subtitle: `−${offer.discount_pct}% · Limited offer`,
    },
    trigger: null, // Immédiat
  });
  console.log("✅ Push envoyée:", offer.headline);
}

// ── Listener : tap sur notif → deep link ──
export function setupNotificationListener(
  onNotificationTap: (offerId: string) => void
) {
  const subscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      // On extrait l'ID et on dit à TS que c'est une string
      const offerId = response.notification.request.content.data?.offerId;

      // On vérifie que c'est bien une string avant d'appeler la fonction
      if (typeof offerId === "string") {
        console.log("Notification tappée, offerId:", offerId);
        onNotificationTap(offerId);
      }
    });

  return subscription;
}