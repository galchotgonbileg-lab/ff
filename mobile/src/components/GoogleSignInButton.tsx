import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { GOOGLE_CLIENT_ID } from "../config/google";

let scriptPromise: Promise<void> | null = null;
function loadGoogleScript() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google script"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export function GoogleSignInButton({ onToken }: { onToken: (idToken: string) => void }) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript().then(() => {
      if (cancelled || !ref.current) return;
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => onToken(response.credential),
      });
      google.accounts.id.renderButton(ref.current, {
        theme: "filled_black",
        size: "large",
        width: 320,
        shape: "pill",
        text: "continue_with",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [onToken]);

  if (Platform.OS !== "web" || !GOOGLE_CLIENT_ID) return null;

  return <View ref={ref} style={{ alignItems: "center", marginTop: 8 }} />;
}
