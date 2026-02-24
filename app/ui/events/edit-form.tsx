'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateEvent } from '@/lib/actions';
import { API_URL } from '@/lib/config';
import { useI18n } from '@/i18n/I18nProvider';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, TimePicker, Input, Select, Checkbox, Button } from 'antd';

const { TextArea } = Input;

type EventTypeOption = { slug: string; name: string };

type TagOption = { slug: string; name: string };

type EventForEdit = {
    id: string;
    name: string;
    nameEn?: string | null;
    date: string;
    endDate?: string | null;
    startTime?: string | null;
    description: string;
    descriptionEn?: string | null;
    type: string;
    isFree?: boolean | null;
    priceText?: string | null;
    venueDetail?: string | null;
    venue?: { name?: string | null; barrio?: { name?: string | null } | null } | null;
    tags?: string[] | null;
};

export default function EditEventForm({ event }: { event: EventForEdit }) {
    const updateEventWithId = updateEvent.bind(null, event.id);
    const { t, locale } = useI18n();
    const router = useRouter();

    const [types, setTypes] = useState<EventTypeOption[]>([]);

    const [name, setName] = useState<string>(event.name);
    const [nameEn, setNameEn] = useState<string>(event.nameEn || '');
    const [date, setDate] = useState<string>(event.date);
    const [endDate, setEndDate] = useState<string>(event.endDate ?? '');
    const [startTime, setStartTime] = useState<string>(event.startTime ?? '');
    const [description, setDescription] = useState<string>(event.description);
    const [descriptionEn, setDescriptionEn] = useState<string>(event.descriptionEn || '');
    const [type, setType] = useState<string>(event.type);
    const [isFree, setIsFree] = useState<boolean>(!!event.isFree);
    const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>(event.tags || []);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/event-types?locale=${locale}`, { signal: controller.signal })
            .then(res => res.json())
            .then((data: EventTypeOption[]) => setTypes(data))
            .catch(() => {});
        return () => controller.abort();
    }, [locale]);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/tags?locale=${locale}`, { signal: controller.signal })
            .then(res => res.json())
            .then((data: TagOption[]) => setTagOptions(data))
            .catch(() => {});
        return () => controller.abort();
    }, [locale]);

    const typeOptions = useMemo(() => types.map(t => ({ label: t.name, value: t.slug })), [types]);
    const tagSelectOptions = useMemo(() => tagOptions.map(t => ({ label: t.name, value: t.slug })), [tagOptions]);

    return (
        <div className="max-w-lg mx-auto p-4">
            <div className="mb-4">
                <Link href="/events" className="text-muted-foreground no-underline hover:underline hover:text-foreground">
                    <span aria-hidden="true" className="mr-1">&lt;</span>
                    {t('event.edit.back')}
                </Link>
            </div>
            <form action={updateEventWithId} className="bg-card rounded shadow-sm p-4 border border-border">
                {/* Hidden inputs to submit controlled AntD values */}
                <input type="hidden" name="name" value={name} />
                <input type="hidden" name="nameEn" value={nameEn} />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="endDate" value={endDate} />
                <input type="hidden" name="startTime" value={startTime} />
                <input type="hidden" name="description" value={description} />
                <input type="hidden" name="descriptionEn" value={descriptionEn} />
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="isFree" value={isFree ? 'true' : ''} />
                {selectedTags.map((slug) => (
                    <input key={slug} type="hidden" name="tags" value={slug} />
                ))}

                <label className="block mb-2">{t('event.edit.name')}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mb-4" />

                <label className="block mb-2">{t('event.edit.nameEn')}</label>
                <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2">{t('event.edit.date')}</label>
                        <DatePicker
                            className="w-full mb-4"
                            value={date ? dayjs(date, 'YYYY-MM-DD') : null}
                            onChange={(d) => setDate(d ? d.format('YYYY-MM-DD') : '')}
                            allowClear
                        />
                    </div>
                    <div>
                        <label className="block mb-2">{t('event.edit.endDate')}</label>
                        <DatePicker
                            className="w-full mb-4"
                            value={endDate ? dayjs(endDate, 'YYYY-MM-DD') : null}
                            onChange={(d) => setEndDate(d ? d.format('YYYY-MM-DD') : '')}
                            allowClear
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2">{t('event.edit.startTime')}</label>
                        <TimePicker
                            className="w-full mb-4"
                            format="HH:mm"
                            value={startTime ? dayjs(startTime, 'HH:mm') as unknown as Dayjs : null}
                            onChange={(tVal) => setStartTime(tVal ? (tVal as Dayjs).format('HH:mm') : '')}
                            allowClear
                        />
                    </div>
                    <div>
                        <label className="block mb-2">{t('event.edit.venue')}</label>
                        <Input value={event.venue?.name || ''} disabled className="mb-4" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2">{t('event.edit.zone')}</label>
                        <Input value={event.venue?.barrio?.name || ''} disabled className="mb-4" />
                    </div>
                    {/* Venue detail removed as requested */}
                </div>

                <label className="block mb-2">{t('event.edit.description')}</label>
                <TextArea value={description} onChange={(e) => setDescription(e.target.value)} className="mb-4" rows={4} />

                <label className="block mb-2">{t('event.edit.descriptionEn')}</label>
                <TextArea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="mb-4" rows={4} />

                <label className="block mb-2">{t('event.edit.type')}</label>
                <Select
                    className="w-full mb-4"
                    options={typeOptions}
                    value={type}
                    onChange={(v) => setType(v)}
                />

                <div className="flex items-center gap-2 mb-4">
                    <Checkbox checked={isFree} onChange={(e) => setIsFree(e.target.checked)}>
                        {t('event.edit.free')}
                    </Checkbox>
                </div>


                <div className="mb-4">
                    <label className="block mb-2">{t('event.edit.tags')}</label>
                    <Select
                        className="w-full"
                        mode="multiple"
                        options={tagSelectOptions}
                        value={selectedTags}
                        onChange={(vals) => setSelectedTags(vals)}
                        allowClear
                    />
                </div>

                <div className="flex gap-3">
                    <Button htmlType="button" onClick={() => router.push('/events')}>{t('event.edit.cancel')}</Button>
                    <Button type="primary" htmlType="submit">{t('event.edit.save')}</Button>
                </div>
            </form>
        </div>
    );
}
