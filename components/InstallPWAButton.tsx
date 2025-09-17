// components/InstallPWAButton.tsx
"use client";
import React, { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const nav: any = window.navigator;
    const isStandaloneNow =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (nav.standalone === true); // iOS Safari
    setIsStandalone(isStandaloneNow);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handler = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  if (isStandalone) return null; // уже встановлено – кнопку ховаємо

  const onClick = async () => {
    if (promptEvent) {
      // ANDROID
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      // optional: telemetry choice.outcome
      return;
    }
    if (isIOS) {
      // iOS – покажемо коротку підказку
      alert("Щоб встановити застосунок на iPhone:\n\nПоділитися (значок ↑) → Додати на початковий екран.");
      return;
    }
    // Інші платформи
    alert("Встановлення підтримується на Android/Chrome. На iOS використайте 'Додати на початковий екран'.");
  };

  return (
    <button className="board-btn" onClick={onClick}>
      Встановити
    </button>
  );
}
