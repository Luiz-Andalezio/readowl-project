"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Modal from "./Modal";

// Persistent boolean state with hydration protection
function usePersistentBoolean(
    key: string,
    initial: boolean
): [boolean, React.Dispatch<React.SetStateAction<boolean>>, boolean] {
    const [value, setValue] = useState(initial);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // Try to load value from localStorage on mount
        try {
            const raw = localStorage.getItem(key);
            if (raw !== null) setValue(JSON.parse(raw));
        } catch { }
        setHydrated(true);
    }, [key]);

    useEffect(() => {
        // Save value to localStorage after hydration
        if (!hydrated) return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch { }
    }, [key, value, hydrated]);

    return [value, setValue, hydrated];
}

interface NavItem {
    key: string;
    label: string;
    href?: string;
    icon: string;
    onClick?: () => void;
}

const HOVER_DELAY = 500; // ms for tooltip delay

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();

    // Sidebar open state, persistent
    const [open, setOpen, hydrated] = usePersistentBoolean("readowl_nav_open", false);

    // Controls if transitions should be enabled (avoids animation on initial load)
    const [transitionsReady, setTransitionsReady] = useState(false);

    // Controls the "blip" (expand menu) tooltip
    const [showBlip, setShowBlip] = useState(true);

    // Controls the logout confirmation modal
    const [logoutModal, setLogoutModal] = useState(false);

    // Controls which tooltip is currently active
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    // Stores hover timers for tooltips
    const hoverTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const hasUnread = false; // TODO: implement unread notifications

    // Hide the blip after opening or after a timeout
    useEffect(() => {
        if (open) setShowBlip(false);
        const t = setTimeout(() => setShowBlip(false), 6000);
        return () => clearTimeout(t);
    }, [open]);

    // Enable transitions only after hydration to avoid animation on load
    useEffect(() => {
        if (hydrated) {
            const id = requestAnimationFrame(() => setTransitionsReady(true));
            return () => cancelAnimationFrame(id);
        }
    }, [hydrated]);

    // Toggle sidebar open/close
    const toggle = useCallback(() => setOpen(o => !o), [setOpen]);

    // Navigate to a given href
    const go = (href?: string) => {
        if (href) router.push(href);
    };

    // Navigation items
    const items: NavItem[] = [
        { key: "home", label: "Home", href: "/home", icon: "/img/svg/navbar/home.svg" },
        { key: "search", label: "Buscar", href: "/search", icon: "/img/svg/navbar/search.svg" },
        { key: "library", label: "Biblioteca", href: "/library", icon: "/img/svg/navbar/book1.svg" },
        {
            key: "notification",
            label: "Notificações",
            href: "/notifications",
            icon: hasUnread
                ? "/img/svg/navbar/unread-notification.svg"
                : "/img/svg/navbar/notification.svg",
        },
        {
            key: "account",
            label: "Conta",
            href: "/user",
            icon: session?.user?.image || "/img/svg/navbar/account-box.svg",
        },
        {
            key: "logout",
            label: "Sair",
            icon: "/img/svg/navbar/logout.svg",
            onClick: () => setLogoutModal(true),
        },
    ];

    // Show tooltip after hover delay
    const handleEnter = (k: string) => {
        hoverTimers.current[k] = setTimeout(() => setActiveTooltip(k), HOVER_DELAY);
    };

    // Hide tooltip and clear timer
    const handleLeave = (k: string) => {
        clearTimeout(hoverTimers.current[k]);
        setActiveTooltip(p => (p === k ? null : p));
    };

    // Don't render until hydrated (avoids SSR mismatch)
    if (!hydrated)
        return (
            <nav
                className="fixed left-4 top-1/2 -translate-y-1/2 w-16 h-[72px] flex items-center justify-center rounded-3xl bg-readowl-purple-medium opacity-0 "
                aria-hidden
            />
        );

    return (
        <>
            {/* Main navigation bar */}
            <nav
                className={`fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-start ${open ? "pt-4 pb-4" : "py-2"
                    } rounded-3xl shadow-xl border border-readowl-purple-light/30 bg-readowl-purple-medium w-16 ${transitionsReady
                        ? "transition-[padding,height] duration-400"
                        : "transition-none"
                    }`}
                aria-label="Navigation bar"
            >
                {/* Logo button (expand/collapse) */}
                <button
                    onClick={toggle}
                    onMouseEnter={() => handleEnter("logo")}
                    onMouseLeave={() => handleLeave("logo")}
                    aria-label={open ? "Collapse menu" : "Expand menu"}
                    className={`relative w-12 h-12 flex items-center justify-center rounded-2xl hover:brightness-110 ${open ? '' : 'mt-2'}`}
                    tabIndex={-1}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/img/mascot/logo.png"
                        alt="Logo"
                        className="w-11 h-11 object-contain"
                    />
                    {/* Show blip tooltip when menu is collapsed */}
                    {showBlip && !open && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-readowl-purple-extralight text-readowl-purple-dark text-[11px] font-medium px-3 py-2 rounded-xl shadow-lg animate-blip whitespace-nowrap">
                            Clique para expandir o menu
                        </div>
                    )}
                    {/* Show tooltip on hover */}
                    {activeTooltip === "logo" && !showBlip && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 tooltip-base">
                            {open ? "Retrair" : "Expandir"}
                        </div>
                    )}
                </button>
                {/* Navigation items */}
                <div
                    className={`flex flex-col items-center gap-3 mt-4 ${transitionsReady
                            ? "transition-all duration-500"
                            : "transition-none"
                        } ${open
                            ? "opacity-100 max-h-[640px] overflow-visible"
                            : "opacity-0 max-h-0 overflow-hidden pointer-events-none"
                        }`}
                >
                    {items.map(item => {
                        const active = item.href ? pathname.startsWith(item.href) : false;
                        const isAccount =
                            item.key === "account" && !!session?.user?.image;
                        return (
                            <button
                                key={item.key}
                                onClick={() =>
                                    item.onClick ? item.onClick() : go(item.href)
                                }
                                onMouseEnter={() => handleEnter(item.key)}
                                onMouseLeave={() => handleLeave(item.key)}
                                aria-label={item.label}
                                className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-readowl-purple-light/60 ${active
                                        ? "bg-readowl-purple-dark/40 ring-2 ring-readowl-purple-light/70"
                                        : "bg-readowl-purple-light/20 hover:bg-readowl-purple-light/35"
                                    }`}
                            >
                                {isAccount ? (
                                    // Show user avatar if logged in
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={session!.user!.image!}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-readowl-purple-light/70"
                                    />
                                ) : (
                                    // Show icon for other items
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={item.icon}
                                        alt={item.label}
                                        className="w-7 h-7"
                                    />
                                )}
                                {/* Tooltip for navigation item */}
                                {activeTooltip === item.key && (
                                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 tooltip-base whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
            {/* Tooltip and animation styles */}
            <style jsx global>{`
                .tooltip-base {
                    background: #F0EAFF;
                    color: #2F0959;
                    font-size: 11px;
                    padding: 6px 10px;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.4);
                    animation: fadeIn 0.25s ease forwards;
                }
                @keyframes blip {
                    0% {
                        transform: translateY(-4px);
                        opacity: 0;
                    }
                    15% {
                        opacity: 1;
                    }
                    85% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-4px);
                        opacity: 0;
                    }
                }
                .animate-blip {
                    animation: blip 5s ease forwards;
                }
            `}</style>
            {/* Logout confirmation modal */}
            <Modal
                open={logoutModal}
                onClose={() => setLogoutModal(false)}
                title="Confirmar logout"
                actions={
                    <>
                        <button
                            onClick={() => setLogoutModal(false)}
                            className="px-4 py-2 rounded-full bg-readowl-purple-light/30 hover:bg-readowl-purple-light/40 text-readowl-purple-extralight text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="px-4 py-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold shadow"
                        >
                            Sair
                        </button>
                    </>
                }
            >
                Tem certeza que deseja sair e finalizar sua sessão?
            </Modal>
        </>
    );
}