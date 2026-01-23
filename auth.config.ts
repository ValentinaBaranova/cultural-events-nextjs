import NextAuth, {NextAuthConfig} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {API_URL} from "@/lib/config";

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
    },
    debug: true,
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: {label: "Email", type: "text"},
                password: {label: "Password", type: "password"}
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log('Missing email or password');
                    throw new Error('Missing email or password');
                }
                try {
                    const response = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({email: credentials.email, password: credentials.password}),
                    });

                    if (!response.ok) {
                        console.log('Login Failed:', await response.json());
                        throw new Error('Invalid credentials');
                    }

                    const user = await response.json();
                    console.log('Authorized User:', user); // ✅ Debugging step 3
                    return {id: user.id, email: user.email};

                } catch (error) {
                    console.error('Error in authorize function:', error);
                    throw new Error('Authentication failed');
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async session({ session, token }) {
            // When unauthenticated, NextAuth passes `session` as null. Return it as is to avoid 500 errors.
            if (!session) return session;

            // Only augment the session when we have a valid token/user
            if (token?.sub && session.user) {
                (session.user as any).id = token.sub as string;
                if (token.email) {
                    (session.user as any).email = token.email as string;
                }
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = (user as any).id || '';
                token.email = user.email || '';
            }
            return token;
        }
    }
};

export const {auth} = NextAuth(authConfig);
