'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useI18n } from '@/i18n/I18nProvider';
import LanguageSwitcher from '@/ui/LanguageSwitcher';
import { SHOW_AUTH_BUTTONS } from '@/lib/config';
import Container from '@/ui/Container';

const NavBar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (href: string) => pathname === href;

    const linkClass = (href: string) =>
      `${isActive(href) ? 'text-foreground font-semibold' : 'text-muted-foreground'} hover:text-foreground`;

    return (
        <header className="border-b border-border bg-white">
            <Container className="h-16 flex items-center justify-between">
                {/* Left: Logo/Title */}
                <Link href="/events" className="text-lg">
                    {t('app.title')}
                </Link>

                {/* Right: Nav + language + auth */}
                <div className="hidden sm:flex items-center gap-6">
                    <nav className="flex items-center gap-4 text-sm">
                        <Link href="/events" className={linkClass('/events')}>
                            {t('menu.events')}
                        </Link>
                        <Link href="/about" className={linkClass('/about')}>
                            {t('menu.about')}
                        </Link>
                        <Link href="/contact" className={linkClass('/contact')}>
                            {t('menu.contact')}
                        </Link>
                        <Link href="/privacy" className={linkClass('/privacy')}>
                            {t('menu.privacy')}
                        </Link>
                    </nav>

                    <LanguageSwitcher />
                    {SHOW_AUTH_BUTTONS && (
                        session?.user ? (
                            <Link href="#" onClick={(e) => { e.preventDefault(); signOut(); }} className="px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 transition">
                                {t('auth.logout')}
                            </Link>
                        ) : (
                            <Link href="#" onClick={(e) => { e.preventDefault(); signIn(); }} className="px-3 py-1.5 rounded-md bg-violet-500 text-white hover:bg-violet-600 transition">
                                {t('auth.login')}
                            </Link>
                        )
                    )}
                </div>

                {/* Mobile controls: Language + Burger */}
                <div className="sm:hidden flex items-center gap-3">
                    <LanguageSwitcher />
                    <button
                        type="button"
                        aria-label={isOpen ? t('menu.close', 'Close menu') : t('menu.open', 'Open menu')}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                        className="inline-flex items-center justify-center p-2 rounded-md border border-border text-foreground hover:bg-muted"
                        onClick={() => setIsOpen((v) => !v)}
                    >
                        {/* Icon: hamburger / close */}
                        <svg className={`h-6 w-6 ${isOpen ? 'hidden' : 'block'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                        </svg>
                        <svg className={`h-6 w-6 ${isOpen ? 'block' : 'hidden'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </Container>

            {/* Mobile dropdown */}
            <div id="mobile-menu" className={`${isOpen ? 'block' : 'hidden'} sm:hidden`}> 
                <Container className="py-3">
                    <div className="flex flex-col gap-3 text-sm">
                        <Link href="/events" className={linkClass('/events')} onClick={() => setIsOpen(false)}>
                            {t('menu.events')}
                        </Link>
                        <Link href="/about" className={linkClass('/about')} onClick={() => setIsOpen(false)}>
                            {t('menu.about')}
                        </Link>
                        <Link href="/contact" className={linkClass('/contact')} onClick={() => setIsOpen(false)}>
                            {t('menu.contact')}
                        </Link>
                        <Link href="/privacy" className={linkClass('/privacy')} onClick={() => setIsOpen(false)}>
                            {t('menu.privacy')}
                        </Link>

                        {SHOW_AUTH_BUTTONS && (
                            <div className="pt-2 flex items-center gap-3">
                                {session?.user ? (
                                    <Link href="#" onClick={(e) => { e.preventDefault(); setIsOpen(false); signOut(); }} className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition text-sm">
                                        {t('auth.logout')}
                                    </Link>
                                ) : (
                                    <Link href="#" onClick={(e) => { e.preventDefault(); setIsOpen(false); signIn(); }} className="px-3 py-1.5 bg-violet-500 text-white rounded-md hover:bg-violet-600 transition text-sm">
                                        {t('auth.login')}
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </Container>
            </div>
        </header>
    );
};

export default NavBar;
