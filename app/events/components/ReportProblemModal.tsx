"use client";
import React, { useEffect, useImperativeHandle, useMemo, useState, forwardRef, memo } from 'react';
import { Modal, Radio, Input, message } from 'antd';
import { API_URL } from '@/lib/config';
import { useI18n } from '@/i18n/I18nProvider';

export type ReportModalHandle = {
  open: (eventId: string) => void;
};

export const ReportProblemModal = memo(
  forwardRef<ReportModalHandle, { locale: string }>(( { locale }, ref) => {
    const { t } = useI18n();
    const [messageApi] = message.useMessage();

    const [open, setOpen] = useState(false);
    const [eventId, setEventId] = useState<string | null>(null);
    const [reason, setReason] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const reasons = useMemo(() => ['wrongDateTime','wrongVenue','wrongPrice','duplicate','canceled','other'], []);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    useImperativeHandle(ref, () => ({
      open: (id: string) => {
        setEventId(id);
        setReason('');
        setComment('');
        setOpen(true);
      }
    }), []);

    if (!mounted) return null;

    return (
      <Modal
        open={open}
        title={t('events.report.title')}
        forceRender
        onCancel={() => setOpen(false)}
        onOk={async () => {
          if (!eventId || !reason) {
            messageApi.warning(t('events.report.reason'));
            return;
          }
          try {
            const resp = await fetch(`${API_URL}/events/${eventId}/report`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason, comment, locale })
            });
            if (resp.ok) {
              messageApi.success(t('events.report.success'));
              setOpen(false);
            } else {
              messageApi.error(t('events.report.error'));
            }
          } catch {
            messageApi.error(t('events.report.error'));
          }
        }}
        okButtonProps={{ disabled: !reason }}
      >
        <div className="space-y-3">
          <div>
            <div className="mb-2 text-sm font-medium">{t('events.report.reason')}</div>
            <Radio.Group value={reason} onChange={(e) => setReason(e.target.value)}>
              <div className="flex flex-col gap-2">
                {reasons.map((key) => (
                  <Radio key={key} value={key}>{t(`events.report.reasons.${key}`)}</Radio>
                ))}
              </div>
            </Radio.Group>
          </div>
          {reason === 'other' && (
            <Input.TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('events.report.otherPlaceholder')}
              rows={3}
            />
          )}
        </div>
      </Modal>
    );
  })
);
