# BUILD SPECIFICATION — OfficeHub
## Sistem Monitoring & Laporan Operasional Berbasis Web

**Bahasa aplikasi:** Bahasa Indonesia  
**Target deployment:** Vercel  
**Source code:** GitHub  
**Target:** Aplikasi web responsif untuk penggunaan kantor/operasional

---

# 1. INSTRUKSI UTAMA UNTUK AI CODING AGENT

Bangun aplikasi web bernama **OfficeHub**.

OfficeHub adalah aplikasi internal kantor yang digunakan banyak pengguna untuk:
- Login.
- Melihat dashboard monitoring.
- Menginput data monitoring.
- Melihat grafik monitoring yang otomatis berubah berdasarkan data.
- Menginput laporan operasional.
- Mengambil foto laporan langsung menggunakan kamera perangkat.
- Melihat riwayat laporan.
- Mengelola data berdasarkan role pengguna.

Aplikasi harus benar-benar runnable dan siap dideploy ke **Vercel melalui repository GitHub**.

## Aturan wajib

- Seluruh UI menggunakan Bahasa Indonesia.
- Jangan membuat mockup statis.
- Jangan menggunakan data hardcoded sebagai data utama.
- Semua data bisnis disimpan di database.
- Grafik membaca data database.
- Input user langsung dapat memengaruhi dashboard setelah data berhasil disimpan.
- Import Excel masuk ke database terlebih dahulu.
- Jangan membaca Excel langsung setiap kali dashboard dibuka.
- Permission harus diverifikasi di server/backend.
- Gunakan validasi form.
- Gunakan loading, empty, error, dan success state.
- Aplikasi responsive.
- Mobile harus menjadi perhatian utama karena form laporan menggunakan kamera.
- Jangan menambahkan fitur besar yang tidak diperlukan sebelum MVP selesai.

---

# 2. TARGET DEPLOYMENT

Arsitektur deployment:

```text
Developer
   ↓
GitHub Repository
   ↓
Vercel
   ↓
Production Web App
```

Aplikasi harus kompatibel dengan lingkungan serverless Vercel.

Jangan mengandalkan local filesystem sebagai penyimpanan permanen production.

Foto laporan dan file Excel harus menggunakan object storage/cloud storage yang kompatibel dengan Vercel.

---

# 3. STACK TEKNOLOGI

Gunakan:

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui atau komponen UI setara
- React Hook Form
- Zod
- Recharts untuk grafik

### Backend
Gunakan Next.js Route Handlers dan/atau Server Actions sesuai kebutuhan.

Authorization wajib dilakukan di server.

### Database
- PostgreSQL
- Prisma ORM

Database production harus menggunakan PostgreSQL cloud yang kompatibel dengan Vercel.

### Authentication
Gunakan authentication library yang aman dan kompatibel dengan Next.js/Vercel.

Password harus di-hash.

### Storage
Buat abstraction `StorageService`:

```text
StorageService
├── upload()
├── getUrl()
├── delete()
└── validate()
```

Production menggunakan object storage/cloud storage.

---

# 4. IDENTITAS VISUAL

Client meminta tampilan **lebih berwarna**, tetapi tetap profesional untuk kantor.

Gunakan:
- Background putih / abu-abu terang.
- Biru sebagai warna utama.
- Ungu sebagai warna statistik/data.
- Hijau untuk OK/sukses.
- Orange untuk peringatan.
- Merah untuk NG/error.
- Cyan sebagai aksen monitoring.
- Gradient ringan hanya pada area tertentu.
- Card rounded.
- Shadow lembut.
- Icon konsisten.
- Grafik berwarna dan mudah dibaca.

Hindari:
- Neon berlebihan.
- Gradient di semua elemen.
- Terlalu banyak warna dalam satu komponen.
- Animasi berlebihan.

Status:
```text
Hijau   = Selesai / OK
Biru    = Informasi / Monitoring
Ungu    = Statistik
Orange  = Peringatan
Merah   = NG / Error
Abu-abu = Draft / Tidak aktif
```

