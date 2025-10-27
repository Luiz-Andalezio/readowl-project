"use client";
import React from "react";

interface LoadingScreenProps {
  text?: string;
  delayMs?: number;
  children?: React.ReactNode;
}

export default function LoadingScreen({ text = "Carregando…", delayMs = 5000, children }: LoadingScreenProps) {
  const [showContent, setShowContent] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);
  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-readowl-purple-extradark">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-readowl-purple-medium"></div>
        <span className="ml-6 text-readowl-purple-medium font-ptserif text-xl">{text}</span>
      </div>
    );
  }
  return <>{children}</>;
}
