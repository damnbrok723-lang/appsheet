# OfficeHub
## Panduan Pemakaian User dan Admin

**Versi:** 2.0
**Tanggal:** 17 September 2026

Dokumen ini menjelaskan tujuan aplikasi, fitur yang tersedia, cara pemakaian
untuk User dan Admin, batas teknis, serta langkah operasional Supabase dan
Vercel. Gunakan heading dan tabel pada dokumen ini saat mencetak ke PDF agar
hasilnya tetap rapi.

---

## 1. Maksud Sistem

OfficeHub adalah web app internal untuk mengelola pekerjaan, monitoring
operasional, laporan produksi, dokumen, kehadiran, notifikasi, dan audit
aktivitas dalam satu tempat.

Monitoring dan Laporan adalah dua alur berbeda:

- **Monitoring:** data ringkas tanggal, shift, jumlah operator, dan gudang yang
  menjadi sumber grafik Dashboard.
- **Laporan Produksi:** data detail hasil produksi, foto, dan alur review.

---

## 2. Ringkasan Fitur

| Fitur | User | Admin/Manager | Keterangan |
|---|---:|---:|---|
| Login, register, logout | Ya | Ya | Session aman melalui Auth.js |
| Dashboard dan grafik monitoring | Lihat | Lihat | Grafik berasal dari input manual dan CSV |
| Monitoring manual | Tambah dan lihat | Tambah, lihat, import CSV | Kolom: tanggal, shift, operator, gudang |
| Laporan produksi | Buat, draft, kirim | Review, approve, revisi, reject | Foto dapat diambil dari kamera HP |
| Tasks | Lihat, kerjakan, komentar | Buat, assign, review | Status task memiliki alur kerja |
| Lampiran task | Upload dan download | Upload dan download | File disimpan di Supabase Storage |
| Dokumen | Upload dan download sesuai akses | Kelola | Batas file 25 MB |
| Kehadiran | Check in/out | Lihat | Riwayat tersimpan di database |
| Notifikasi | Baca dan tandai terbaca | Baca dan tandai terbaca | Mark all read tersedia |
| Export laporan | CSV/Excel-compatible dan PDF | CSV/Excel-compatible dan PDF | PDF melalui print browser |
| Audit Log | - | Lihat | Hanya Admin |
| Admin Users, Teams, Departments | - | Kelola | Beberapa CRUD lanjutan dapat dikembangkan |

---

## 3. Akses dan Role

### User/Employee

User dapat melihat Dashboard, membuat Monitoring, membuat Laporan Produksi,
mengerjakan task yang ditugaskan, mengunggah lampiran, melakukan kehadiran,
dan membaca notifikasi.

### Manager

Manager memiliki kemampuan User serta dapat meninjau laporan atau task sesuai
hak aksesnya, termasuk approve, meminta revisi, atau menolak.

### Admin

Admin dapat mengelola User, Department, Team, Announcement, melihat Audit Log,
serta melakukan fungsi review dan administrasi lainnya.

---

## 4. Cara Login dan Logout

1. Buka URL aplikasi dan pilih **Login**.
2. Isi email serta kata sandi.
3. Klik **Masuk**.
4. Setelah berhasil, aplikasi membuka **Dashboard**.
5. Gunakan tombol **Logout/Keluar** pada header untuk mengakhiri session.

Akun seed untuk Development:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.local | password123 |
| Manager | manager@example.local | password123 |
| Employee | andi@example.local | password123 |

Ganti atau hapus akun demo sebelum production. Jangan kirim password atau
secret melalui chat, issue, atau repository.

---

## 5. Dashboard dan Monitoring

### 5.1 Dashboard

Dashboard menampilkan ringkasan task, anggota, task yang menunggu review,
event, task terbaru, event mendatang, dan grafik jumlah operator.

Grafik monitoring mengambil data dari:

1. Input manual pada menu Monitoring.
2. Import CSV yang dibuat dari template Excel.

### 5.2 Input Monitoring Manual

1. Buka **Monitoring**.
2. Isi kolom berikut.

| Kolom | Contoh | Aturan |
|---|---|---|
| Tanggal | 2026-09-17 | Wajib |
| Shift | PAGI | PAGI, SIANG, atau MALAM |
| Jumlah Operator | 12 | Angka nol atau lebih |
| Gudang | Gudang Utama | Wajib |

3. Klik **Simpan Monitoring**.
4. Kembali ke Dashboard untuk melihat data pada grafik.