---

# 5. ROLE

Minimal:
```text
ADMIN
SUPERVISOR
USER
```

## ADMIN
- Melihat dashboard.
- Mengelola user.
- Mengelola shift.
- Mengelola gudang.
- Mengelola customer.
- Import Excel.
- Melihat seluruh monitoring.
- Melihat seluruh laporan.
- Mengelola pengaturan.

## SUPERVISOR
- Melihat dashboard.
- Melihat monitoring.
- Input monitoring.
- Melihat laporan yang diizinkan.
- Review laporan jika workflow approval digunakan.

## USER
- Melihat dashboard.
- Input monitoring.
- Input laporan.
- Melihat laporan miliknya.
- Melihat data monitoring yang diizinkan.

---

# 6. MENU APLIKASI

Menu utama:

```text
🏠 Dashboard
📊 Monitoring
📋 Laporan
📥 Import Excel       ← Admin
👥 Pengguna           ← Admin
⚙️ Pengaturan         ← Admin
```

Menu harus menyesuaikan role.

---

# 7. LOGIN

Route:

```text
/login
```

UI seluruhnya Bahasa Indonesia:

```text
┌─────────────────────────────┐
│          OfficeHub          │
│    Sistem Operasional       │
│                             │
│ Email                       │
│ [________________________]  │
│                             │
│ Kata Sandi                  │
│ [________________________]  │
│                             │
│        [ MASUK ]            │
└─────────────────────────────┘
```

---

# 8. DASHBOARD

Dashboard adalah halaman monitoring utama.

Dashboard harus langsung menampilkan data dan grafik.

Filter:

```text
Periode
[ Hari Ini ▼ ]

Tanggal
[ 17 September 2026 ]

Shift
[ Semua ▼ ]

Gudang
[ Semua ▼ ]

[ TERAPKAN FILTER ]
```

Semua KPI dan grafik harus mengikuti filter.

---

# 9. KPI DASHBOARD

Tampilkan card:

```text
┌──────────────┐
│ 👥 Operator  │
│     12       │
│ operator     │
└──────────────┘

┌──────────────┐
│ ✓ Qty OK     │
│    1.240     │
│ produk       │
└──────────────┘

┌──────────────┐
│ ✕ Qty NG     │
│      60      │
│ produk       │
└──────────────┘

┌──────────────┐
│ 📈 Persentase│
│    95,4%     │
│ OK           │
└──────────────┘
```

Angka di atas hanya contoh. Production harus mengambil data database.

---

# 10. GRAFIK DASHBOARD

Gunakan Recharts.

Minimal:

### Grafik Jumlah Operator
- Berdasarkan tanggal.
- Berdasarkan shift.
- Berdasarkan gudang.

### Grafik Qty OK vs Qty NG
Gunakan bar chart.

### Grafik Produksi Berdasarkan Gudang
Gunakan bar chart.

### Grafik Tren Produksi
Gunakan line chart.

Grafik harus memiliki:
- Tooltip.
- Legend bila diperlukan.
- Label sumbu yang jelas.
- Responsive container.
- Empty state jika belum ada data.

Jangan membuat grafik dengan data dummy permanen.

---

# 11. DATA DASHBOARD

Dashboard memiliki dua sumber monitoring:

```text
                 DATA MONITORING
                       │
              ┌────────┴────────┐
              ▼                 ▼
        IMPORT EXCEL         INPUT USER
              │                 │
              └────────┬────────┘
                       ▼
                   DATABASE
                       │
                       ▼
                  ANALYTICS
                       │
                       ▼
                  DASHBOARD
```

Setiap record monitoring memiliki:

```text
source_type = USER | EXCEL
```

Jika berasal dari Excel:

```text
import_batch_id
```

---

# 12. INPUT MONITORING

Route:

```text
/monitoring
```

Tombol:

```text
[ + INPUT MONITORING ]
```

Form:

