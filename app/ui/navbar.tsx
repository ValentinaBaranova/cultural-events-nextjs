'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavBar = () => {
    const pathname = usePathname();

    return (
        <nav className="navbar">
            <Link href="/" className={pathname === '/events' ? 'active' : ''}>
                Events in Buenos Aires
            </Link>
        </nav>
    );
};

export default NavBar;