### 5.3 Import CSV dari Excel

1. Klik **Download Template** pada halaman Monitoring.
2. Buka `monitoring-template.csv` dengan Excel.
3. Isi data tanpa mengubah nama kolom.
4. Simpan sebagai **CSV UTF-8**.
5. Klik **Import CSV**, pilih file, dan tunggu hasil validasi.

Header wajib:

```text
Tanggal,Shift,Jumlah Operator,Gudang
```

Versi saat ini menerima CSV yang kompatibel dengan Excel, bukan file `.xlsx`
langsung. Untuk file Excel asli, simpan dahulu sebagai CSV UTF-8.

---

## 6. Laporan Produksi

### 6.1 Membuat Laporan

Menu Laporan terpisah dari Monitoring. Isi:

| Kolom | Aturan |
|---|---|
| Tanggal | Wajib |
| Customer | Wajib |
| Dimensi | Wajib |
| Jenis Pipa | Pilih Kotak, Bulat, atau keduanya |
| Batch | Wajib |
| No NCR | Wajib bila Qty NG lebih dari 0 |
| Operator | Pilih Borongan, Internal, atau keduanya |
| Nama Operator | Wajib |
| Shift | Pagi, Siang, atau Malam |
| Qty OK | Angka nol atau lebih |
| Qty NG | Angka nol atau lebih |
| Keterangan NG | Isi jika ada Qty NG |
| Keterangan Proses | Catatan proses |
| Foto | Kamera HP atau galeri |

Total dihitung otomatis:

```text
Total Qty = Qty OK + Qty NG
```

### 6.2 Foto dari Kamera

1. Tekan area **Foto Laporan** di HP.
2. Izinkan akses kamera.
3. Pilih kamera belakang atau galeri.
4. Ambil foto, periksa preview, lalu simpan laporan.

Format yang diterima: JPG, JPEG, PNG, WEBP. Batas saat ini 10 MB.
Foto saat ini disimpan sebagai Base64 pada database; untuk penggunaan besar
disarankan dipindahkan ke Supabase Storage agar database tidak cepat membesar.

### 6.3 Status Laporan

```text
DRAFT -> SUBMITTED -> APPROVED
                   -> REVISION -> SUBMITTED
                   -> REJECTED
```

User membuat Draft lalu klik **Kirim untuk Review**. Manager/Admin melakukan
review. Jika dikembalikan, User memperbaiki laporan dan mengirim ulang.

---

## 7. Tasks dan Lampiran

### 7.1 Alur Task

```text
ASSIGNED -> ACCEPTED -> IN_PROGRESS -> IN_REVIEW -> COMPLETED
                                        -> REVISION -> IN_REVIEW
                                        -> BLOCKED
```

1. Buka **Tasks**.
2. Buka task yang ditugaskan.
3. Klik **Accept**, lalu **Start**.
4. Tambahkan komentar atau lampiran sebagai bukti kerja.
5. Klik **Submit Review**.
6. Reviewer memilih **Approve**, **Request Revision**, atau **Block**.
7. Setelah disetujui, task menjadi selesai sesuai action yang tersedia.

### 7.2 Upload Dokumen ke Task

1. Buka detail task.
2. Pada **Lampiran Task**, pilih file.
3. Klik **Upload ke Task**.
4. File masuk bucket Supabase Storage dan metadata masuk database.
5. Klik **Download** pada daftar lampiran untuk mengunduhnya.

Batas file dokumen adalah 25 MB per file. Bucket yang dipakai harus sama
dengan nilai `SUPABASE_STORAGE_BUCKET` dan sebaiknya bersifat Private.

---

## 8. Kehadiran, Notifikasi, dan Pengumuman

### Kehadiran

1. Buka **Kehadiran**.
2. Klik **Check In** ketika mulai bekerja.
3. Klik **Check Out** ketika selesai.
4. Riwayat tersimpan di database.

### Notifikasi

Klik ikon lonceng untuk memuat notifikasi. Klik item untuk menandai terbaca
atau gunakan **Mark all read** untuk semuanya.

### Pengumuman

Admin membuat pengumuman dari menu Announcement. User membaca pengumuman
yang ditujukan kepada mereka atau organisasi.

---

## 9. Admin

Admin membuka menu Admin untuk:

- Menambah User.
- Membuat Department.
- Membuat Team.
- Membuat Announcement.
- Melihat Dashboard Admin.
- Melihat Audit Log.
- Meninjau laporan dan task.