```text
INPUT MONITORING

Tanggal
[ 17 September 2026 ]

Shift
[ Shift 1 ▼ ]

Jumlah Operator
[ 12 ]

Gudang
[ Gudang A ▼ ]

[ SIMPAN DATA ]
```

Field wajib:
- Tanggal
- Shift
- Jumlah Operator
- Gudang

---

# 13. VALIDASI MONITORING

- Tanggal wajib.
- Shift wajib.
- Jumlah Operator wajib.
- Jumlah Operator integer.
- Jumlah Operator >= 0.
- Gudang wajib.

Success:

```text
✓ Data monitoring berhasil disimpan.
```

---

# 14. DATA MASTER

Admin dapat mengelola:

### Shift
```text
Shift 1
Shift 2
Shift 3
```

### Gudang
```text
Gudang A
Gudang B
Gudang C
```

### Customer
Customer A, Customer B, dst.

Jangan hardcode data master jika client membutuhkan perubahan.

---

# 15. IMPORT EXCEL

Route:

```text
/import-excel
```

Hanya Admin.

UI:

```text
IMPORT DATA EXCEL

┌───────────────────────────────┐
│      📄 Tarik file ke sini    │
│                               │
│        atau                   │
│      [ PILIH FILE ]           │
└───────────────────────────────┘

Format:
.xlsx / .xls / .csv

[ VALIDASI FILE ]
```

---

# 16. FLOW IMPORT EXCEL

```text
Pilih File
    ↓
Upload
    ↓
Baca Excel
    ↓
Validasi Header
    ↓
Validasi Data
    ↓
Preview
    ↓
Admin Confirm
    ↓
Insert Database
    ↓
Simpan Import Batch
    ↓
Dashboard diperbarui
```

Jangan langsung memasukkan data sebelum validasi dan preview.

---

# 17. VALIDASI EXCEL

Minimal:
- Format file.
- Header.
- Tanggal.
- Shift.
- Jumlah operator.
- Gudang.
- Row yang kosong/rusak.
- Duplikasi yang relevan.

Jika ada error:

```text
Ditemukan 3 baris bermasalah.

Baris 12:
Jumlah Operator tidak valid.

Baris 25:
Gudang tidak ditemukan.

Baris 38:
Tanggal tidak valid.
```

Tampilkan pilihan:

```text
[ BATAL ]
[ KEMBALI & PERBAIKI ]
```

---

# 18. IMPORT BATCH

Setiap import disimpan:

```text
import_batches

id
file_name
file_url
uploaded_by
total_rows
success_rows
failed_rows
status
created_at
```

Status:
```text
PROCESSING
IMPORTED
FAILED
PARTIAL
```

Admin dapat melihat riwayat import.

---

# 19. MENU LAPORAN

Route:

```text
/laporan
```

Laporan berbeda dari monitoring.

UI:

```text
LAPORAN

[ + BUAT LAPORAN ]

Filter:
Tanggal
Customer
Shift
Batch
Status
```

List:

```text
#RPT-001
17 Sep 2026
Customer A
Batch B-001

Qty OK: 100
Qty NG: 4

[ LIHAT DETAIL ]
```

---

# 20. FORM LAPORAN

Field:

```text
1. Tanggal
2. Customer
3. Dimensi
4. Jenis Pipa
5. Batch
6. No NCR
7. Operator
8. Nama Operator
9. Shift
10. Qty OK
11. Qty NG
12. Keterangan NG
13. Keterangan Proses
14. Foto Laporan
```

Karena form cukup panjang, gunakan multi-step wizard.

---

# 21. FLOW FORM LAPORAN

```text
Informasi
   ↓
Produksi
   ↓
Hasil
   ↓
Foto
   ↓
Review
   ↓
Submit
```

Progress:

```text
●────●────○────○────○
Informasi
```

---

# 22. STEP INFORMASI

