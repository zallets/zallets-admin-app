import React, { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { listSiteSettings, setSiteSetting, deleteSiteSetting, AdminApiError } from '../lib/adminApi';

// 자유 key-value 문구 에디터. 지금은 홈 배너 3개 키(heroImageUrl/heroTagline/heroSub)만
// 실제로 앱에서 읽어오지만, 여기서는 임의 key를 추가/수정/삭제할 수 있다 — 새로 연결할 문구가
// 생기면 이 화면에서 key를 먼저 만들고, 해당 컴포넌트에서 그 key를 읽어오게 연결하면 된다.
export function AdminSettingsTab({ secret }: { secret: string }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setSettings(await listSiteSettings(secret));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '설정을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(key: string, value: string) {
    setSavingKey(key);
    setError(null);
    try {
      await setSiteSetting(secret, key, value);
      setSettings((s) => ({ ...s, [key]: value }));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '저장에 실패했습니다.');
    } finally {
      setSavingKey(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const key = newKey.trim();
    if (!key) return;
    await handleSave(key, newValue);
    setNewKey('');
    setNewValue('');
  }

  async function handleDelete(key: string) {
    if (!window.confirm(`"${key}" 문구를 삭제할까요?`)) return;
    try {
      await deleteSiteSetting(secret, key);
      setSettings((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : '삭제에 실패했습니다.');
    }
  }

  const keys = Object.keys(settings).sort();

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <form onSubmit={handleAdd} className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
        <h2 className="text-sm font-bold text-stone-800">새 문구 키 추가</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="key (예: heroTagline)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            placeholder="value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={!newKey.trim() || savingKey === newKey.trim()}
          className="flex items-center gap-1 rounded-xl bg-stone-800 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          <Plus size={14} />
          추가
        </button>
      </form>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-stone-400">불러오는 중...</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-stone-400">등록된 문구가 없습니다.</p>
        ) : (
          keys.map((key) => (
            <SettingRow
              key={key}
              settingKey={key}
              value={settings[key]}
              saving={savingKey === key}
              onSave={(value) => handleSave(key, value)}
              onDelete={() => handleDelete(key)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SettingRow({
  settingKey,
  value,
  saving,
  onSave,
  onDelete,
}: {
  settingKey: string;
  value: string;
  saving: boolean;
  onSave: (value: string) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const dirty = draft !== value;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2">
      <p className="text-xs font-mono text-stone-400">{settingKey}</p>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          onClick={() => onSave(draft)}
          disabled={!dirty || saving}
          className="rounded-xl bg-stone-800 text-white px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          {saving ? '저장 중' : '저장'}
        </button>
        <button onClick={onDelete} className="p-2 text-stone-400 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
