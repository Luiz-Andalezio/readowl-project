"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Modal from '../modal/Modal';

interface NavLink { label: string; href: string; };

// Horizontal, sticky, auto-hide-on-scroll navbar
export default function FloatingNavbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();

    const [hidden, setHidden] = useState(false); // visibility on scroll
    // useRef to avoid re-subscribing scroll handler and prevent flicker
    const lastYRef = useRef(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false); // confirm logout modal
    const ticking = useRef(false);

    const links: NavLink[] = [
        { label: 'Biblioteca', href: '/library' },
        { label: 'Notificações', href: '/notifications' },
    ];

    // Scroll hide / show logic
    useEffect(() => {
        const onScroll = () => {
            if (ticking.current) return;
            ticking.current = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                const last = lastYRef.current;
                const delta = y - last;
                // Show when near top always
                if (y < 80) {
                    if (hidden) setHidden(false);
                } else {
                    // Hysteresis thresholds to avoid flicker (larger than original)
                    if (delta > 12 && !hidden) setHidden(true);      // fast enough down
                    else if (delta < -12 && hidden) setHidden(false); // fast enough up
                }
                lastYRef.current = y;
                ticking.current = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [hidden]);

    const go = useCallback((href: string) => {
        setMenuOpen(false);
        router.push(href);
    }, [router]);

    const activeClass = 'text-white after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-full after:bg-white font-semibold';

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-out bg-readowl-purple-medium/95 backdrop-blur-md border-b border-readowl-purple-light/40 overflow-x-hidden ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
                <div className="mx-auto max-w-7xl pl-2 pr-3 sm:px-6">
                    <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4">
                        {/* Logo */}
                        <button onClick={() => go('/home')} className="flex items-center gap-2 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/img/mascot/logo.png" alt="Logo" className="h-9 w-9 sm:h-10 sm:w-10 object-contain drop-shadow" />
                            <span className="hidden md:inline text-white font-yusei tracking-wide text-sm sm:text-base group-hover:opacity-90">Readowl</span>
                        </button>

                        {/* Center nav (desktop) */}
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-4">
                            {links.map(l => {
                                const iconSrc = l.href.startsWith('/notifications') ? '/img/svg/navbar/notification.svg' : '/img/svg/navbar/book1.svg';
                                return (
                                    <button
                                        key={l.href}
                                        onClick={() => go(l.href)}
                                        className={`relative flex items-center gap-1.5 px-1 text-readowl-purple-extralight/80 hover:text-white transition-colors after:transition-opacity after:duration-300 after:ease-out after:bg-white/70 after:h-[2px] after:w-full after:absolute after:left-0 after:-bottom-1 ${pathname?.startsWith(l.href) ? activeClass : 'after:opacity-0 hover:after:opacity-60'}`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={iconSrc} alt="" className="w-4 h-4 opacity-90" />
                                        <span>{l.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Search (desktop) */}
                        <div className="hidden md:flex items-center">
                            <form role="search" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); const q = (data.get('q') as string) || ''; if (q.trim()) router.push('/search?query=' + encodeURIComponent(q.trim())); }} className={`group flex items-center bg-white/95 focus-within:ring-2 ring-offset-0 ring-readowl-purple-light/60 overflow-hidden transition-all duration-300 ${searchOpen ? 'w-72' : 'w-40'} shadow-sm`}>
                                <input
                                    name="q"
                                    placeholder="Pesquisar..."
                                    onFocus={() => setSearchOpen(true)}
                                    onBlur={() => setSearchOpen(false)}
                                    className="bg-transparent px-4 py-1.5 text-sm text-readowl-purple-dark placeholder:text-readowl-purple-dark/60 focus:outline-none w-full"
                                    defaultValue={''}
                                />
                                <button aria-label="Buscar" className="px-3 text-readowl-purple-dark/70 hover:text-readowl-purple-dark">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/img/svg/navbar/search.svg" alt="" className="w-5 h-5" />
                                </button>
                            </form>
                        </div>

                        {/* Right side actions */}
                        <div className="hidden md:flex items-center gap-4">
                            {/* Avatar */}
                            <button onClick={() => go('/user')} className="relative ring-2 ring-transparent hover:ring-readowl-purple-light/60 focus:outline-none focus-visible:ring-readowl-purple-light/80 transition" aria-label="Perfil">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={session?.user?.image || '/img/svg/navbar/account-box.svg'} alt="Perfil" className="w-9 h-9 object-cover" />
                            </button>
                            {/* Logout */}
                            <button onClick={() => setLogoutOpen(true)} className="flex items-center gap-1.5 text-readowl-purple-extralight/80 hover:text-white text-sm font-medium transition-colors" aria-label="Sair">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/img/svg/navbar/logout.svg" alt="" className="w-4 h-4" />
                                <span>Sair</span>
                            </button>
                        </div>

                        {/* Hamburger (mobile) */}
                        <button aria-label="Menu" onClick={() => setMenuOpen(o => !o)} className="md:hidden flex items-center justify-center w-9 h-9 text-white/90 hover:bg-white/10 active:scale-95 transition overflow-hidden ml-auto">
                            <span className="sr-only">Abrir menu</span>
                            <div className="flex flex-col gap-1.5">
                                <span className={`block h-0.5 w-6 bg-current transition ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`}></span>
                                <span className={`block h-0.5 w-6 bg-current transition ${menuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`block h-0.5 w-6 bg-current transition ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}></span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile menu panel */}
                <div className={`md:hidden transition-[max-height,opacity] duration-300 overflow-hidden bg-readowl-purple-medium/95 backdrop-blur w-full ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                    <div className="px-4 pb-4 pt-1 flex flex-col gap-4">
                        <form role="search" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); const q = (data.get('q') as string) || ''; setMenuOpen(false); if (q.trim()) router.push('/search?query=' + encodeURIComponent(q.trim())); }} className="flex items-center bg-white overflow-hidden shadow">
                            <input name="q" placeholder="Pesquisar..." className="flex-1 px-4 py-2 text-sm text-readowl-purple-dark placeholder:text-readowl-purple-dark/60 focus:outline-none" />
                            <button aria-label="Buscar" className="px-3 text-readowl-purple-dark/70">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/img/svg/navbar/search.svg" alt="" className="w-5 h-5" />
                            </button>
                        </form>
                        <nav className="flex flex-col gap-1">
                            {links.map(l => {
                                const iconSrc = l.href.startsWith('/notifications') ? '/img/svg/navbar/notification.svg' : '/img/svg/navbar/book1.svg';
                                return (
                                    <button key={l.href} onClick={() => go(l.href)} className={`flex items-center gap-2 text-left px-3 py-2 text-sm font-medium transition-colors ${pathname?.startsWith(l.href) ? 'bg-readowl-purple-dark/40 text-white' : 'text-readowl-purple-extralight/85 hover:bg-readowl-purple-light/20 hover:text-white'}`}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={iconSrc} alt="" className="w-5 h-5" />
                                        <span>{l.label}</span>
                                    </button>
                                );
                            })}
                            <button onClick={() => go('/user')} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${pathname?.startsWith('/user') ? 'bg-readowl-purple-dark/40 text-white' : 'text-readowl-purple-extralight/85 hover:bg-readowl-purple-light/20 hover:text-white'}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={session?.user?.image || '/img/svg/navbar/account-box.svg'} alt="Avatar" className="w-8 h-8 object-cover" />
                                <span>Perfil</span>
                            </button>
                            <button onClick={() => { setMenuOpen(false); setLogoutOpen(true); }} className="flex items-center gap-2 text-left px-3 py-2 text-sm font-medium text-readowl-purple-extralight/85 hover:bg-red-500/20 hover:text-white transition-colors">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/img/svg/navbar/logout.svg" alt="" className="w-5 h-5" />
                                <span>Sair</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Logout confirmation modal */}
            <Modal
                open={logoutOpen}
                onClose={() => setLogoutOpen(false)}
                title="Confirmar logout"
                ariaLabel="Confirm logout"
                actions={(
                    <>
                        <button
                            onClick={() => setLogoutOpen(false)}
                            className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition"
                        >Cancelar</button>
                        <button
                            onClick={() => { setLogoutOpen(false); signOut({ callbackUrl: '/landing' }); }}
                            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow transition"
                        >Sair</button>
                    </>
                )}
            >
                <p className="text-white/90">Tem certeza que deseja encerrar sua sessão?</p>
            </Modal>
        </>
    );
}