```text
INFORMASI LAPORAN

Tanggal
[ 17 September 2026 ]

Customer
[ Pilih Customer ▼ ]

Dimensi
[________________]

Batch
[________________]

Ada NCR?
○ Tidak
○ Ya
```

Jika Ya:

```text
No NCR
[ NCR-2026-001 ]
```

No NCR nullable jika tidak ada NCR.

---

# 23. STEP PRODUKSI

## Jenis Pipa

Multi-choice:

```text
☐ Kotak
☐ Bulat
```

Simpan secara terstruktur, bukan string comma-separated.

## Jenis Operator

Multi-choice:

```text
☐ Borongan
☐ Internal
```

Simpan secara terstruktur.

## Nama Operator

Gunakan master operator/user.

Jika satu laporan dapat memiliki beberapa operator, gunakan multi-select relation:

```text
[ Andi ] [ Rina ] [ + Tambah ]
```

---

# 24. SHIFT

```text
Shift
[ Shift 1 ▼ ]
```

Gunakan master shift yang sama dengan monitoring.

---

# 25. STEP HASIL PRODUKSI

```text
HASIL PRODUKSI

Qty OK
[ 100 ]

Qty NG
[ 4 ]

Total
104
```

Total otomatis:

```text
Total = Qty OK + Qty NG
```

User tidak menginput Total.

---

# 26. KETERANGAN NG

Jika:

```text
Qty NG > 0
```

maka Keterangan NG wajib:

```text
Keterangan NG
[____________________________]
[____________________________]
```

Jika Qty NG = 0, boleh kosong.

---

# 27. KETERANGAN PROSES

```text
Keterangan Proses

[________________________________]
[________________________________]
```

Status required/optional dibuat configurable sesuai keputusan client.

---

# 28. FOTO LAPORAN — CAMERA

Ini requirement utama.

Pada mobile tampilkan:

```text
FOTO LAPORAN

[ 📷 AMBIL FOTO ]

atau

[ PILIH DARI GALERI ]
```

Klik `AMBIL FOTO`:

```text
User
 ↓
Browser meminta izin kamera
 ↓
User Allow
 ↓
Kamera terbuka
 ↓
Ambil foto
 ↓
Preview
 ↓
[ AMBIL ULANG ] [ GUNAKAN FOTO ]
 ↓
Upload
```

Jika izin ditolak:

```text
Kamera tidak dapat digunakan.

Pastikan izin kamera telah diberikan.

[ COBA LAGI ]
[ PILIH DARI GALERI ]
```

Jangan membuat aplikasi gagal hanya karena kamera tidak tersedia.

Production menggunakan HTTPS melalui Vercel.

---

# 29. FOTO MULTIPLE

Default:

```text
Minimal 1 foto
Maksimal 5 foto
```

UI:

```text
Foto Laporan

┌────────┐ ┌────────┐
│ Foto 1 │ │ Foto 2 │
└────────┘ └────────┘

[ + AMBIL FOTO ]
```

Buat konfigurasi agar batas dapat diubah jika client memutuskan hanya satu foto.

---

# 30. METADATA FOTO

Simpan:

```text
report_photos

id
report_id
file_url
file_name
mime_type
file_size
captured_at
uploaded_at
uploaded_by
```

File disimpan di object storage, bukan PostgreSQL.

---

# 31. STEP REVIEW

Sebelum submit:

```text
REVIEW LAPORAN

Tanggal       17 Sep 2026
Customer      Customer A
Dimensi       100 x 100
Jenis Pipa    Kotak
Batch         B-001
No NCR        Tidak ada
Operator      Internal
Nama          Andi
Shift         Shift 1

Qty OK        100
Qty NG          4

Foto          2 file

[ KEMBALI ]
[ SUBMIT LAPORAN ]
```

---

# 32. SUBMIT LAPORAN

Flow:

```text
Submit
  ↓
Validate
  ↓
Upload foto
  ↓
Save report
  ↓
Save photo metadata
  ↓
Create activity log
  ↓
Update analytics
  ↓
Success
```

Success:

