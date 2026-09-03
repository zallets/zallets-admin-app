import React, { useEffect, useState } from 'react';
import {
  AdminBooking,
  AdminPartner,
  listBookings,
  listPartners,
  fetchFacilityHours,
  updateFacilityHours,
  AdminApiError,
} from '../lib/adminApi';

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function FacilityHoursEditor({ secret }: { secret: string }) {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [slotsText, setSlotsText] = useState('');
  const [closedWeekdays, setClosedWeekdays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listPartners(secret), fetchFacilityHours()])
      .then(([partnerList, hoursMap]) => {
        setPartners(partnerList);
        const firstId = partnerList[0]?.id || '';
        setSelectedId(firstId);
        const entry = hoursMap[firstId];
        setSlotsText((entry?.slots || []).join('\n'));
        setClosedWeekdays(entry?.closedWeekdays || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '시설 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFacility = async (facilityId: string) => {
    setSelectedId(facilityId);
    setMessage(null);
    setError(null);
    try {
      const hoursMap = await fetchFacilityHours();
      const entry = hoursMap[facilityId];
      setSlotsText((entry?.slots || []).join('\n'));
      setClosedWeekdays(entry?.closedWeekdays || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '운영시간을 불러오지 못했습니다.');
    }
  };

  const toggleWeekday = (w: number) => {
    setClosedWeekdays((prev) => (prev.includes(w) ? prev.filter((d) => d !== w) : [...prev, w]));
  };

  const handleSave = async () => {
    const facility = partners.find((p) => p.id === selectedId);
    if (!facility) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const slots = slotsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await updateFacilityHours(secret, facility.id, facility.name, slots, closedWeekdays);
      setMessage('저장했습니다.');
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '저장 중 문제가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-stone-400">불러오는 중...</p>;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
      <h3 className="text-sm font-bold text-stone-800">시설 예약 가능 시간 / 휴무 요일</h3>

      <select
        value={selectedId}
        onChange={(e) => handleSelectFacility(e.target.value)}
        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
      >
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-stone-600">예약 가능 시간대 (한 줄에 하나씩)</label>
        <textarea
          rows={5}
          value={slotsText}
          onChange={(e) => setSlotsText(e.target.value)}
          placeholder={'예: 오전 7시\n오전 10시\n저녁 7시'}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-mono"
        />
        <p className="text-[11px] text-stone-400">비워두면 기본 시간대(오전 7시/10시, 저녁 7시/8시)로 보여집니다.</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-stone-600">휴무 요일 (선택한 요일은 예약을 받지 않습니다)</label>
        <div className="flex gap-1.5 flex-wrap">
          {WEEKDAYS.map((w, idx) => (
            <button
              key={w}
              type="button"
              onClick={() => toggleWeekday(idx)}
              className={`w-9 h-9 rounded-full text-xs font-bold border transition-colors ${
                closedWeekdays.includes(idx)
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
      {message && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">{message}</p>}

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-full rounded-xl bg-stone-800 text-white py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}

export function AdminBookingsTab({ secret }: { secret: string }) {
  const [month, setMonth] = useState(currentYearMonth());
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(targetMonth: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await listBookings(secret, targetMonth);
      setBookings(res.bookings);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '예약 현황을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <div className="space-y-4">
      <FacilityHoursEditor secret={secret} />

      <div className="flex items-center gap-2">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-stone-400">불러오는 중...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-stone-400">이번 달 예약이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.bookingId} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-stone-800">{b.facilityName}</p>
                <p className="text-xs text-stone-400">
                  {b.date} · {b.timeSlot} · 주문번호 {b.orderNumber}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  b.status === '취소됨' ? 'bg-stone-100 text-stone-400' : 'bg-green-50 text-green-700'
                }`}
              >
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
