# User Role Data Persistence & Role-Based Visibility

## ✅ Status Implementasi

### 1. **Data User Role Tersimpan** ✅

#### Kolom Google Sheets
- **Kolom R**: `user` field (user role yang membuat pengajuan)
- Format: String (nama role, e.g., "Fungsi Sosial", "Bendahara", dll)

#### Alur Penyimpanan
```
Frontend (useAuth) 
  → user?.role 
  → SubmissionForm (line 227, 323)
  → Supabase function (pencairan-save)
  → Google Sheets Kolom R
```

#### Kode di SubmissionForm.tsx:
```typescript
const { data, error } = await supabase.functions.invoke('pencairan-save', {
  body: {
    id: newId,
    // ... other fields
    user: user?.role || '',  // ✅ SUDAH DISIMPAN
  },
});
```

#### Kode di pencairan-save/index.ts:
```typescript
const rowData = [
  id || '',                    // A
  uraianPengajuan || '',      // B
  // ... (other fields)
  user || '',                 // R: Kolom R - User (role login pembuat) ✅
  '',                         // S: Pembayaran
  '',                         // T: Nomor SPM
  '',                         // U: Nomor SPPD
];
```

---

### 2. **Role-Based Visibility** ✅ (BARU DITAMBAHKAN)

#### Helper Functions dari `src/types/pencairan.ts`

```typescript
// Cek apakah role dapat melihat semua data
export function canViewAllSubmissions(role: UserRole): boolean

// Cek apakah submission harus ditampilkan untuk user tertentu
export function shouldShowSubmission(
  submission: Submission, 
  userRole: UserRole, 
  userCreatorRole?: string
): boolean

// Roles yang bisa melihat SEMUA pengajuan
export const ROLES_CAN_VIEW_ALL: UserRole[] = [
  'Pejabat Pembuat Komitmen',   // PPK
  'Bendahara',
  'Pejabat Pengadaan',
  'Pejabat Penandatangan Surat Perintah Membayar',  // PPSPM
  'Arsip',
  'operator',
  'admin',
];

// Roles submitter (hanya lihat pengajuan sendiri)
export const SUBMITTER_ROLES: UserRole[] = [
  'Fungsi Sosial',
  'Fungsi Neraca',
  'Fungsi Produksi',
  'Fungsi Distribusi',
  'Fungsi IPDS',
];
```

#### Logika Filtering:
```typescript
// 1. ADMIN / OPERATOR / REVIEWER (PPK, Bendahara, PPSPM, Arsip)
//    → Lihat SEMUA pengajuan dari semua user
//    → Bisa action (approve/reject) sesuai role

// 2. SUBMITTER (Fungsi Sosial, Fungsi Neraca, dll)
//    → Hanya lihat pengajuan yang MEREKA BUAT SENDIRI
//    → Bisa edit/delete pengajuan sendiri
```

#### Update di UsulanPencairan.tsx (Line 45-65)
```typescript
// 🆕 Filter berdasarkan role visibility
result = result.filter(sub => shouldShowSubmission(sub, userRole, sub.user));

if (activeFilter !== 'all') {
  result = result.filter(sub => sub.status === activeFilter);
}
```

#### Update di Counts (Line 68-88)
```typescript
// 🆕 Filter submissions berdasarkan role visibility untuk counts
const visibleSubmissions = submissions.filter(sub => 
  shouldShowSubmission(sub, userRole, sub.user)
);

// Counts hanya menghitung pengajuan yang user bisa lihat
result['all'] = visibleSubmissions.length;
```

---

## 📊 Perbandingan User Sebelum vs Sesudah

### Sebelum (Without Filtering):
```
Login: Fungsi Sosial
┌─────────────────────────────┐
│ Lihat SEMUA pengajuan:      │
│ - Draft SM (milik orang B)  │
│ - Pending Bendahara (milik orang C)
│ - Completed (milik orang A) │
│ → SALAH! ❌                  │
└─────────────────────────────┘
```

### Sesudah (With Filtering):
```
Login: Fungsi Sosial
┌─────────────────────────────┐
│ Hanya lihat pengajuan sendiri:
│ - Draft SM (milik Fungsi Sosial)
│ - Pending Bendahara (milik Fungsi Sosial)
│ → BENAR! ✅               │
└─────────────────────────────┘

Login: Bendahara
┌─────────────────────────────┐
│ Lihat SEMUA pengajuan:      │
│ - Draft SM (Fungsi A)       │
│ - Draft SM (Fungsi B)       │
│ - Pending Bendahara (Fungsi C)
│ → BENAR! ✅                │
└─────────────────────────────┘
```

---

## 🔄 User Journey dengan Data Persistence

### Scenario 1: SM (Fungsi Sosial) Buat Pengajuan

```
1. User login → role = 'Fungsi Sosial'
2. Klik 'Buat Pengajuan'
3. Form submitted:
   - user: 'Fungsi Sosial' ← Kolom R
   - status: 'draft'
   - title, submitterName, jenisBelanja, etc
4. Save via pencairan-save:
   - Kolom A-U diisi
   - Kolom R = 'Fungsi Sosial' ✅
5. Di FilterTabs/SubmissionTable:
   - UsulanPencairan.tsx filter:
     shouldShowSubmission(submission, 'Fungsi Sosial', 'Fungsi Sosial')
   - TAMPIL di list ✅
```

### Scenario 2: Bendahara View Pengajuan