```text
✓ Laporan berhasil disimpan.

Nomor Laporan:
RPT-20260917-000123
```

Nomor laporan dibuat server-side.

---

# 33. STATUS LAPORAN

Gunakan:

```text
DRAFT
SUBMITTED
REVIEW
APPROVED
REVISION
REJECTED
```

Jika MVP belum membutuhkan approval, minimal:

```text
DRAFT
SUBMITTED
```

---

# 34. DETAIL LAPORAN

Route:

```text
/laporan/[id]
```

Tampilkan:
- Nomor laporan
- Tanggal
- Customer
- Dimensi
- Jenis Pipa
- Batch
- No NCR
- Operator
- Nama Operator
- Shift
- Qty OK
- Qty NG
- Keterangan NG
- Keterangan Proses
- Foto
- Status
- Dibuat oleh
- Waktu dibuat

---

# 35. HUBUNGAN MONITORING DAN LAPORAN

Monitoring:

```text
Tanggal
Shift
Jumlah Operator
Gudang
```

Laporan:

```text
Tanggal
Customer
Dimensi
Jenis Pipa
Batch
No NCR
Operator
Nama Operator
Shift
Qty OK
Qty NG
Keterangan
Foto
```

Keduanya dapat dianalisis berdasarkan:

```text
Tanggal + Shift
```

Namun jangan mengasumsikan laporan memiliki Gudang.

Jika pada tanggal dan shift yang sama terdapat beberapa gudang, hubungan tersebut ambigu.

**Sebelum production, konfirmasi dengan client apakah Gudang perlu menjadi field pada laporan.**

---

# 36. DASHBOARD ANALYTICS

Hitung:

```text
Total Operator
Total Qty OK
Total Qty NG
Total Produksi
Persentase OK
Persentase NG
Jumlah Laporan
Jumlah Batch
```

Formula:

```text
Total Produksi = Qty OK + Qty NG

Persentase OK =
Qty OK / Total Produksi × 100%

Persentase NG =
Qty NG / Total Produksi × 100%
```

Jika Total Produksi = 0, jangan melakukan pembagian.

---

# 37. DASHBOARD FILTER

Minimal:

```text
Tanggal
Shift
Gudang
```

Jika data laporan digunakan untuk analytics:

```text
Customer
Jenis Pipa
Operator
Batch
```

Semua grafik mengikuti filter.

---

# 38. DATABASE

Gunakan PostgreSQL + Prisma.

## users

```text
id
name
email
password_hash
role
job_title
status
created_at
updated_at
```

## shifts

```text
id
name
description
is_active
created_at
updated_at
```

## warehouses

```text
id
name
description
is_active
created_at
updated_at
```

## customers

```text
id
name
description
is_active
created_at
updated_at
```

## operators

```text
id
name
type
is_active
created_at
updated_at
```

Type:

```text
BORONGAN
INTERNAL
```

---

# 39. MONITORING TABLE

```text
monitoring_records

id
date
shift_id
operator_count
warehouse_id
source_type
import_batch_id
created_by
created_at
updated_at
```

---

# 40. REPORT TABLE

```text
reports

id
report_number
date
customer_id
dimension
batch_number
has_ncr
ncr_number
shift_id
qty_ok
qty_ng
ng_description
process_description
status
created_by
created_at
updated_at
```

---

# 41. REPORT PIPE TYPES

```text
report_pipe_types

id
report_id
pipe_type
```

Pipe type:

```text
KOTAK
BULAT
```

---

# 42. REPORT OPERATOR TYPES

```text
report_operator_types

id
report_id
operator_type
```

Type:

```text
BORONGAN
INTERNAL
```

---

# 43. REPORT OPERATORS

```text
report_operators

id
report_id
operator_id
```

---

# 44. REPORT PHOTOS

```text
report_photos

id
report_id
file_url
file_name
mime_type
file_size
captured_at
uploaded_at
uploaded_by
```

---

# 45. IMPORT BATCH

