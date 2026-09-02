import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, X, Upload } from 'lucide-react';
import { AdminPartner, listPartners, upsertPartner, deletePartner, uploadImage, AdminApiError } from '../lib/adminApi';

const EMPTY: Partial<AdminPartner> = {
  category: '',
  name: '',
  location: '',
  phone: '',
  instagram: '',
  website: '',
  tags: [],
  photos: [],
};

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
