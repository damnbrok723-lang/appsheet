# PROMPT PEMBANGUNAN SISTEM MONITORING & LAPORAN OPERASIONAL

## 1. PERAN AI

Kamu adalah **Senior Full-Stack Engineer + UI/UX Designer + Database Engineer** yang bertugas membangun aplikasi web production-ready untuk kebutuhan operasional perusahaan.

Jangan hanya membuat mockup atau halaman statis.

**BANGUN APLIKASI YANG BENAR-BENAR BERFUNGSI**, lengkap dengan:

* Authentication
* Role & permission
* Database
* CRUD
* Dashboard
* Grafik
* Input data
* Import Excel
* Export Excel
* Export PDF
* Upload foto melalui kamera HP
* Workflow laporan
* Approval
* Revisi
* Notifikasi
* Audit log
* Validasi
* Responsive mobile
* Deployment ke Vercel

Seluruh interface aplikasi harus menggunakan **Bahasa Indonesia**.

Nama aplikasi:

# Office Monitoring System

Tujuan aplikasi:
Membantu perusahaan melakukan monitoring operasional/produksi dan pembuatan laporan secara terpusat sehingga user dapat menginput data dengan mudah dan admin tidak perlu melakukan input manual satu per satu.

---

# 2. TEKNOLOGI

Gunakan:

* Next.js terbaru
* TypeScript
* App Router
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* Recharts
* PostgreSQL
* Prisma ORM
* Authentication yang aman
* ExcelJS atau library Excel yang stabil
* Object Storage untuk foto
* Vercel untuk deployment
* GitHub sebagai repository

Jangan gunakan Flutter.

Aplikasi harus dapat dijalankan:

```bash
npm install
npm run dev
```

dan dapat dideploy ke:

```text
GitHub → Vercel
```

---

# 3. DESAIN UI

UI harus:

* Modern
* Minimalis
* Profesional
* Cocok untuk perusahaan
* Mudah dipahami user non-teknis
* Mobile-first
* Responsive
* Tidak terlihat seperti template admin generik

Gunakan warna yang lebih hidup tetapi tetap profesional.

Palet visual:

* Biru → primary / informasi
* Ungu → statistik
* Hijau → OK / berhasil
* Merah → NG / error
* Orange → warning / pending
* Cyan → monitoring
* Abu-abu → neutral

Gunakan:

* Card
* Badge
* Table
* Modal
* Drawer
* Dropdown
* Tabs
* Progress
* Skeleton loading
* Toast notification
* Empty state
* Confirmation dialog

Dashboard harus terlihat hidup dan informatif.

---

# 4. ROLE USER

Buat minimal 3 role:

## USER

User dapat:

* Login
* Melihat dashboard sesuai hak akses
* Input monitoring
* Membuat laporan
* Upload foto
* Menggunakan kamera HP
* Melihat laporan miliknya
* Mengedit laporan yang dikembalikan untuk revisi
* Melihat status laporan

User tidak dapat:

* Import Excel
* Mengelola user
* Menghapus seluruh data
* Mengubah master data
* Melihat data yang bukan hak aksesnya

---

## SUPERVISOR

Supervisor dapat:

* Login
* Melihat dashboard
* Melihat data tim
* Melihat laporan
* Review laporan
* Approve laporan
* Meminta revisi
* Menolak laporan
* Export laporan
* Melihat statistik tim

---

## ADMIN

Admin dapat:

* Semua kemampuan Supervisor
* Mengelola user
* Mengelola role
* Mengelola shift
* Mengelola gudang
* Mengelola customer
* Mengelola operator
* Import Excel
* Export Excel
* Export PDF
* Melihat semua laporan
* Melihat semua monitoring
* Mengelola konfigurasi
* Melihat audit log

---

# 5. MENU UTAMA

Sidebar:

```text
Dashboard

Monitoring

Laporan

├── Semua Laporan
├── Laporan Saya
├── Menunggu Review
├── Revisi
└── Disetujui

Import Excel

Export Data

Pengguna

Master Data

├── Operator
├── Customer
├── Shift
└── Gudang

Audit Log

Pengaturan
```

Menu harus otomatis menyesuaikan berdasarkan role.

---

# 6. LOGIN

Buat halaman:

```text
/login
```

UI Bahasa Indonesia.

Field:

```text
Email
Password

[ Masuk ]
```

