import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export function useTrial() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsPremium(localStorage.getItem("qadeyti_premium") === "true");
    }

    // Add window listener to sync state changes if mutated in other components
    const handleStorageChange = () => {
      setIsPremium(localStorage.getItem("qadeyti_premium") === "true");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const togglePremium = (val: boolean) => {
    setIsPremium(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("qadeyti_premium", val ? "true" : "false");
      // Dispatch storage event to sync all windows
      window.dispatchEvent(new Event("storage"));
    }
  };

  if (!user) {
    return {
      isTrialActive: false,
      daysRemaining: 0,
      isTrialExpired: false,
      isPremium: false,
      togglePremium,
    };
  }

  if (isPremium) {
    return {
      isTrialActive: true,
      daysRemaining: 365,
      isTrialExpired: false,
      isPremium: true,
      togglePremium,
    };
  }

  // Get registration date or default to now
  const createdDate = user.created_at ? new Date(user.created_at) : new Date();
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 7 - diffDays);
  const isTrialExpired = diffDays >= 7;

  return {
    isTrialActive: !isTrialExpired,
    daysRemaining,
    isTrialExpired,
    isPremium: false,
    togglePremium,
  };
}
