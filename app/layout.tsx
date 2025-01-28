import '@/ui/global.css';
import NavBar from '@/ui/navbar';

export default function RootLayout({
   children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
        <NavBar />
        {children}</body>
        </html>
    );
}
