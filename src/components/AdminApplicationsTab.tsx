import React, { useEffect, useState } from 'react';
import { AdminApplication, listApplications, setApplicationStatus, AdminApiError } from '../lib/adminApi';

export function AdminApplicationsTab({ secret }: { secret: string }) {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setApplications(await listApplications(secret));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '신청 현황을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle(applicationId: string, verified: boolean) {
    setTogglingId(applicationId);
    setError(null);
    try {
      await setApplicationStatus(secret, applicationId, verified);
      setApplications((apps) => apps.map((a) => (a.applicationId === applicationId ? { ...a, verified } : a)));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '변경에 실패했습니다.');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-stone-400">불러오는 중...</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-stone-400">신청 내역이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {applications.map((a) => (
            <div key={a.applicationId} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    {a.name} · {a.phone}
                  </p>
                  <p className="text-xs text-stone-400">{new Date(a.createdAt).toLocaleString('ko-KR')}</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-500 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={a.verified}
                    disabled={togglingId === a.applicationId}
                    onChange={(e) => handleToggle(a.applicationId, e.target.checked)}
                  />
                  결제 확인됨
                </label>
              </div>
              <p className="text-xs text-stone-600">
                {a.facilitiesLabel} (총 {a.totalCount}회)
              </p>
              <p className="text-xs text-stone-400">주문번호: {a.orderNumber}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
