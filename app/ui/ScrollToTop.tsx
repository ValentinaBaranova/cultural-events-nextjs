'use client';

import { useEffect, useState } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/i18n/I18nProvider';

export default function ScrollToTop() {
    const { t } = useI18n();
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set the top cordinate to 0
    // make scrolling smooth
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    return (
        <>
            {isVisible && (
                <button
                    type="button"
                    onClick={scrollToTop}
                    className={`
                        fixed z-50
                        flex items-center justify-center
                        w-12 h-12 rounded-full shadow-lg
                        bg-primary hover:bg-primary-hover
                        text-brand transition-all duration-300
                        focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
                        bottom-4 right-4 md:bottom-8 md:right-8
                    `}
                    aria-label={t('common.backToTop')}
                    title={t('common.backToTop')}
                >
                    <ChevronUpIcon className="w-6 h-6" aria-hidden="true" />
                </button>
            )}
        </>
    );
}
