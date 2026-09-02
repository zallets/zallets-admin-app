import React, { useState } from 'react';
import { AdminPartnersTab } from './AdminPartnersTab';
import { AdminNoticesTab } from './AdminNoticesTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminApplicationsTab } from './AdminApplicationsTab';
import { AdminBookingsTab } from './AdminBookingsTab';
import { listApplications, AdminApiError } from '../lib/adminApi';

type AdminTab = 'partners' | 'notices' | 'settings' | 'applications' | 'bookings';

const TABS: { key: AdminTab; label: string }[] = [
  { key: 'partners', label: '파트너' },
  { key: 'notices', label: '공지사항' },
  { key: 'settings', label: '문구 설정' },
  { key: 'applications', label: '신청현황' },
  { key: 'bookings', label: '예약현황' },
];

// 회원 로그인 시스템은 없고, 공유 비밀번호(ADMIN_SECRET)를 확인하는 API 호출 하나로
// 로그인 여부를 판단한다. 비밀번호는 React state에만 두고 localStorage에는 저장하지 않는다
// (새로고침하면 다시 입력해야 함 — website/js/admin.js와 동일한 방식).
export default function AdminApp() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState<AdminTab>('partners');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setAuthError(null);
    try {
      await listApplications(secret);
      setAuthed(true);
    } catch (err) {
      setAuthError(err instanceof AdminApiError ? err.message : '인증에 실패했습니다.');
    } finally {
      setChecking(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4"
        >
          <h1 className="text-lg font-bold text-stone-800">ZALLETS 관리자</h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="관리자 비밀번호"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-stone-500"
            autoFocus
          />
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <button
            type="submit"
            disabled={checking || !secret}
            className="w-full rounded-xl bg-stone-800 text-white py-3 text-sm font-semibold disabled:opacity-50"
          >
            {checking ? '확인 중...' : '입장'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-base font-bold text-stone-800">ZALLETS 관리자</h1>
      </header>
      <nav className="flex overflow-x-auto bg-white border-b border-stone-200 px-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-stone-800 text-stone-900 font-semibold' : 'border-transparent text-stone-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {tab === 'partners' && <AdminPartnersTab secret={secret} />}
        {tab === 'notices' && <AdminNoticesTab secret={secret} />}
        {tab === 'settings' && <AdminSettingsTab secret={secret} />}
        {tab === 'applications' && <AdminApplicationsTab secret={secret} />}
        {tab === 'bookings' && <AdminBookingsTab secret={secret} />}
      </main>
    </div>
  );
}
