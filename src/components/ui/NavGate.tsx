"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';

const HIDDEN_PREFIXES = ['/login', '/register', '/'];

export default function NavGate() {
  const pathname = usePathname();
  const hide = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (hide) return null;
  return <Navbar />;
}