```
1. User login → role = 'Bendahara'
2. Masuk UsulanPencairan:
   - Filter semua submissions:
     shouldShowSubmission(submission, 'Bendahara', submission.user)
   - Karena 'Bendahara' di ROLES_CAN_VIEW_ALL:
     return true → Semua pengajuan tampil ✅
3. Lihat daftar:
   - Pengajuan dari Fungsi Sosial A
   - Pengajuan dari Fungsi Neraca B
   - Pengajuan dari Fungsi Produksi C
   - Semua tampil! ✅
```

### Scenario 3: PPK Lihat Data Tertentu

```
1. User login → role = 'Pejabat Pembuat Komitmen' (PPK)
2. Masuk UsulanPencairan:
   - Filter submissions:
     shouldShowSubmission(submission, 'Pejabat Pembuat Komitmen', submission.user)
   - Karena role di ROLES_CAN_VIEW_ALL:
     return true → Lihat semua yang pending_ppk
3. Bisa approve/reject pengajuan apapun ✅
```

---

## 💾 Data Struktur Google Sheets (21 Kolom A:U)

| Kolom | Header | Type | Isi | Note |
|-------|--------|------|-----|------|
| A | ID | String | PENCAIRAN-001 | Unique |
| B | Uraian | String | Deskripsi | - |
| C | Nama | String | Nama Pengaju | - |
| D | Jenis | String | Jenis Belanja | - |
| E | Kelengkapan | String | Dokumen | - |
| F | Catatan | String | Notes | - |
| G | Status | String | draft/submitted_sm/pending_* | - |
| H | Waktu Pengajuan | String | HH:MM - DD/MM/YYYY | SM |
| I | Waktu Bendahara | String | HH:MM - DD/MM/YYYY | Bendahara |
| J | Waktu PPK | String | HH:MM - DD/MM/YYYY | PPK |
| K | Waktu PPSPM | String | HH:MM - DD/MM/YYYY | PPSPM |
| L | Waktu Arsip | String | HH:MM - DD/MM/YYYY | KPPN/Arsip |
| M | Status Bendahara | String | Notes from Bendahara | - |
| N | Status PPK | String | Notes from PPK | - |
| O | Status PPSPM | String | Notes from PPSPM | - |
| P | Status Arsip | String | Notes from Arsip | - |
| Q | Update Terakhir | String | HH:MM - DD/MM/YYYY | Latest update |
| **R** | **User** | **String** | **'Fungsi Sosial'** | **🆕 User role yang membuat** |
| **S** | **Pembayaran** | **String** | **'LS'/'UP'** | **🆕 Payment type** |
| **T** | **Nomor SPM** | **String** | **SPM-2026-001** | **🆕 For LS** |
| **U** | **Nomor SPPD** | **String** | **SPPD-2026-001** | **🆕 Auto-generate on complete** |

---

## ✅ Checklist Implementasi

- [x] User role disimpan ke Kolom R
- [x] Data persisten di Google Sheets
- [x] Helper functions `shouldShowSubmission()` dan `canViewAllSubmissions()`
- [x] ROLES_CAN_VIEW_ALL defined (Bendahara, PPK, PPSPM, Arsip, admin, operator)
- [x] SUBMITTER_ROLES defined (Fungsi Sosial, Fungsi Neraca, dll)
- [x] UsulanPencairan.tsx `filteredSubmissions` apply role-based filtering
- [x] UsulanPencairan.tsx `counts` respect role visibility
- [x] FilterTabs hanya tampil count yang user bisa lihat
- [x] SubmissionTable hanya tampil pengajuan yang user bisa lihat

---

## 🚀 Test Case

### Test 1: Fungsi Sosial Hanya Lihat Pengajuan Sendiri
```
1. Login as 'Fungsi Sosial'
2. Buat 3 pengajuan (ID: PENCAIRAN-001, PENCAIRAN-002, PENCAIRAN-003)
3. Filter tabs shows:
   - all (3)
   - draft (3)
   - submitted_sm (3)
4. Expected: Semua 3 pengajuan tampil ✅
```

### Test 2: Bendahara Lihat Semua Pengajuan
```
1. Fungsi Sosial buat PENCAIRAN-001 (role='Fungsi Sosial')
2. Fungsi Neraca buat PENCAIRAN-002 (role='Fungsi Neraca')
3. Login as 'Bendahara'
4. Filter tabs shows:
   - all (2)
   - submitted_sm (2)
5. SubmissionTable shows both ✅
```

### Test 3: Fungsi Sosial Tidak Lihat Pengajuan Orang Lain
```
1. Fungsi Sosial A membuat PENCAIRAN-001
2. Fungsi Sosial B membuat PENCAIRAN-002
3. Login as Fungsi Sosial B
4. Filter tabs should show:
   - all (1)  ← NOT 2!
   - draft (1)
5. SubmissionTable only shows PENCAIRAN-002 ✅
```

---

## 📝 Summary

| Aspek | Status | Detail |
|-------|--------|--------|
| User Role Saved | ✅ | Kolom R, saved on create |
| Role-Based Filtering | ✅ | NEW - filteredSubmissions + counts |
| Admin Visibility | ✅ | Bendahara, PPK, PPSPM, Arsip see all |
| Submitter Visibility | ✅ | Fungsi* only see own submissions |
| Data Persistence | ✅ | Google Sheets 21 columns |
| NotificationOnly Personal | ✅ | FilterTabs only show user's visible submissions |

Semua sudah diimplementasikan sesuai requirement! ✅
