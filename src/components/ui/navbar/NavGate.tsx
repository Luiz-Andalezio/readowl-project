"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/ui/navbar/Navbar';
import { useSession } from 'next-auth/react';

const HIDDEN_PREFIXES = ['/login', '/register', '/', '/landing', '/landing/contact', '/landing/privacy', '/landing/terms', '/landing/help', '/landing/security', '/forgot-password', '/reset-password', '/reset-password/success'];

export default function NavGate() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // If not logged in, never render the app Navbar
  if (!session) return null;
  const hide = HIDDEN_PREFIXES.some((p) => pathname === p || pathname?.startsWith(p + '/'));
  if (hide) return null;
  return <Navbar />;
}