```text
import_batches

id
file_name
file_url
uploaded_by
total_rows
success_rows
failed_rows
status
created_at
```

---

# 46. ACTIVITY LOG

```text
activity_logs

id
user_id
action
entity_type
entity_id
metadata
created_at
```

Contoh:

```text
REPORT_CREATED
REPORT_SUBMITTED
MONITORING_CREATED
EXCEL_IMPORTED
USER_CREATED
```

---

# 47. API

## Auth

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Monitoring

```text
GET  /api/monitoring
POST /api/monitoring
GET  /api/monitoring/:id
```

## Dashboard

```text
GET /api/dashboard/summary
GET /api/dashboard/operator
GET /api/dashboard/production
GET /api/dashboard/warehouse
GET /api/dashboard/trend
```

Semua endpoint dashboard menerima filter.

---

# 48. REPORT API

```text
GET    /api/reports
POST   /api/reports
GET    /api/reports/:id
PATCH  /api/reports/:id
DELETE /api/reports/:id
POST   /api/reports/:id/submit
```

Foto:

```text
POST   /api/reports/:id/photos
DELETE /api/reports/:id/photos/:photoId
```

---

# 49. EXCEL API

```text
POST /api/import/excel
GET  /api/imports
GET  /api/imports/:id
POST /api/imports/:id/confirm
```

---

# 50. ADMIN API

```text
GET   /api/users
POST  /api/users
PATCH /api/users/:id

GET   /api/shifts
POST  /api/shifts
PATCH /api/shifts/:id

GET   /api/warehouses
POST  /api/warehouses
PATCH /api/warehouses/:id

GET   /api/customers
POST  /api/customers
PATCH /api/customers/:id
```

---

# 51. SECURITY

Wajib:
- Password hashing.
- Secure session.
- Server-side authorization.
- Input validation.
- Login rate limiting.
- Secure file upload.
- MIME validation.
- Extension validation.
- File size validation.
- Private storage access.
- SQL injection protection melalui ORM/parameterization.
- Activity/audit log.

Jangan:
```text
❌ password plaintext
❌ role dari localStorage sebagai sumber kebenaran
❌ unrestricted file upload
❌ private files public
❌ trust user_id dari frontend tanpa authorization
```

---

# 52. FILE UPLOAD

Foto:

```text
JPG
JPEG
PNG
WEBP
Max 10 MB/file
```

Excel:

```text
XLSX
XLS
CSV
Max 10 MB
```

Generate nama file yang aman di server.

---

# 53. RESPONSIVE DESIGN

Desktop:
```text
Sidebar + Content
```

Mobile:
```text
Header + Content + Bottom Navigation
```

Form laporan harus nyaman digunakan pada layar mobile.

Button kamera minimal sekitar 48px tinggi.

---

# 54. ERROR / LOADING / EMPTY STATE

Semua halaman harus memiliki state yang jelas.

Loading:

```text
Memuat data...
```

Empty:

```text
Belum ada data.

[ TAMBAH DATA ]
```

Error:

```text
Terjadi kesalahan saat mengambil data.

[ COBA LAGI ]
```

Success:

```text
✓ Data berhasil disimpan.
```

---

# 55. SEARCH DAN FILTER LAPORAN

Laporan dapat dicari berdasarkan:

```text
Nomor Laporan
Customer
Batch
No NCR
Nama Operator
```

Filtering dilakukan server-side untuk dataset besar.

---

# 56. VALIDATION LAPORAN

Rules:

```text
Tanggal          → wajib
Customer         → wajib
Dimensi          → wajib
Jenis Pipa       → minimal 1
Batch            → wajib
No NCR           → conditional
Operator         → minimal 1
Nama Operator    → wajib
Shift            → wajib
Qty OK           → >= 0
Qty NG           → >= 0
Keterangan NG    → wajib jika Qty NG > 0
Keterangan Proses→ configurable
Foto             → minimal 1
```

---

# 57. DUPLICATE SUBMISSION

