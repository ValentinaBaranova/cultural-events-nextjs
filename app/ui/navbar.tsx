'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

const NavBar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <nav className="flex justify-between items-center p-4 border-b bg-white shadow-md">
            <Link href="/" className={pathname === '/events' ? 'active font-bold' : ''}>
                Events in Buenos Aires
            </Link>

            <div>
                {session?.user ? (
                    <Link href="#" onClick={(e) => { e.preventDefault(); signOut(); }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition">
                        Logout
                    </Link>
                ) : (
                    <Link href="#" onClick={(e) => { e.preventDefault(); signIn(); }} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition">
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default NavBar;