Tambahkan:

* Show/hide password
* Loading state
* Error message
* Session management
* Logout
* Protected routes

Jangan membuat password dummy hardcoded di production.

---

# 7. DASHBOARD

Dashboard adalah pusat monitoring.

Saat dashboard dibuka, data langsung diambil dari database.

**JANGAN menggunakan grafik hardcoded.**

Jika database berisi data:

```text
10
100
1000
```

maka grafik harus otomatis mengikuti data tersebut.

---

## Filter Dashboard

Sediakan:

```text
Periode
[ Hari ini ▼ ]

Tanggal mulai
Tanggal akhir

Shift
[ Semua ▼ ]

Gudang
[ Semua ▼ ]

Customer
[ Semua ▼ ]

[ Terapkan Filter ]
[ Reset ]
```

---

# 8. KPI DASHBOARD

Tampilkan:

### Total Operator

Jumlah operator aktif berdasarkan data.

### Total Produksi

```text
Qty OK + Qty NG
```

### Total OK

Total Qty OK.

### Total NG

Total Qty NG.

### Persentase OK

```text
Qty OK / (Qty OK + Qty NG) × 100
```

### Jumlah Laporan

Jumlah laporan pada periode filter.

### Menunggu Review

Jumlah laporan yang belum direview.

---

# 9. GRAFIK DASHBOARD

Gunakan Recharts.

Minimal:

## Grafik 1 — Jumlah Operator

Line chart/bar chart:

```text
Tanggal → jumlah operator
```

## Grafik 2 — OK vs NG

Bar chart atau stacked bar.

```text
OK
NG
```

## Grafik 3 — Produksi per Gudang

Bar chart:

```text
Gudang A
Gudang B
Gudang C
```

## Grafik 4 — Trend Produksi

Line chart berdasarkan tanggal.

## Grafik 5 — Produksi per Shift

```text
Pagi
Siang
Malam
```

## Grafik 6 — Distribusi Jenis Pipa

```text
Kotak
Bulat
```

## Grafik 7 — Status Laporan

Donut/pie chart:

```text
Draft
Dikirim
Review
Revisi
Disetujui
Ditolak
```

Semua grafik harus memiliki:

* Tooltip
* Legend
* Responsive
* Empty state
* Loading state
* Filter mengikuti dashboard

---

# 10. SUMBER DATA DASHBOARD

Dashboard dapat memperoleh data dari:

```text
1. Input user
2. Import Excel
3. Data laporan
```

Semua data harus masuk ke database terlebih dahulu.

Arsitektur:

```text
User Input ───────┐
                  │
Excel Import ─────┼──→ DATABASE ──→ DASHBOARD
                  │
Laporan ──────────┘
```

Jangan membaca file Excel secara langsung setiap kali dashboard dibuka.

---

# 11. MONITORING

Menu:

```text
/monitoring
```

Form:

```text
Tanggal
Shift
Jumlah Operator
Gudang
```

Field:

### Tanggal

Date picker.

### Shift

Dropdown dari master shift.

Contoh:

```text
Pagi
Siang
Malam
```

### Jumlah Operator

Numeric input.

Validasi:

```text
>= 0
```

### Gudang

Dropdown dari master gudang.

---

# 12. SUMBER DATA MONITORING

Setiap data monitoring memiliki:

```text
source_type
```

Nilai:

```text
USER
EXCEL
```

Jika berasal dari Excel, simpan juga:

```text
import_batch_id
```

agar admin dapat mengetahui data berasal dari file import yang mana.

---

# 13. IMPORT EXCEL

Ini adalah fitur PENTING.

Admin harus dapat mengupload Excel untuk memasukkan banyak data sekaligus.

Menu:

```text
Import Excel
```

Tampilan:

```text
┌─────────────────────────────────────┐
│ Import Data Excel                   │
│                                     │
│ [ Download Template Excel ]         │
│                                     │
│ Drag & Drop file Excel              │
│ atau                                │
│ [ Pilih File ]                      │
└─────────────────────────────────────┘
```

Format:

```text
.xlsx
```

---

# 14. TEMPLATE EXCEL HARUS PROFESIONAL

JANGAN membuat template Excel kosong.

Buat template Excel yang benar-benar siap digunakan.

Template harus memiliki:

## Sheet 1 — PETUNJUK

Isi:

```text
PETUNJUK PENGISIAN DATA

1. Jangan mengubah nama kolom pada sheet DATA.
2. Jangan menghapus kolom wajib.
3. Tanggal harus menggunakan format DD/MM/YYYY.
4. Shift harus menggunakan nilai yang tersedia.
5. Jumlah Operator harus berupa angka.
6. Gudang harus menggunakan nama gudang yang terdaftar.
7. Jangan mengisi rumus pada kolom yang disediakan sistem.
8. Satu baris = satu record.
9. Jangan menggabungkan cell pada sheet DATA.
10. Setelah selesai, simpan dalam format .xlsx lalu upload ke sistem.
```

Tambahkan contoh:

```text
Contoh:
17/09/2026 | Pagi | 12 | Gudang A
```

---

# 15. SHEET DATA

Nama sheet:

```text
DATA
```

Header:

```text
Tanggal
Shift
Jumlah Operator
Gudang
```

Format harus rapi.

Gunakan:

* Freeze header
* Auto filter
* Column width otomatis
* Header styling
* Border
* Table format
* Date format
* Number format

Berikan minimal 5–10 contoh data.

Contoh:

```text
Tanggal     Shift   Jumlah Operator   Gudang
17/09/2026  Pagi    12                Gudang A
17/09/2026  Siang   10                Gudang A
17/09/2026  Malam   8                 Gudang B
18/09/2026  Pagi    11                Gudang A
18/09/2026  Siang   10                Gudang C
```

---

# 16. VALIDASI EXCEL

Sebelum import:

```text
Upload
↓
Parse Excel
↓
Validasi header
↓
Validasi setiap baris
↓
Preview
↓
Admin konfirmasi
↓
Import
```

Jangan langsung memasukkan data.

Jika terdapat error:

```text
Baris 8
❌ Shift "Pagi2" tidak ditemukan

Baris 13
❌ Jumlah Operator harus berupa angka

Baris 21
❌ Gudang "Gudang X" tidak terdaftar
```

Tampilkan:

```text
Jumlah valid: 97
Jumlah error: 3
```

Admin dapat:

```text
[ Download Error Excel ]
```

agar admin dapat memperbaiki file.

---

# 17. IMPORT MODE

Sediakan pilihan:

```text
○ Tambahkan data baru
○ Update data yang sama
```

Jika update digunakan, sistem harus mempunyai mekanisme identifikasi record yang aman.

Jangan menyebabkan duplicate data tanpa peringatan.

---

# 18. IMPORT BATCH

Setiap import harus memiliki record:

```text
Import Batch
```

Simpan:

```text
Nama file
Tanggal upload
User yang upload
Jumlah baris
Jumlah berhasil
Jumlah gagal
Status
```

Contoh:

```text
IMPORT-20260917-001

File:
Monitoring_September.xlsx

Uploader:
Admin

Total:
500

Berhasil:
493

Gagal:
7

Status:
Selesai
```

Admin dapat membuka detail batch tersebut.

---

# 19. LAPORAN

Menu:

```text
/laporan
```

Laporan berbeda dengan Monitoring.

Laporan adalah laporan produksi/operasional yang lebih lengkap.

Form:

### INFORMASI

```text
Tanggal
Customer
Dimensi
Batch
No NCR
```

### PRODUKSI

```text
Jenis Pipa
Operator
Nama Operator
Shift
```

### HASIL

```text
Qty OK
Qty NG
Total Qty
Keterangan NG
Keterangan Proses
```

### FOTO

```text
Foto Laporan
```

---

# 20. JENIS PIPA

Jenis pipa menggunakan multi-choice.

Pilihan:

```text
☐ Kotak
☐ Bulat
```

Database jangan menyimpan:

```text
"Kotak,Bulat"
```

Gunakan relasi tabel.

---

# 21. OPERATOR

Jenis operator menggunakan multi-choice:

```text
☐ Borongan
☐ Internal
```

Nama operator berasal dari master operator.

Jika laporan dapat dikerjakan oleh lebih dari satu operator, dukung multiple operator.

Gunakan relational table.

---

# 22. NO NCR

No NCR harus dapat dibuat conditional.

Jika:

```text
Qty NG > 0
```

maka:

```text
No NCR
Keterangan NG
```

dapat diwajibkan sesuai business rule.

Jangan membuat user mengisi field yang tidak relevan.

---