Audit Log mencatat aktivitas penting seperti pembuatan data, perubahan status,
upload/download dokumen, kehadiran, dan review laporan.

---

## 10. Export dan PDF

Pada menu Laporan:

- **Export CSV/Excel:** menghasilkan CSV UTF-8 yang dapat dibuka dengan Excel.
- **Export PDF:** membuka dialog print browser.

Untuk PDF panduan ini:

1. Buka file Markdown di VS Code.
2. Buka Markdown Preview.
3. Pilih Print.
4. Pilih ukuran A4 dan margin Default.
5. Pilih Portrait untuk teks biasa atau Landscape untuk tabel lebar.
6. Simpan sebagai PDF.

---

## 11. Supabase dan Vercel

### 11.1 Environment Variable Wajib

Di Vercel, isi untuk environment **Production** (dan Preview/Development jika
dibutuhkan):

```text
DATABASE_URL
DIRECT_URL
AUTH_SECRET
NEXT_PUBLIC_APP_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
```

`DATABASE_URL` memakai transaction pooler port 6543. `DIRECT_URL` dipakai
Prisma untuk schema/migration. `SUPABASE_URL` adalah base URL project tanpa
`/rest/v1/`. Service role key hanya boleh berada di server/Vercel.

### 11.2 Setup Database dan Storage

Dari folder project:

```powershell
pnpm prisma db push
pnpm prisma db seed
```

Buat bucket Storage bernama sama persis dengan `SUPABASE_STORAGE_BUCKET`,
misalnya `documents` atau `appsheet`. Untuk dokumen internal, gunakan Private.

### 11.3 Batas Supabase Free

Kuota dapat berubah; cek halaman Billing/Usage project sebelum production.
Angka umum pada Free plan saat panduan ini dibuat:

| Item | Batas Free |
|---|---:|
| Database | 500 MB |
| File Storage | 1 GB |
| Egress | 5 GB |
| Cached egress | 5 GB |
| Monthly active users | 50.000 |
| API request | Unlimited, tetap dibatasi resource/abuse |
| Project aktif | Maksimal 2 |

Project Free dapat dipause setelah tidak aktif. Free plan tidak menyediakan
backup otomatis seperti Pro. Foto Base64 mempercepat pemakaian database, jadi
pantau Usage dan pindahkan foto ke Storage bila jumlah laporan bertambah.

### 11.4 Batas Aplikasi

- Dokumen: maksimal 25 MB per file.
- Foto laporan: maksimal 10 MB.
- Import monitoring: CSV UTF-8 dengan header template.
- Export: CSV yang kompatibel dengan Excel dan print-to-PDF.
- Pagination dan limit request dipakai agar halaman tidak memuat data besar
  sekaligus; batas tampilan mengikuti halaman dan endpoint masing-masing.

---

## 12. Troubleshooting

### Login kembali ke halaman login

- Pastikan deployment Vercel memakai branch `main` terbaru.
- Pastikan `AUTH_SECRET` tersedia pada Production.
- Pastikan `NEXT_PUBLIC_APP_URL` sama dengan domain Production.
- Hapus cookie domain lalu login ulang.
- Cek Vercel Function Logs, bukan membuka `/api/auth/error` langsung.

### Data tidak muncul

- Cek Supabase project tidak paused.
- Pastikan `DATABASE_URL` dan `DIRECT_URL` valid.
- Jalankan `pnpm prisma db push`.
- Gunakan `pnpm prisma db seed` hanya untuk Development atau data awal.

### Upload gagal

- Pastikan bucket tersedia dan namanya sama persis.
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` benar dan hanya server-side.
- Pastikan ukuran file di bawah batas.
- Periksa Vercel Function Logs.

---

## 13. Checklist Sebelum Dipakai User

- [ ] Deployment Vercel berstatus Ready.
- [ ] Login dan logout berhasil.
- [ ] `AUTH_SECRET` ada pada Production.
- [ ] Database Supabase sudah `db push`.
- [ ] Bucket Storage sudah dibuat.
- [ ] Monitoring manual masuk dan tampil pada grafik.
- [ ] CSV template berhasil di-import.
- [ ] Laporan Draft dapat dikirim dan direview.
- [ ] Dokumen dapat di-upload dan di-download.
- [ ] Admin dapat membuka Audit Log.
- [ ] Password demo sudah diganti/dihapus.
- [ ] Password database dan service key tidak pernah masuk repository.
