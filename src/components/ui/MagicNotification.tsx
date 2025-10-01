"use client";
import React, { useEffect, useState } from "react";

export interface MagicNotificationProps {
    id: string;
    icon?: React.ReactNode;
    message: string;
    bgClass?: string;
    duration?: number;
    onClose: (id: string) => void;
}

const bgFallback = "bg-readowl-purple-dark";

const MagicNotification: React.FC<MagicNotificationProps> = ({ id, icon, message, bgClass, duration = 5000, onClose }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => startClose(), duration);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    const startClose = () => {
        setExiting(true);
        setTimeout(() => onClose(id), 450);
    };

    return (
        <div
            className={`relative z-[200] w-full max-w-sm text-white flex items-start gap-3 px-4 py-3 shadow-xl border border-white/10 overflow-hidden transition-all duration-450 ${bgClass || bgFallback} ${exiting ? 'animate-magic-out' : 'animate-magic-in'}`}
            role="alert"
        >
            <div className="text-xl select-none leading-none mt-[2px]">{icon || '🦉'}</div>
            <div className="text-sm font-medium pr-6">{message}</div>
            <button
                type="button"
                aria-label="Fechar"
                onClick={startClose}
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                ✕
            </button>
            <span className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 bg-white/20 blur-2xl" />
        </div>
    );
};

export default MagicNotification;
