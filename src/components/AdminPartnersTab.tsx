import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, X, Upload } from 'lucide-react';
import {
  AdminPartner,
  AdminFacilitySchedule,
  EMPTY_SCHEDULE,
  listPartners,
  upsertPartner,
  deletePartner,
  uploadImage,
  AdminApiError,
} from '../lib/adminApi';

const EMPTY: Partial<AdminPartner> = {
  category: '',
  name: '',
  location: '',
  phone: '',
  instagram: '',
  website: '',
  tags: [],
  photos: [],
  schedule: EMPTY_SCHEDULE,
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: AdminFacilitySchedule;
  onChange: (schedule: AdminFacilitySchedule) => void;
}) {
  const [timeInputs, setTimeInputs] = useState<Record<number, string>>({});
  const [dateInput, setDateInput] = useState('');

  const toggleWeekday = (w: number) => {
    const openWeekdays = schedule.openWeekdays.includes(w)
      ? schedule.openWeekdays.filter((d) => d !== w)
      : [...schedule.openWeekdays, w];
    onChange({ ...schedule, openWeekdays });
  };

  const addTime = (w: number) => {
    const value = (timeInputs[w] || '').trim();
    if (!value) return;
    const existing = schedule.weekdayTimes[String(w)] || [];
    if (existing.includes(value)) return;
    onChange({ ...schedule, weekdayTimes: { ...schedule.weekdayTimes, [String(w)]: [...existing, value] } });
    setTimeInputs((prev) => ({ ...prev, [w]: '' }));
  };

  const removeTime = (w: number, time: string) => {
    const existing = schedule.weekdayTimes[String(w)] || [];
    onChange({ ...schedule, weekdayTimes: { ...schedule.weekdayTimes, [String(w)]: existing.filter((t) => t !== time) } });
  };

  const addClosedDate = () => {
    if (!dateInput || schedule.closedDates.includes(dateInput)) return;
    onChange({ ...schedule, closedDates: [...schedule.closedDates, dateInput].sort() });
    setDateInput('');
  };

  const removeClosedDate = (date: string) => {
    onChange({ ...schedule, closedDates: schedule.closedDates.filter((d) => d !== date) });
  };

  return (
    <div className="space-y-3 border-t border-stone-200 pt-3">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-600">요일별 운영 여부 / 수업 시간</p>
        <p className="text-[11px] text-stone-400">운영 요일을 아무것도 선택하지 않으면 매일 영업으로 취급합니다.</p>
        {WEEKDAYS.map((label, w) => {
          const isOpen = schedule.openWeekdays.includes(w);
          const times = schedule.weekdayTimes[String(w)] || [];
          return (
            <div key={w} className="rounded-xl border border-stone-200 p-2.5 space-y-2">
              <button
                type="button"
                onClick={() => toggleWeekday(w)}
                className={`w-8 h-8 rounded-full text-xs font-bold border transition-colors ${
                  isOpen ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-400 border-stone-300'
                }`}
              >
                {label}
              </button>
              <div className="flex flex-wrap gap-1.5">
                {times.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] bg-stone-100 text-stone-700 px-2 py-1 rounded-full"
                  >
                    {t}
                    <button type="button" onClick={() => removeTime(w, t)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  value={timeInputs[w] || ''}
                  onChange={(e) => setTimeInputs((prev) => ({ ...prev, [w]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTime(w);
                    }
                  }}
                  placeholder="예: 오전 7시반"
                  className="flex-1 rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => addTime(w)}
                  className="rounded-lg border border-stone-300 px-2.5 text-xs font-semibold text-stone-600"
                >
                  추가
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-600">특정 날짜 휴무 (명절, 임시휴무)</p>
        <div className="flex flex-wrap gap-1.5">
          {schedule.closedDates.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 text-[11px] bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-200"
            >
              {d}
              <button type="button" onClick={() => removeClosedDate(d)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="flex-1 rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={addClosedDate}
            className="rounded-lg border border-stone-300 px-2.5 text-xs font-semibold text-stone-600"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPartnersTab({ secret }: { secret: string }) {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminPartner>>(EMPTY);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setPartners(await listPartners(secret));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '파트너 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(partner: AdminPartner) {
    setForm(partner);
    setTagsInput(partner.tags.join(', '));
  }

  function resetForm() {
    setForm(EMPTY);
    setTagsInput('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await upsertPartner(secret, { ...form, tags });
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('이 파트너를 삭제할까요?')) return;
    try {
      await deletePartner(secret, id);
      await load();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '삭제에 실패했습니다.');
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(secret, file, 'partners');
      setForm((f) => ({ ...f, photos: [...(f.photos || []), url] }));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removePhoto(url: string) {
    setForm((f) => ({ ...f, photos: (f.photos || []).filter((p) => p !== url) }));
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
        <h2 className="text-sm font-bold text-stone-800">{form.id ? '파트너 수정' : '파트너 추가'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="시설명 *"
            value={form.name || ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="종목 (예: 크로스핏)"
            value={form.category || ''}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <input
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="전화번호"
            value={form.phone || ''}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            className="col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="위치 (주소)"
            value={form.location || ''}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <input
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="인스타그램 URL"
            value={form.instagram || ''}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
          />
          <input
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="웹사이트 URL"
            value={form.website || ''}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
          <input
            className="col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="태그 (쉼표로 구분)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 cursor-pointer">
            <Upload size={14} />
            {uploading ? '업로드 중...' : '사진 추가'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          {!!form.photos?.length && (
            <div className="flex flex-wrap gap-2">
              {form.photos.map((p) => (
                <div key={p} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p)}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <ScheduleEditor
          schedule={form.schedule || EMPTY_SCHEDULE}
          onChange={(schedule) => setForm((f) => ({ ...f, schedule }))}
        />

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving || !form.name?.trim()}
            className="flex items-center gap-1 rounded-xl bg-stone-800 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Plus size={14} />
            {saving ? '저장 중...' : form.id ? '수정 저장' : '파트너 추가'}
          </button>
          {form.id && (
            <button type="button" onClick={resetForm} className="rounded-xl border border-stone-300 px-4 py-2 text-sm">
              취소
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-stone-400">불러오는 중...</p>
        ) : partners.length === 0 ? (
          <p className="text-sm text-stone-400">등록된 파트너가 없습니다.</p>
        ) : (
          partners.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3">
              {p.photos[0] ? (
                <img src={p.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{p.name}</p>
                <p className="text-xs text-stone-400 truncate">
                  {p.category} · {p.location}
                </p>
              </div>
              <button onClick={() => startEdit(p)} className="p-2 text-stone-400 hover:text-stone-700">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 text-stone-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
