import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export interface DashboardStats {
  offers_generated: number;
  offers_accepted: number;
  offers_redeemed: number;
  offers_declined: number;
  acceptance_rate: number;
  redemption_rate: number;
  avg_discount_pct: number;
  last_redemption_at: string | null;
}

export interface RecentRedemption {
  id: string;
  token: string;
  status: string;
  redeemed_at: string | null;
  created_at: string;
  offers: {
    headline: string;
    discount_pct: number;
    user_id: string; // Ajouté
    profiles: {       // Ajouté
      display_name: string;
    } | null;
    merchants: {
      name: string;
    };
  };
}

const EMPTY_STATS: DashboardStats = {
  offers_generated: 0,
  offers_accepted: 0,
  offers_redeemed: 0,
  offers_declined: 0,
  acceptance_rate: 0,
  redemption_rate: 0,
  avg_discount_pct: 0,
  last_redemption_at: null,
};

export function useMerchantDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentRedemptions, setRecentRedemptions] = useState<RecentRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data: offers } = await supabase
        .from("offers")
        .select("status, discount_pct");

      const { data: redemptions } = await supabase
        .from("redemptions")
        .select(`
          id, token, status, redeemed_at, created_at,
          offers (
            headline, discount_pct, user_id,
            profiles ( display_name ),
            merchants ( name )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!offers) return;

      const formattedRedemptions: RecentRedemption[] = (redemptions || []).map((r: any) => {
        const offerData = Array.isArray(r.offers) ? r.offers[0] : r.offers;
        
        return {
          ...r,
          offers: {
            ...offerData,
            merchants: Array.isArray(offerData?.merchants) 
              ? offerData.merchants[0] 
              : (offerData?.merchants || { name: "Inconnu" }),
            profiles: Array.isArray(offerData?.profiles)
              ? offerData.profiles[0]
              : (offerData?.profiles || null)
          }
        };
      });

      const generated = offers.length;
      const accepted = offers.filter((o) =>
        ["accepted", "redeemed"].includes(o.status)
      ).length;
      const redeemed = offers.filter((o) => o.status === "redeemed").length;
      const declined = offers.filter((o) => o.status === "declined").length;
      const avgDiscount = generated > 0
          ? Math.round(offers.reduce((sum, o) => sum + (o.discount_pct ?? 0), 0) / generated)
          : 0;

      const lastRedemption = formattedRedemptions.find((r) => r.status === "redeemed")?.redeemed_at ?? null;

      setStats({
        offers_generated: generated,
        offers_accepted: accepted,
        offers_redeemed: redeemed,
        offers_declined: declined,
        acceptance_rate: generated > 0 ? Math.round((accepted / generated) * 100) : 0,
        redemption_rate: accepted > 0 ? Math.round((redeemed / accepted) * 100) : 0,
        avg_discount_pct: avgDiscount,
        last_redemption_at: lastRedemption,
      });

      setRecentRedemptions(formattedRedemptions);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "redemptions" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { stats, recentRedemptions, loading, refresh: fetchStats };
}