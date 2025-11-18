import 'antd/dist/reset.css';
import '@/ui/global.css';
import { SessionProvider } from "next-auth/react";
import NavBar from '@/ui/navbar';
import { I18nProvider } from '@/i18n/I18nProvider';
import AntdLocaleProvider from '@/antd/AntdLocaleProvider';
import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
   children,
}: {
    children: React.ReactNode;
}) {
    return (
    <SessionProvider>
        <html lang="es">
        <body>
        {/* Google Analytics 4 */}
        {GA_MEASUREMENT_ID ? (
            <>
                <Script
                    src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                    strategy="afterInteractive"
                />
                <Script id="ga4-init" strategy="afterInteractive">{`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);} 
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}');
                `}</Script>
            </>
        ) : null}
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
