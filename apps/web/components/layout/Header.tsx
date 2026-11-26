'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, Cpu, BookOpen, Settings, Info, Menu, X, ShieldCheck } from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';
import { apiClient } from '../../services/api';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');

  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        await apiClient.getHealth();
        if (isMounted) setBackendStatus('online');
      } catch {
        if (isMounted) setBackendStatus('offline');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/studio', label: 'Studio Hub', icon: Video },
    { href: '/studio/sign-to-speech', label: 'Sign &rarr; Speech' },
    { href: '/studio/speech-to-sign', label: 'Speech &rarr; Sign' },
    { href: '/model-lab', label: 'Model Lab', icon: Cpu },
    { href: '/research', label: 'Research', icon: BookOpen },
    { href: '/about', label: 'About', icon: Info },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-cream/90 backdrop-blur-md border-b border-ink/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-cyan shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-display font-bold text-lg tracking-wider">M</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg text-ink tracking-tight">MIRA-H</span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-cyan/20 text-navy rounded border border-cyan/40">
                v2.0
              </span>
            </div>
            <p className="text-[10px] font-mono text-ink-muted -mt-0.5">Assistive Communication</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-black/5'
                }`}
              >
                {link.icon && <link.icon className="w-3.5 h-3.5" />}
                <span dangerouslySetInnerHTML={{ __html: link.label }} />
              </Link>
            );
          })}
        </nav>

        {/* Right Status Pill & CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-ink/10 text-xs shadow-2xs">
            <StatusIndicator status={backendStatus} />
            <span className="text-[11px] font-mono text-ink-muted">
              API: {backendStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>

          <Link
            href="/studio/sign-to-speech"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan text-ink font-semibold text-xs hover:bg-cyan-glow transition-all shadow-sm"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Launch Studio</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-ink hover:bg-black/5 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 bg-cream border-b border-ink/10 space-y-1 animate-fade-in">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'bg-navy text-white' : 'text-ink hover:bg-black/5'
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: link.label }} />
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