Cegah user mengirim laporan dua kali karena double-click.

Gunakan:
- disabled button saat submitting;
- database transaction;
- idempotency bila diperlukan.

---

# 58. DATABASE TRANSACTION

Submit laporan harus atomic:

```text
BEGIN TRANSACTION

Create report
Create pipe types
Create operator types
Create operator relations
Create photo metadata
Create activity log

COMMIT
```

Jika gagal:

```text
ROLLBACK
```

---

# 59. PERFORMANCE

Jangan mengambil seluruh database ke browser.

Gunakan:

```text
Database aggregation
       ↓
Server/API
       ↓
Dashboard
```

Index minimal:

```text
monitoring_records.date
monitoring_records.shift_id
monitoring_records.warehouse_id

reports.date
reports.customer_id
reports.shift_id
reports.batch_number
```

---

# 60. VERCEL DEPLOYMENT

Target:

```text
GitHub
   ↓
Vercel
   ↓
Environment Variables
   ↓
Deploy
```

`.env.example` minimal:

```text
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=

STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
```

Sesuaikan variable storage dengan provider yang dipilih.

Jangan commit `.env`.

---

# 61. GITHUB

Repository harus berisi:

```text
README.md
.env.example
.gitignore
package.json
prisma/
app/
components/
lib/
```

Jangan commit:
```text
.env
.env.local
password
API keys
database credentials
storage credentials
```

---

# 62. CI / BUILD CHECK

Sebelum deployment:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Semua harus berhasil.

---

# 63. SEED DATA

Buat data development:

```text
1 Admin
1 Supervisor
3 User

Shift 1
Shift 2
Shift 3

Gudang A
Gudang B
Gudang C

Customer A
Customer B
Customer C
```

Buat sample:
```text
10 monitoring records
10 reports
sample dashboard data
```

Data sample hanya untuk development.

---

# 64. TESTING

## Authentication
```text
✓ Login valid
✓ Login invalid
✓ Unauthorized access
```

## Monitoring
```text
✓ Create monitoring
✓ Validation
✓ Dashboard berubah
```

## Excel
```text
✓ Valid file
✓ Invalid header
✓ Invalid row
✓ Import success
```

## Report
```text
✓ Create report
✓ Multi-choice pipe
✓ Multi-choice operator
✓ Qty validation
✓ NCR conditional
✓ Camera/photo upload
✓ Submit
```

## Authorization
```text
✓ User cannot import Excel
✓ User cannot manage users
✓ Supervisor restrictions
✓ Admin access
```

---

# 65. IMPLEMENTATION PHASE

## Phase 1 — Project Setup

```text
Next.js
TypeScript
Tailwind
UI components
Prisma
PostgreSQL
Authentication
Environment
```

## Phase 2 — Database

```text
Schema
Migration
Seed
Relations
Indexes
```

## Phase 3 — Authentication & RBAC

```text
Login
Session
Roles
Authorization
Protected routes
```

## Phase 4 — Monitoring

```text
Monitoring form
Master shift
Master gudang
Monitoring table
Validation
```

## Phase 5 — Dashboard

```text
KPI
Filters
Charts
Database aggregation
Dynamic refresh
```

## Phase 6 — Excel

```text
Upload
Parse
Validate
Preview
Import
Import history
```

## Phase 7 — Reports

```text
Report list
Multi-step form
Validation
Multi-choice
Qty
NCR
```

## Phase 8 — Camera

```text
Camera permission
Capture
Preview
Retake
Upload
Storage
Photo metadata
```

## Phase 9 — Integration

```text
Report analytics
Dashboard analytics
Activity logs
Search
```

## Phase 10 — Production

```text
Security review
Tests
Build
Vercel compatibility
README
Deployment
```

---

# 66. DEFINITION OF DONE

MVP selesai jika:

