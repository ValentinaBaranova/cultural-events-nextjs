'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError('');

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false, // Prevent automatic redirects
        });

        if (result?.error) {
            setError('Invalid email or password');
            return;
        }

        // Redirect to the dashboard after successful login
        router.push('/events');
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-card shadow-md border border-border rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Login</h2>

            {error && <p className="text-destructive mb-2">{error}</p>}

            <label htmlFor="email" className="block mb-2">Email</label>
            <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border border-border bg-background rounded mb-4 focus:outline-none focus:ring-2 focus:ring-brand"
            />

            <label htmlFor="password" className="block mb-2">Password</label>
            <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border border-border bg-background rounded mb-4 focus:outline-none focus:ring-2 focus:ring-brand"
            />

            <button
                type="submit"
                className="w-full bg-brand text-brand-foreground py-2 rounded hover:bg-brand-hover transition-colors"
            >
                Login
            </button>
        </form>
    );
}