# 23. QTY

Field:

```text
Qty OK
Qty NG
```

harus berupa angka.

Total otomatis:

```text
Total Qty = Qty OK + Qty NG
```

User tidak mengetik Total Qty secara manual.

Validasi:

```text
Qty OK >= 0
Qty NG >= 0
```

---

# 24. FOTO LAPORAN

Foto harus dapat diambil langsung menggunakan kamera HP.

Flow:

```text
Klik "Ambil Foto"
↓
Browser meminta izin kamera
↓
Kamera terbuka
↓
Capture
↓
Preview
↓
[Ambil Ulang]
[Gunakan Foto]
↓
Upload
```

Jika kamera tidak tersedia:

```text
[ Upload dari Galeri ]
```

Sediakan preview foto sebelum submit.

Default:

```text
Minimal 1 foto
Maksimal 5 foto
```

Simpan metadata:

```text
filename
storage_path
mime_type
size
uploaded_at
```

Jangan menyimpan file foto langsung sebagai BLOB PostgreSQL jika object storage tersedia.

Gunakan HTTPS saat production agar kamera browser bekerja dengan baik.

---

# 25. FORM LAPORAN MULTI-STEP

Jangan membuat form terlalu panjang dalam satu halaman.

Gunakan wizard:

```text
01 Informasi
02 Produksi
03 Hasil
04 Foto
05 Review
```

User dapat:

```text
[ Kembali ]
[ Simpan Draft ]
[ Lanjut ]
```

Pada step terakhir:

```text
REVIEW LAPORAN

Tanggal: 17/09/2026
Customer: PT ABC
Dimensi: 100x100
Jenis Pipa: Kotak
Operator: Internal
Qty OK: 100
Qty NG: 3
Foto: 2

[ Kembali ]
[ Kirim Laporan ]
```

---

# 26. STATUS LAPORAN

Gunakan workflow:

```text
DRAFT
↓
SUBMITTED
↓
REVIEW
↓
APPROVED
```

Jika ada masalah:

```text
REVIEW
↓
REVISION
↓
USER MEMPERBAIKI
↓
SUBMITTED
↓
REVIEW
```

Jika ditolak:

```text
REJECTED
```

Setiap perubahan status harus dicatat dalam audit log.

---

# 27. NOMOR LAPORAN

Nomor laporan dibuat server-side.

Format:

```text
RPT-20260917-000001
```

User tidak boleh menentukan nomor laporan sendiri.

---

# 28. HALAMAN DETAIL LAPORAN

Tampilkan:

```text
RPT-20260917-000001

Status:
🟢 Disetujui

Tanggal:
17 September 2026

Customer:
PT ABC

Dimensi:
100 x 100

Jenis Pipa:
Kotak

Operator:
Internal

Nama Operator:
Budi

Shift:
Pagi

Qty OK:
100

Qty NG:
3

Total:
103

Keterangan NG:
...

Keterangan Proses:
...
```

Foto ditampilkan sebagai gallery.

---

# 29. REVIEW SUPERVISOR

Supervisor membuka:

```text
Laporan → Menunggu Review
```

Kemudian:

```text
[ Setujui ]
[ Minta Revisi ]
[ Tolak ]
```

Jika meminta revisi:

Wajib meminta alasan.

Contoh:

```text
Alasan Revisi:
"Foto produk kurang jelas, silakan upload ulang."
```

User menerima notifikasi.

---

# 30. NOTIFIKASI

Buat notification system.

Contoh:

User:

```text
Laporan berhasil dikirim.
```

Supervisor:

```text
Ada 5 laporan menunggu review.
```

User:

```text
Laporan RPT-20260917-000001 membutuhkan revisi.
```

Admin:

```text
Import Excel berhasil.
493 data berhasil diimport.
```

---

# 31. EXPORT EXCEL

Admin/Supervisor dapat export.

Filter:

```text
Tanggal
Shift
Gudang
Customer
Operator
Status
```

Kemudian:

```text
[ Export Excel ]
```

File:

```text
Laporan_Produksi_17-09-2026.xlsx
```

Excel hasil export harus profesional:

* Judul
* Periode
* Filter yang digunakan
* Header
* Auto filter
* Freeze pane
* Column width
* Format tanggal
* Number format
* Summary
* Data detail

---

# 32. EXPORT PDF

Jika diperlukan:

