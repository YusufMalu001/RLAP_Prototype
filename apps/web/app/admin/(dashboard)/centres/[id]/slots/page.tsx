"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/admin/apiClient";
import { Button } from "@/components/admin/Button";
import { Field, Select, TextInput } from "@/components/admin/Field";
import type { SlotDay, SlotType } from "@/lib/admin/types";

const SLOT_TYPES: SlotType[] = ["RADIOLOGY", "LAB", "HOME_COLLECTION_WINDOW"];

export default function CentreSlotsPage() {
  const params = useParams<{ id: string }>();
  const [days, setDays] = useState<SlotDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [type, setType] = useState<SlotType>("RADIOLOGY");
  const [genDays, setGenDays] = useState(14);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [slotsPerHour, setSlotsPerHour] = useState(2);
  const [capacityPerSlot, setCapacityPerSlot] = useState(3);

  function reload() {
    api.slotsForCentre(params.id, 14).then((data) => setDays(data.days));
  }

  useEffect(reload, [params.id]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      const res = await api.generateSlots(params.id, {
        type,
        days: genDays,
        startHour,
        endHour,
        slotsPerHour,
        capacityPerSlot,
      });
      setResult(
        `Requested ${res.requested} slots, created ${res.created} new (rest already existed).`,
      );
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate slots");
    }
  }

  async function handleDeleteSlot(id: string) {
    try {
      await api.deleteSlot(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete slot");
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Slot Capacity</h1>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Bulk Generate Slots</h2>
        <p className="mb-3 text-xs text-slate-400">
          Fills in a fixed grid — N days, X slots per hour, same capacity every slot. No
          phlebotomist/machine-level modelling. Safe to re-run: existing slots are left alone.
        </p>
        {error ? (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {result ? (
          <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {result}
          </div>
        ) : null}
        <form onSubmit={handleGenerate} className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as SlotType)}>
              {SLOT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Days">
            <TextInput
              type="number"
              min={1}
              max={90}
              value={genDays}
              onChange={(e) => setGenDays(Number(e.target.value))}
            />
          </Field>
          <Field label="Start Hour">
            <TextInput
              type="number"
              min={0}
              max={23}
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
            />
          </Field>
          <Field label="End Hour">
            <TextInput
              type="number"
              min={1}
              max={24}
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
            />
          </Field>
          <Field label="Slots / Hour">
            <TextInput
              type="number"
              min={1}
              max={12}
              value={slotsPerHour}
              onChange={(e) => setSlotsPerHour(Number(e.target.value))}
            />
          </Field>
          <Field label="Capacity / Slot">
            <TextInput
              type="number"
              min={1}
              value={capacityPerSlot}
              onChange={(e) => setCapacityPerSlot(Number(e.target.value))}
            />
          </Field>
        </form>
        <Button onClick={handleGenerate} className="mt-3">
          Generate
        </Button>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Next 14 Days</h2>
      {days.length === 0 ? (
        <p className="text-sm text-slate-400">No slots generated yet for this window.</p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div
              key={day.date}
              className="overflow-x-auto rounded-xl border border-slate-200 bg-white"
            >
              <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                {day.date}
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Booked / Capacity</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {day.slots.map((slot) => (
                    <tr key={slot.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2">{slot.type}</td>
                      <td className="px-4 py-2">
                        {slot.startTime}–{slot.endTime}
                      </td>
                      <td className="px-4 py-2">
                        {slot.bookedCount} / {slot.capacity}
                      </td>
                      <td className="px-4 py-2">
                        {slot.bookedCount === 0 ? (
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
