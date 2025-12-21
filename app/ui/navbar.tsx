'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useI18n } from '@/i18n/I18nProvider';
import LanguageSwitcher from '@/ui/LanguageSwitcher';
import { SHOW_AUTH_BUTTONS } from '@/lib/config';

const NavBar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (href: string) => pathname === href;

    return (
        <nav className="p-4 border-b bg-white shadow-md">
            <div className="flex justify-between items-center">
                <Link href="/events" className="font-bold">
                    {t('app.title')}
                </Link>

                {/* Desktop menu */}
                <div className="hidden sm:flex items-center gap-6">
                    <div className="flex items-center gap-3 text-sm">
                        <Link href="/events" className={isActive('/events') ? 'active font-semibold' : ''}>
                            {t('menu.events')}
                        </Link>
                        <span>|</span>
                        <Link href="/about" className={isActive('/about') ? 'active font-semibold' : ''}>
                            {t('menu.about')}
                        </Link>
                        <span>|</span>
                        <Link href="/contact" className={isActive('/contact') ? 'active font-semibold' : ''}>
                            {t('menu.contact')}
                        </Link>
                        <span>|</span>
                        <Link href="/privacy" className={isActive('/privacy') ? 'active font-semibold' : ''}>
                            {t('menu.privacy')}
                        </Link>
                    </div>

                    <LanguageSwitcher />
                    {SHOW_AUTH_BUTTONS && (
                        session?.user ? (
                            <Link href="#" onClick={(e) => { e.preventDefault(); signOut(); }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition">
                                {t('auth.logout')}
                            </Link>
                        ) : (
                            <Link href="#" onClick={(e) => { e.preventDefault(); signIn(); }} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition">
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
                        className="inline-flex items-center justify-center p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
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
            </div>

            {/* Mobile dropdown */}
            <div id="mobile-menu" className={`${isOpen ? 'block' : 'hidden'} sm:hidden mt-3`}>
                <div className="flex flex-col gap-3 text-sm">
                    <Link href="/events" className={isActive('/events') ? 'active font-semibold' : ''} onClick={() => setIsOpen(false)}>
                        {t('menu.events')}
                    </Link>
                    <Link href="/about" className={isActive('/about') ? 'active font-semibold' : ''} onClick={() => setIsOpen(false)}>
                        {t('menu.about')}
                    </Link>
                    <Link href="/contact" className={isActive('/contact') ? 'active font-semibold' : ''} onClick={() => setIsOpen(false)}>
                        {t('menu.contact')}
                    </Link>
                    <Link href="/privacy" className={isActive('/privacy') ? 'active font-semibold' : ''} onClick={() => setIsOpen(false)}>
                        {t('menu.privacy')}
                    </Link>

                    {SHOW_AUTH_BUTTONS && (
                        <div className="pt-2 flex items-center gap-3">
                            {session?.user ? (
                                <Link href="#" onClick={(e) => { e.preventDefault(); setIsOpen(false); signOut(); }} className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-700 transition text-sm">
                                    {t('auth.logout')}
                                </Link>
                            ) : (
                                <Link href="#" onClick={(e) => { e.preventDefault(); setIsOpen(false); signIn(); }} className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-700 transition text-sm">
                                    {t('auth.login')}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
