import '@/ui/global.css';
import { SessionProvider } from "next-auth/react";
import NavBar from '@/ui/navbar';


export default function RootLayout({
   children,
}: {
    children: React.ReactNode;
}) {
    return (
    <SessionProvider>
        <html lang="en">
        <body>
        <NavBar />
        {children}</body>
        </html>
    </SessionProvider>
    );
}