- [ ] Login bekerja.
- [ ] Role bekerja.
- [ ] Dashboard bekerja.
- [ ] Dashboard memiliki grafik berwarna.
- [ ] Grafik membaca database.
- [ ] Input monitoring bekerja.
- [ ] Input monitoring memengaruhi dashboard.
- [ ] Import Excel bekerja.
- [ ] Excel divalidasi.
- [ ] Data Excel masuk database.
- [ ] Dashboard menggunakan data Excel.
- [ ] Menu laporan bekerja.
- [ ] Semua field laporan tersedia.
- [ ] Jenis pipa multi-choice.
- [ ] Operator multi-choice.
- [ ] Qty OK/NG tervalidasi.
- [ ] Keterangan NG conditional.
- [ ] Kamera bekerja pada mobile.
- [ ] Foto dapat di-preview.
- [ ] Foto dapat diambil ulang.
- [ ] Foto tersimpan di object storage.
- [ ] Detail laporan bekerja.
- [ ] Search/filter bekerja.
- [ ] Authorization bekerja di backend.
- [ ] Responsive desktop/mobile.
- [ ] Loading state tersedia.
- [ ] Empty state tersedia.
- [ ] Error state tersedia.
- [ ] README tersedia.
- [ ] `.env.example` tersedia.
- [ ] Tidak ada secret di repository.
- [ ] `npm run build` berhasil.
- [ ] Siap deploy ke Vercel.

---

# 67. BUSINESS RULE YANG HARUS DIKONFIRMASI CLIENT

Sebelum production final, konfirmasi:

1. Format Excel sebenarnya.
2. Kolom Excel yang digunakan.
3. Grafik apa saja yang wajib.
4. Apakah Nama Operator dapat lebih dari satu.
5. Apakah No NCR wajib atau opsional.
6. Apakah Keterangan Proses wajib atau opsional.
7. Apakah foto minimal satu atau boleh lebih.
8. Apakah laporan perlu approval Supervisor.
9. Apakah laporan harus memiliki Gudang.
10. Apakah Qty OK/NG dashboard berasal dari laporan, Excel, atau sumber lain.

Jika informasi belum tersedia, jangan mengarang business rule. Buat implementasi configurable dan gunakan default MVP yang sederhana.

---

# 68. INSTRUKSI FINAL UNTUK AI CODING AGENT

Bangun aplikasi ini secara bertahap sesuai Phase.

Pada setiap phase:

1. Implementasikan fitur.
2. Buat migration jika schema berubah.
3. Buat validation.
4. Implementasikan authorization.
5. Buat UI responsive.
6. Jalankan lint.
7. Jalankan typecheck.
8. Jalankan test.
9. Jalankan build.
10. Perbaiki error sebelum lanjut.
11. Update README jika command/setup berubah.

Jangan mengganti stack tanpa alasan teknis.

Jangan menghapus fitur yang sudah bekerja.

Jangan mengganti database nyata dengan mock data.

Jangan membuat dashboard palsu.

---

# 69. HASIL AKHIR

Aplikasi final harus terasa seperti:

> **Sistem Monitoring dan Laporan Operasional Kantor yang modern, berwarna, mudah digunakan, mobile-friendly, dan terhubung ke satu database.**

Alur monitoring:

```text
LOGIN
  ↓
DASHBOARD
  ↓
Lihat grafik
  ↓
Input Monitoring
  ↓
Database
  ↓
KPI/Grafik diperbarui
```

Alur laporan:

```text
LOGIN
  ↓
LAPORAN
  ↓
Buat Laporan
  ↓
Isi Form
  ↓
Ambil Foto Kamera
  ↓
Preview
  ↓
Review
  ↓
Submit
  ↓
Nomor Laporan
  ↓
Database
```

Alur Excel:

```text
ADMIN
  ↓
IMPORT EXCEL
  ↓
Upload
  ↓
Validasi
  ↓
Preview
  ↓
Confirm
  ↓
Database
  ↓
Dashboard
  ↓
Grafik diperbarui
```

Semua data harus nyata, tersimpan di database, mengikuti role/permission, dan siap digunakan pada deployment Vercel.
