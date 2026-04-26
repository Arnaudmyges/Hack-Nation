import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import HomeScreen from "./HomeScreen";
import WalletHistoryScreen from "./WalletHistoryScreen";
import AccountScreen from "./AccountScreen";

type Tab = "home" | "wallet" | "account";

const TABS: { id: Tab; label: string; icon: string; activeIcon: string }[] = [
  { id: "home",    label: "Home",    icon: "○",  activeIcon: "●" },
  { id: "wallet",  label: "Wallet",  icon: "◇",  activeIcon: "◆" },
  { id: "account", label: "Profile", icon: "◎",  activeIcon: "◉" },
];

const MOCK_ROUTE = { params: {} } as any;

export default function ClientNavigator({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  return (
    <View style={styles.root}>
      {/*
        Screens stay mounted at all times — only hidden with display:"none".
        This avoids re-mounting HomeScreen on every tab switch, which would
        leak geofencing intervals and re-trigger location permission dialogs.
      */}
      <View style={[styles.fill, activeTab !== "home" && styles.hidden]}>
        <HomeScreen navigation={navigation} route={MOCK_ROUTE} />
      </View>
      <View style={[styles.fill, activeTab !== "wallet" && styles.hidden]}>
        <WalletHistoryScreen navigation={navigation} route={MOCK_ROUTE} />
      </View>
      <View style={[styles.fill, activeTab !== "account" && styles.hidden]}>
        <AccountScreen navigation={navigation} route={MOCK_ROUTE} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.tabIndicator} />}
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {isActive ? tab.activeIcon : tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  fill: { flex: 1 },
  hidden: { display: "none" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0EDE6",
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E65100",
  },
  tabIcon: { fontSize: 18, color: "#C8C6C0", marginBottom: 3 },
  tabIconActive: { color: "#E65100" },
  tabLabel: { fontSize: 10, fontWeight: "500", color: "#B4B2A9" },
  tabLabelActive: { color: "#E65100", fontWeight: "700" },
});
