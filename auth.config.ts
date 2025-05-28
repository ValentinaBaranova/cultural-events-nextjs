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
        async session({session, token}) { // ✅ Ensure `session` callback is `async`
            session.user = {id: token.sub as string, email: token.email as string, emailVerified: null};
            return session;
        },
        async jwt({token, user}) { // ✅ Ensure `jwt` callback is `async`
            if (user) {
                token.sub = user.id || '';
                token.email = user.email || '';
            }
            return token;
        }
    }
};

export const {auth} = NextAuth(authConfig);
