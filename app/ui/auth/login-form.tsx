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
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white shadow-md rounded">
            <h2 className="text-2xl font-bold mb-4">Login</h2>

            {error && <p className="text-red-500 mb-2">{error}</p>}

            <label className="block mb-2">Email</label>
            <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border rounded mb-4"
            />

            <label className="block mb-2">Password</label>
            <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded mb-4"
            />

            <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-700"
            >
                Login
            </button>
        </form>
    );
}
