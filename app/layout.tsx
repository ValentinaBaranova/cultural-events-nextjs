import 'antd/dist/reset.css';
import '@/ui/global.css';
import { SessionProvider } from "next-auth/react";
import NavBar from '@/ui/navbar';
import { I18nProvider } from '@/i18n/I18nProvider';
import AntdLocaleProvider from '@/antd/AntdLocaleProvider';

export default function RootLayout({
   children,
}: {
    children: React.ReactNode;
}) {
    return (
    <SessionProvider>
        <html lang="es">
        <body>
        <I18nProvider>
            <AntdLocaleProvider>
                <NavBar />
                {children}
            </AntdLocaleProvider>
        </I18nProvider>
        </body>
        </html>
    </SessionProvider>
    );
}
