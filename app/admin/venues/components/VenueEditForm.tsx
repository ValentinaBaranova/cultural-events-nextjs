'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Select, Button, App, Checkbox } from 'antd';
import { useI18n } from '@/i18n/I18nProvider';
import { Venue, Barrio } from '@/lib/definitions';
import { updateVenue } from '@/lib/actions';

interface VenueEditFormProps {
    venue: Venue;
    barrios: Barrio[];
}

interface VenueFormValues {
    name: string;
    barrioId: string;
    singleRoomVenue: boolean;
}

export default function VenueEditForm({ venue, barrios }: VenueEditFormProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { message } = App.useApp();

    const [form] = Form.useForm<VenueFormValues>();

    async function onFinish(values: VenueFormValues) {
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('singleRoomVenue', values.singleRoomVenue.toString());
        if (values.barrioId) {
            formData.append('barrioId', values.barrioId);
        }

        try {
            await updateVenue(venue.id, formData);
            message.success(t('admin.venues.success'));
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : t('admin.venues.error'));
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl bg-card p-6 rounded-lg border border-border">
            <h1 className="text-2xl font-bold text-foreground mb-6">
                {t('admin.venues.edit')}: {venue.name}
            </h1>

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    name: venue.name,
                    barrioId: venue.barrio?.id || '',
                    singleRoomVenue: venue.singleRoomVenue || false,
                }}
                onFinish={onFinish}
            >
                <Form.Item
                    label={t('admin.venues.name')}
                    name="name"
                    rules={[{ required: true, message: t('admin.instagramUsers.username.required') }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label={t('admin.venues.barrio')}
                    name="barrioId"
                >
                    <Select
                        showSearch
                        allowClear
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={barrios.map((barrio) => ({
                            label: barrio.name,
                            value: barrio.id,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="singleRoomVenue"
                    valuePropName="checked"
                >
                    <Checkbox>{t('admin.venues.singleRoomVenue')}</Checkbox>
                </Form.Item>

                <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        className="bg-primary hover:bg-primary-hover border-none"
                    >
                        {t('admin.venues.save')}
                    </Button>
                    <Button
                        type="default"
                        onClick={() => router.back()}
                    >
                        {t('admin.venues.back')}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