```text
[ Export PDF ]
```

PDF harus berisi:

* Logo perusahaan placeholder
* Nomor laporan
* Informasi laporan
* Hasil produksi
* Foto laporan
* Tanggal
* Status
* Informasi approval

---

# 33. MASTER DATA

Admin memiliki:

## Master Operator

CRUD:

```text
Nama
ID Operator
Jenis
Status
```

## Master Customer

```text
Nama Customer
Kode Customer
Status
```

## Master Shift

```text
Nama Shift
Jam Mulai
Jam Selesai
Status
```

## Master Gudang

```text
Nama Gudang
Kode Gudang
Status
```

Gunakan master data untuk dropdown.

Jangan hardcode data di frontend.

---

# 34. AUDIT LOG

Catat aktivitas penting:

```text
LOGIN
LOGOUT
CREATE
UPDATE
DELETE
IMPORT_EXCEL
EXPORT_EXCEL
SUBMIT_REPORT
APPROVE_REPORT
REQUEST_REVISION
REJECT_REPORT
```

Contoh:

```text
17/09/2026 14:30
Admin Andi
IMPORT_EXCEL
Monitoring_September.xlsx
493 data berhasil
```

---

# 35. DATABASE

Gunakan Prisma.

Minimal model:

```text
User
Role
Operator
Customer
Shift
Warehouse

MonitoringRecord

Report
ReportPipeType
ReportOperatorType
ReportOperator
ReportPhoto

ImportBatch
ImportError

Notification
AuditLog
```

Pastikan relationship benar dan menggunakan foreign key.

Gunakan migration.

---

# 36. KEAMANAN

Implementasikan:

* Password hashing
* Secure session
* Authorization server-side
* Role checking server-side
* Input validation
* File type validation
* File size validation
* Rate limiting pada endpoint sensitif
* CSRF protection jika relevan dengan auth approach
* Jangan expose secret ke client
* Jangan menyimpan credential di source code

File upload hanya boleh:

```text
jpg
jpeg
png
webp
```

Excel:

```text
xlsx
```

Batasi ukuran file.

---

# 37. RESPONSIVE

Aplikasi harus nyaman digunakan:

### Desktop

Sidebar + dashboard lengkap.

### Tablet

Sidebar dapat collapse.

### HP

Bottom navigation / compact sidebar.

Form laporan harus nyaman digunakan dengan satu tangan.

Kamera harus mudah diakses.

Table desktop boleh berubah menjadi card/list pada mobile.

---

# 38. EMPTY STATE

Jangan tampilkan tabel kosong tanpa informasi.

Contoh:

```text
Belum ada laporan

Belum ada laporan yang dibuat pada periode ini.

[ Buat Laporan ]
```

---

# 39. LOADING STATE

Gunakan skeleton/loading.

Jangan membuat halaman blank ketika data sedang diambil.

---

# 40. ERROR HANDLING

Jika API gagal:

```text
Terjadi kesalahan saat mengambil data.

[ Coba Lagi ]
```

Jika upload gagal:

```text
Upload foto gagal.

[ Coba Lagi ]
```

Jika Excel invalid:

Tampilkan error yang jelas per baris.

---

# 41. DASHBOARD DATA FLOW

Gunakan arsitektur:

```text
                  ┌───────────────┐
                  │   USER INPUT  │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   VALIDATION  │
                  └───────┬───────┘
                          │
                          ▼
┌──────────────┐   ┌───────────────┐
│ EXCEL IMPORT │──→│   DATABASE    │
└──────────────┘   └───────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ ANALYTICS API  │
                  └───────┬────────┘
                          │
                          ▼
                  ┌────────────────┐
                  │   DASHBOARD    │
                  └────────────────┘
```

---

# 42. JANGAN GUNAKAN DUMMY DATA PERMANEN

Saat development boleh menggunakan seed data.

Tetapi dashboard production harus:

```text
Database → API → Dashboard
```

Bukan:

```text
const chartData = [...]
```

yang permanen.

Seed hanya digunakan untuk:

* development
* testing
* demo awal

---

# 43. API

Buat endpoint yang terstruktur.

Contoh:

