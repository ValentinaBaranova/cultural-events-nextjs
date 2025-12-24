import 'antd/dist/reset.css';
import '@/ui/global.css';
import { SessionProvider } from "next-auth/react";
import NavBar from '@/ui/navbar';
import { I18nProvider } from '@/i18n/I18nProvider';
import AntdLocaleProvider from '@/antd/AntdLocaleProvider';
import ConsentBanner from '@/consent/ConsentBanner';
import GATracker from '@/consent/GATracker';
import Container from '@/ui/Container';

export default function RootLayout({
   children,
}: {
    children: React.ReactNode;
}) {
    return (
    <SessionProvider>
        <html lang="es">
        <body className="bg-background text-foreground min-h-screen">
        {/* Cookie/Consent banner and conditional GA loading */}
        <GATracker />
        <I18nProvider>
            <AntdLocaleProvider>
                <NavBar />
                <main>
                  <Container className="py-6">
                    {children}
                  </Container>
                </main>
                <Container className="py-6">
                  <ConsentBanner />
                </Container>
            </AntdLocaleProvider>
        </I18nProvider>
        </body>
        </html>
    </SessionProvider>
    );
}
