"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/Button";
import { Checkbox, Field, Select, TextInput } from "../../../components/Field";
import { api, ApiError } from "../../../lib/apiClient";
import type { Organization, PaymentMode } from "../../../lib/types";

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("ONLINE_AND_RECEPTION");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.organization().then((data) => {
      setOrg(data.organization);
      setPaymentMode(data.organization.paymentMode);
      setLogoUrl(data.organization.logoUrl ?? "");
      setPrimaryColor(data.organization.primaryColor ?? "");
      setRemindersEnabled(data.organization.remindersEnabled);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { organization } = await api.updateOrganization({
        paymentMode,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || null,
        remindersEnabled,
      });
      setOrg(organization);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (!org) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Organization Settings</h1>
      <p className="mb-6 text-sm text-slate-500">{org.name}</p>

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
      {saved ? (
        <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-3">
        <Field label="Payment Mode">
          <Select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
          >
            <option value="ONLINE_ONLY">Online Only</option>
            <option value="ONLINE_AND_RECEPTION">Online + Pay at Reception</option>
          </Select>
        </Field>
        <Field label="Logo URL">
          <TextInput
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field label="Primary Colour (hex)">
          <TextInput
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#0B5FFF"
          />
        </Field>
        <Checkbox
          label="Send pre-appointment reminder notifications"
          checked={remindersEnabled}
          onChange={(e) => setRemindersEnabled(e.target.checked)}
        />

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