```text
POST /api/auth/login

GET /api/dashboard

GET /api/monitoring
POST /api/monitoring
PUT /api/monitoring/:id

GET /api/reports
POST /api/reports
GET /api/reports/:id
PUT /api/reports/:id

POST /api/reports/:id/submit
POST /api/reports/:id/approve
POST /api/reports/:id/revision
POST /api/reports/:id/reject

POST /api/import/excel
GET /api/import/:id

GET /api/export/reports

GET /api/operators
POST /api/operators

GET /api/customers
POST /api/customers

GET /api/shifts
POST /api/shifts

GET /api/warehouses
POST /api/warehouses

GET /api/notifications

GET /api/audit-logs
```

Authorization harus diterapkan pada setiap endpoint.

---

# 44. EXCEL TEMPLATE LAPORAN

Selain:

```text
Template_Monitoring.xlsx
```

buat juga:

```text
Template_Laporan.xlsx
```

Sheet:

```text
PETUNJUK
DATA
REFERENSI
```

Sheet DATA:

```text
Tanggal
Customer
Dimensi
Jenis Pipa
Batch
No NCR
Jenis Operator
Nama Operator
Shift
Qty OK
Qty NG
Keterangan NG
Keterangan Proses
```

Untuk field multi-choice:

Gunakan format yang jelas dan terdokumentasi.

Contoh:

```text
Jenis Pipa
Kotak;Bulat
```

atau, jika sistem mengharuskan satu pilihan per baris, gunakan struktur import yang konsisten.

Jangan membuat parser Excel yang ambigu.

---

# 45. SHEET REFERENSI EXCEL

Template Excel harus mempunyai sheet:

```text
REFERENSI
```

Contoh:

```text
SHIFT
Pagi
Siang
Malam

JENIS PIPA
Kotak
Bulat

JENIS OPERATOR
Borongan
Internal
```

Jika memungkinkan, gunakan **Excel Data Validation dropdown** sehingga admin/user yang mengisi Excel tidak perlu mengetik manual.

Contoh:

```text
Shift
[ Pagi ▼ ]

Jenis Pipa
[ Kotak ▼ ]

Jenis Operator
[ Internal ▼ ]
```

Ini WAJIB diusahakan pada template.

---

# 46. EXCEL ERROR REPORT

Jika import gagal sebagian:

```text
Import selesai dengan peringatan.

Total:
1000

Berhasil:
987

Gagal:
13
```

Sediakan:

```text
[ Download Excel Error ]
```

Excel error berisi:

```text
Baris
Field
Nilai
Error
Saran Perbaikan
```

Contoh:

```text
23
Shift
Pagi2
Shift tidak ditemukan
Gunakan Pagi / Siang / Malam
```

---

# 47. DUPLICATE DETECTION

Sistem harus mendeteksi kemungkinan data duplikat.

Jika ditemukan:

```text
⚠ 5 data kemungkinan duplikat.
```

Tampilkan pilihan:

```text
[ Lewati ]
[ Update ]
[ Import Tetap ]
```

Jangan menghapus data lama secara otomatis.

---

# 48. BACKUP / DATA SAFETY

Siapkan mekanisme agar data tidak mudah hilang.

Gunakan database production yang memiliki backup.

Jangan menyimpan data utama hanya di browser/localStorage.

localStorage hanya boleh digunakan untuk hal seperti:

* draft sementara
* UI preference

bukan database utama.

---

# 49. DEPLOYMENT

Target:

```text
GitHub
   ↓
Vercel
   ↓
Production
```

Environment variable:

```text
DATABASE_URL
AUTH_SECRET
STORAGE_ENDPOINT
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
STORAGE_BUCKET
```

Jangan commit `.env`.

Sediakan:

```text
.env.example
```

---

# 50. SEED DATA

Buat seed untuk development:

```text
1 Admin
1 Supervisor
3 User

3 Shift

3 Gudang

5 Customer

10 Operator

20 Monitoring Records

20 Reports
```

Gunakan data contoh yang realistis dan berbahasa Indonesia.

---

# 51. TESTING

Minimal test:

## Authentication

* Login valid
* Login invalid
* Logout

## Authorization

* User tidak dapat membuka halaman Admin
* Supervisor tidak dapat mengubah konfigurasi Admin

## Monitoring

* Create
* Read
* Update
* Validation

## Excel

* Excel valid
* Excel invalid
* Missing column
* Invalid shift
* Invalid warehouse
* Duplicate

## Report

* Create draft
* Submit
* Revision
* Approve
* Reject

## Photo

