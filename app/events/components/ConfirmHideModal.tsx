"use client";
import React, { useEffect, useImperativeHandle, useState, forwardRef, memo } from 'react';
import { Modal, message } from 'antd';
import { API_URL } from '@/lib/config';
import { useI18n } from '@/i18n/I18nProvider';

export type HideModalHandle = {
  open: (eventId: string) => void;
};

export const ConfirmHideModal = memo(
  forwardRef<HideModalHandle, { onHidden?: (eventId: string) => void }>(( { onHidden }, ref) => {
    const { t } = useI18n();
    const [messageApi] = message.useMessage();

    const [open, setOpen] = useState(false);
    const [eventId, setEventId] = useState<string | null>(null);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    useImperativeHandle(ref, () => ({
      open: (id: string) => {
        setEventId(id);
        setOpen(true);
      }
    }), []);

    if (!mounted) return null;

    return (
      <Modal
        open={open}
        title={t('events.hide.title')}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          if (!eventId) return;
          try {
            const resp = await fetch(`${API_URL}/admin/events/${eventId}/hidden`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ hidden: true })
            });
            if (resp.ok) {
              messageApi.success(t('events.hide.success'));
              setOpen(false);
              onHidden?.(eventId);
            } else {
              messageApi.error(t('events.hide.error'));
            }
          } catch {
            messageApi.error(t('events.hide.error'));
          }
        }}
        okText={t('events.hide.confirm')}
      >
        <p>{t('events.hide.confirmMessage')}</p>
      </Modal>
    );
  })
);
