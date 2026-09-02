import React, { useEffect, useState } from 'react';
import { AdminBooking, listBookings, AdminApiError } from '../lib/adminApi';

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
