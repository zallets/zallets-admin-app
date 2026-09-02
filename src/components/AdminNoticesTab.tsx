import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { AdminNotice, listNotices, upsertNotice, deleteNotice, AdminApiError } from '../lib/adminApi';

const EMPTY: Partial<AdminNotice> = { category: '', date: '', title: '', body: '' };

export function AdminNoticesTab({ secret }: { secret: string }) {
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminNotice>>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setNotices(await listNotices(secret));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '공지사항을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm(EMPTY);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await upsertNotice(secret, form);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('이 공지사항을 삭제할까요?')) return;
    try {
      await deleteNotice(secret, id);
      await load();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '삭제에 실패했습니다.');
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
        <h2 className="text-sm font-bold text-stone-800">{form.id ? '공지사항 수정' : '공지사항 작성'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="분류"
            value={form.category || ''}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <input
            type="date"
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            value={form.date || ''}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          <input
            className="col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="제목 *"
            value={form.title || ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm min-h-24"
            placeholder="본문"
            value={form.body || ''}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving || !form.title?.trim()}
            className="flex items-center gap-1 rounded-xl bg-stone-800 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Plus size={14} />
            {saving ? '저장 중...' : form.id ? '수정 저장' : '공지 작성'}
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
        ) : notices.length === 0 ? (
          <p className="text-sm text-stone-400">등록된 공지사항이 없습니다.</p>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-400">
                  {n.category} · {n.date}
                </p>
                <p className="text-sm font-semibold text-stone-800">{n.title}</p>
                <p className="text-xs text-stone-500 line-clamp-2">{n.body}</p>
              </div>
              <button onClick={() => setForm(n)} className="p-2 text-stone-400 hover:text-stone-700">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(n.id)} className="p-2 text-stone-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
