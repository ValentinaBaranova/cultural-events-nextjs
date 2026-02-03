"use client";
import React, { useEffect, useState } from "react";
import { Form, Input, Checkbox, Button, message, Card, Typography, Select } from "antd";
import { API_URL } from "@/lib/config";
import { useI18n } from "@/i18n/I18nProvider";

const { Title, Paragraph } = Typography;

interface AddUserRequest {
  username: string;
  venueName: string;
  barrioId: string;
  enableImageOCRFallback?: boolean | null;
}

interface BarrioOption { id: string; name: string; slug: string }

export default function InstagramUsersAdminPage() {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [barrios, setBarrios] = useState<BarrioOption[]>([]);
  const [loadingBarrios, setLoadingBarrios] = useState(false);
  const [form] = Form.useForm<AddUserRequest>();
  const [messageApi, messageContextHolder] = message.useMessage();

  useEffect(() => {
    const load = async () => {
      setLoadingBarrios(true);
      try {
        const res = await fetch(`${API_URL}/barrios`);
        if (res.ok) {
          const data: BarrioOption[] = await res.json();
          setBarrios(Array.isArray(data) ? data : []);
        } else {
          setBarrios([]);
        }
      } catch {
        setBarrios([]);
      } finally {
        setLoadingBarrios(false);
      }
    };
    load();
  }, []);

  const onFinish = async (values: AddUserRequest) => {
    setSubmitting(true);
    try {
      const resp = await fetch(`${API_URL}/admin/instagram/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username?.trim(),
          venueName: values.venueName?.trim(),
          barrioId: values.barrioId,
          enableImageOCRFallback: !!values.enableImageOCRFallback,
        }),
      });

      if (resp.ok) {
        const data: unknown = await resp.json().catch(() => ({}));
        const notes: string[] = Array.isArray((data as { notes?: unknown })?.notes)
          ? ((data as { notes?: unknown }).notes as unknown[]).filter((n): n is string => typeof n === 'string')
          : [];
        const alreadyExists = notes.some(n => /already exists/i.test(n));
        if (alreadyExists) {
          messageApi.info(t("admin.instagramUsers.add.alreadyExists", "This Instagram user already exists. Updated settings if needed."));
        } else {
          messageApi.success(t("admin.instagramUsers.add.success", "User added. Parsing will run soon."));
        }
        form.resetFields();
      } else {
        const data: unknown = await resp.json().catch(() => ({}));
        const err = data as { error?: unknown; message?: unknown };
        const errMsg = (typeof err.error === 'string' ? err.error : undefined) || (typeof err.message === 'string' ? err.message : undefined) || "";
        messageApi.error(
          t("admin.instagramUsers.add.error", "Could not add user.") + (errMsg ? ` ${errMsg}` : "")
        );
      }
    } catch {
      messageApi.error(t("admin.instagramUsers.add.error", "Could not add user."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {messageContextHolder}
      <Card>
        <Title level={3}>{t("admin.instagramUsers.title", "Instagram Users")}</Title>
        <Paragraph>{t("admin.instagramUsers.subtitle", "Add a new Instagram user and optionally link a venue.")}</Paragraph>

        <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label={t("admin.instagramUsers.username", "Instagram username")}
          name="username"
          rules={[{ required: true, message: t("admin.instagramUsers.username.required", "Username is required") }]}
        >
          <Input placeholder={t("admin.instagramUsers.username.placeholder", "e.g. museum_ba") as string} />
        </Form.Item>

        <Form.Item 
          label={t("admin.instagramUsers.venueName", "Venue name")}
          name="venueName"
          rules={[{ required: true, message: t("admin.instagramUsers.venueName.required", "Venue name is required") }]}
        >
          <Input placeholder={t("admin.instagramUsers.venueName.placeholder", "Enter the venue name") as string} />
        </Form.Item>

        <Form.Item 
          label={t("admin.instagramUsers.barrio", "Neighborhood")} 
          name="barrioId"
          rules={[{ required: true, message: t("admin.instagramUsers.barrio.required", "Neighborhood is required") }]}
        >
          <Select
            showSearch
            allowClear
            loading={loadingBarrios}
            placeholder={t("admin.instagramUsers.barrio.placeholder", "Select a neighborhood") as string}
            optionFilterProp="search"
            filterOption={(input, option) => {
              const label = (option?.label ?? "").toString().toLowerCase();
              const slug = (option && (option as { slug?: unknown }).slug && String((option as { slug?: unknown }).slug))?.toLowerCase?.() ?? "";
              const haystack = `${label} ${slug}`.trim();
              return haystack.includes(input.toLowerCase());
            }}
            notFoundContent={t("common.noResults", "No results")}
            options={barrios.map((b) => ({ label: b.name, value: b.id, slug: b.slug, search: `${b.name} ${b.slug}` }))}
          />
        </Form.Item>

        <Form.Item name="enableImageOCRFallback" valuePropName="checked">
          <Checkbox>{t("admin.instagramUsers.enableOCR", "Enable image OCR fallback")}</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {t("admin.instagramUsers.add.button", "Add user")}
          </Button>
        </Form.Item>
      </Form>
      </Card>
    </>
  );
}
