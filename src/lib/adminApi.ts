// 관리자 전용 API 클라이언트. website/api/admin.js를 상대경로(/api/admin/...)로 호출한다 —
// app/vercel.json의 /api/:path* rewrite가 website 백엔드로 same-origin처럼 전달해준다.
// 회원 로그인 없이 공유 비밀번호(x-admin-secret 헤더)만으로 인증한다.

class AdminApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function adminRequest<T>(secret: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret,
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AdminApiError(data?.error || `요청 실패 (${res.status})`, res.status);
  }
  return data as T;
}

export interface AdminPartner {
  id: string;
  category: string;
  name: string;
  location: string;
  phone: string;
  photos: string[];
  instagram: string;
  website: string;
  tags: string[];
}

export interface AdminNotice {
  id: string;
  category: string;
  date: string;
  title: string;
  body: string;
}

export interface AdminApplication {
  createdAt: string;
  name: string;
  phone: string;
  totalCount: number;
  facilitiesLabel: string;
  marketingConsent: boolean;
  applicationId: string;
  orderNumber: string;
  verified: boolean;
}

export interface AdminBooking {
  bookingId: string;
  orderNumber: string;
  facilityId: string;
  facilityName: string;
  date: string;
  timeSlot: string;
  createdAt: string;
  status: string;
}

// ---------- 파트너 ----------

export function listPartners(secret: string) {
  return adminRequest<AdminPartner[]>(secret, '/api/partners');
}

export function upsertPartner(secret: string, partner: Partial<AdminPartner>) {
  return adminRequest<AdminPartner>(secret, '/api/admin/upsert-partner', {
    method: 'POST',
    body: JSON.stringify(partner),
  });
}

export function deletePartner(secret: string, id: string) {
  return adminRequest<{ id: string }>(secret, '/api/admin/delete-partner', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// ---------- 공지사항 ----------

export function listNotices(secret: string) {
  return adminRequest<AdminNotice[]>(secret, '/api/notices');
}

export function upsertNotice(secret: string, notice: Partial<AdminNotice>) {
  return adminRequest<AdminNotice>(secret, '/api/admin/upsert-notice', {
    method: 'POST',
    body: JSON.stringify(notice),
  });
}

export function deleteNotice(secret: string, id: string) {
  return adminRequest<{ id: string }>(secret, '/api/admin/delete-notice', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// ---------- 사이트/앱 문구 설정 (자유 key-value) ----------

export function listSiteSettings(secret: string) {
  return adminRequest<{ settings: Record<string, string> }>(secret, '/api/admin/list-site-settings').then(
    (d) => d.settings
  );
}

export function setSiteSetting(secret: string, key: string, value: string) {
  return adminRequest<{ key: string; value: string }>(secret, '/api/admin/set-site-setting', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}

export function deleteSiteSetting(secret: string, key: string) {
  return adminRequest<{ key: string }>(secret, '/api/admin/delete-site-setting', {
    method: 'POST',
    body: JSON.stringify({ key }),
  });
}

// ---------- 신청현황 ----------

export function listApplications(secret: string) {
  return adminRequest<{ applications: AdminApplication[] }>(secret, '/api/admin/list-applications').then(
    (d) => d.applications
  );
}

export function setApplicationStatus(secret: string, applicationId: string, verified: boolean) {
  return adminRequest<{ applicationId: string; verified: boolean }>(secret, '/api/admin/set-application-status', {
    method: 'POST',
    body: JSON.stringify({ applicationId, verified }),
  });
}

// ---------- 예약현황 ----------

export function listBookings(secret: string, month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return adminRequest<{ month: string; bookings: AdminBooking[] }>(secret, `/api/admin/list-bookings${query}`);
}

// ---------- 시설 운영시간(예약 가능 시간대 + 휴무 요일) ----------

export interface FacilityHoursEntry {
  slots: string[];
  closedWeekdays: number[]; // 0(일)~6(토)
}
export type FacilityHoursMap = Record<string, FacilityHoursEntry>;

// 공개 엔드포인트라 관리자 비밀번호가 필요 없다(손님용 앱도 그대로 호출하는 API).
export async function fetchFacilityHours(): Promise<FacilityHoursMap> {
  const res = await fetch('/api/facility-hours');
  if (!res.ok) throw new Error('운영시간을 불러오지 못했습니다.');
  return res.json();
}

export function updateFacilityHours(
  secret: string,
  facilityId: string,
  facilityName: string,
  slots: string[],
  closedWeekdays: number[]
) {
  return adminRequest<{ facilityId: string; slots: string[]; closedWeekdays: number[] }>(
    secret,
    '/api/admin/update-facility-hours',
    { method: 'POST', body: JSON.stringify({ facilityId, facilityName, slots, closedWeekdays }) }
  );
}

// ---------- 이미지 업로드 ----------

function readFileAsResizedJpegBase64(file: File, maxSize = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('이미지 처리에 실패했습니다.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(secret: string, file: File, folder: 'hero' | 'partners'): Promise<string> {
  const dataBase64 = await readFileAsResizedJpegBase64(file);
  const filename = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  const res = await adminRequest<{ url: string }>(secret, '/api/admin/upload-image', {
    method: 'POST',
    body: JSON.stringify({ filename, dataBase64, folder }),
  });
  return res.url;
}

export { AdminApiError };