* Upload valid
* File invalid
* File terlalu besar

## Dashboard

* Filter
* Calculation
* Chart data

---

# 52. IMPLEMENTATION ORDER

Bangun dalam urutan:

### Phase 1

Project setup

### Phase 2

Authentication + Role

### Phase 3

Database + Prisma

### Phase 4

Master Data

### Phase 5

Monitoring

### Phase 6

Excel Import

### Phase 7

Dashboard

### Phase 8

Laporan

### Phase 9

Camera + Photo Upload

### Phase 10

Approval + Revision

### Phase 11

Notification

### Phase 12

Export Excel/PDF

### Phase 13

Audit Log

### Phase 14

Testing

### Phase 15

Production deployment

---

# 53. ATURAN PENTING

Jangan:

* Membuat UI saja tanpa backend
* Membuat database dummy yang tidak digunakan
* Hardcode chart
* Hardcode master data
* Menyimpan foto hanya di local filesystem production
* Menggunakan localStorage sebagai database
* Membuat import Excel tanpa validasi
* Membuat template Excel kosong
* Menghilangkan error detail
* Mengizinkan user mengakses data yang bukan haknya
* Membuat semua role memiliki akses yang sama

---

# 54. HASIL AKHIR YANG DIHARAPKAN

Aplikasi harus memungkinkan:

```text
USER
 ↓
Login
 ↓
Input Monitoring
 ↓
Input Laporan
 ↓
Ambil Foto
 ↓
Submit
 ↓
Supervisor Review
 ↓
Approve / Revisi
 ↓
Database
 ↓
Dashboard otomatis berubah
 ↓
Admin dapat Export Excel/PDF
```

Dan untuk admin:

```text
Admin
 ↓
Download Template Excel
 ↓
Isi Excel
 ↓
Upload
 ↓
Validasi
 ↓
Preview
 ↓
Perbaiki jika ada error
 ↓
Confirm Import
 ↓
Database
 ↓
Dashboard otomatis berubah
```

Tujuan utama:

> **MEMBUAT SISTEM YANG MENGURANGI PEKERJAAN INPUT MANUAL ADMIN.**

Admin seharusnya tidak perlu memasukkan ratusan data satu per satu jika data sudah tersedia dalam Excel.

---

# 55. OUTPUT DEVELOPMENT

Saat selesai membangun, berikan:

```text
Source code
README.md
.env.example
Prisma schema
Migration
Seed
Excel Template Monitoring
Excel Template Laporan
API documentation
Testing documentation
Deployment documentation
```

Excel template harus benar-benar dibuat sebagai file `.xlsx`, bukan hanya dijelaskan dalam README.

Pastikan template Excel:

* Profesional
* Ada petunjuk
* Ada contoh
* Ada dropdown
* Ada validasi
* Ada sheet referensi
* Ada formatting
* Siap dipakai admin

---

# 56. DEFINITION OF DONE

Project dianggap selesai jika:

* [ ] Login berfungsi
* [ ] Role berfungsi
* [ ] Dashboard berfungsi
* [ ] Grafik mengambil data database
* [ ] Monitoring berfungsi
* [ ] Import Excel berfungsi
* [ ] Excel validation berfungsi
* [ ] Excel error report berfungsi
* [ ] Template Excel tersedia
* [ ] Laporan berfungsi
* [ ] Foto kamera berfungsi di mobile
* [ ] Foto tersimpan di object storage
* [ ] Approval berfungsi
* [ ] Revision berfungsi
* [ ] Notification berfungsi
* [ ] Export Excel berfungsi
* [ ] Export PDF berfungsi
* [ ] Audit log berfungsi
* [ ] Mobile responsive
* [ ] Security validation
* [ ] Testing
* [ ] GitHub ready
* [ ] Vercel ready
* [ ] `.env.example` tersedia
* [ ] README lengkap

---

# 57. PRIORITAS UTAMA

Jika harus memilih antara tampilan yang sangat kompleks dengan functionality, prioritaskan:

1. Data integrity
2. Authentication
3. Role permission
4. Excel import
5. Monitoring
6. Laporan
7. Dashboard
8. Approval workflow
9. Photo upload
10. Export
11. UI polish

Aplikasi harus **benar-benar usable**, bukan hanya terlihat bagus.

Bangun secara modular, maintainable, scalable, dan mudah dikembangkan oleh developer lain.
