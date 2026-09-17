# OfficeHub
## Panduan Pemakaian User dan Admin

**Versi:** 2.1
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

## 2. Ringkasan Fitur dan Menu

| Menu/Fitur | Employee/User | Manager | Admin |
|---|---|---|---|
| Login, register, logout | Login/logout | Login/logout | Login/logout |
| Dashboard | Dashboard operasional dan grafik | Dashboard operasional dan grafik | Dashboard operasional dan grafik |
| Admin Dashboard | Tidak dapat akses | Tidak dapat akses | Statistik organisasi, user, department, team |
| Monitoring | Tambah, lihat, import CSV | Tambah, lihat, import CSV | Tambah, lihat, import CSV |
| Laporan Produksi | Buat, simpan Draft, kirim, kirim ulang setelah Revisi | Buat dan review | Buat dan review |
| Review laporan | Tidak bisa Approve/Revisi/Tolak | Bisa Approve/Revisi/Tolak | Bisa Approve/Revisi/Tolak |
| Tasks | Lihat task yang berhak diakses, komentar, kerjakan | Kelola/review sesuai hak akses | Kelola/review sesuai hak akses |
| Lampiran task | Upload/download | Upload/download | Upload/download |
| Dokumen | Upload/download sesuai permission | Upload/download sesuai permission | Upload/download |
| Kehadiran | Check In/Check Out dan riwayat sendiri | Check In/Check Out dan lihat riwayat | Check In/Check Out dan lihat riwayat |
| Notifikasi | Baca dan tandai terbaca | Baca dan tandai terbaca | Baca dan tandai terbaca |
| Pengumuman | Baca | Baca | Buat, ubah, hapus, dan targetkan |
| Export laporan | CSV/Excel-compatible dan Print PDF | CSV/Excel-compatible dan Print PDF | CSV/Excel-compatible dan Print PDF |
| Audit Log | Tidak berwenang melihat data | Tidak berwenang melihat data | Lihat aktivitas seluruh sistem |

`Audit Log` dapat terlihat pada beberapa tampilan navigasi, tetapi API tetap
menolak Employee dan Manager. Hanya Admin yang dapat membaca datanya.

---

## 3. Akses Per Akun

### 3.1 Employee/User

User dapat:

- Login, logout, dan membuka Dashboard.
- Menginput Monitoring manual.
- Import Monitoring melalui CSV UTF-8.
- Melihat grafik Monitoring.
- Membuat Laporan Produksi berstatus `DRAFT`.
- Mengirim laporan menjadi `SUBMITTED`.
- Mengirim ulang laporan berstatus `REVISION`.
- Melihat status laporan miliknya.
- Melihat dan mengerjakan task yang diberikan.
- Mengubah status task sesuai action yang tersedia.
- Menulis komentar task.
- Upload dan download lampiran task.
- Upload/download dokumen sesuai permission.
- Check In dan Check Out.
- Membaca notifikasi dan pengumuman.
- Export laporan yang dapat dilihat.

User tidak dapat:

- Approve, Revisi, atau Tolak laporan.
- Membaca Audit Log.
- Membuka Admin Dashboard.
- Mengelola User, Department, atau Team.

### 3.2 Manager

Manager memiliki kemampuan User, ditambah:

- Melihat laporan yang perlu direview.
- Mengubah `SUBMITTED` menjadi `APPROVED`, `REVISION`, atau `REJECTED`.
- Review task sesuai hak akses.
- Membantu pengelolaan Team melalui endpoint yang diizinkan.

Manager tidak dapat:

- Mengelola User.
- Membuka Audit Log.
- Membuka Admin Dashboard.

### 3.3 Admin

Admin memiliki seluruh kemampuan Manager, ditambah:

- Membuka Admin Dashboard.
- Melihat statistik total User, Department, Team, Task, dan Attendance.
- Membuat, mengubah, dan menghapus User.
- Membuat Department.
- Membuat, mengubah, dan menghapus Team sesuai data Department.
- Membuat, mengubah, dan menghapus Announcement.
- Melihat Audit Log.
- Review dan mengubah status seluruh laporan yang terlihat.

---

## 4. Matriks CRUD

| Data | Create | Read | Update | Delete | Pemilik Akses |
|---|---|---|---|---|---|
| User | Ya | Ya | Ya | Ya | Admin |
| Department | Ya | Ya | Terbatas sesuai endpoint | Terbatas sesuai endpoint | Admin/endpoint admin |
| Team | Ya | Ya | Ya | Ya | Admin/Manager |
| Announcement | Ya | Ya | Ya | Ya | Admin |
| Monitoring | Ya | Ya | Belum tersedia di UI | Belum tersedia di UI | User, Manager, Admin |
| Production Report | Ya | Ya | Form edit penuh belum tersedia | Belum tersedia di UI | Pemilik laporan dan reviewer |
| Status Report | Submit/Resubmit | Ya | Approve/Revisi/Tolak | Tidak | Pemilik, Manager, Admin |
| Task | Ya sesuai UI | Ya | Status/action | Terbatas | User/Manager/Admin sesuai hak |
| Task Comment | Ya | Ya | Belum tersedia | Belum tersedia | User yang berwenang |
| Task Attachment | Ya | Ya/download | Tidak | Ya melalui endpoint | User yang berwenang |
| Document | Ya | Ya/download | Ada di endpoint | Ada di endpoint | Permission/Admin |
| Attendance | Check In | Ya | Check Out | Tidak | Pemilik; Manager/Admin dapat melihat |
| Notification | Dibuat sistem | Ya | Mark read | Tidak | Pemilik notifikasi |
| Audit Log | Dibuat sistem | Ya | Tidak | Tidak | Admin |

Label “belum tersedia di UI” berarti endpoint/database dapat menyimpan data,
tetapi tombol/form frontend untuk aksi tersebut belum disediakan.

---

## 5. Cara Login dan Logout

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

## 6. Dashboard dan Monitoring

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

## 7. Laporan Produksi

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

## 8. Tasks dan Lampiran

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

## 9. Kehadiran, Notifikasi, dan Pengumuman

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

## 10. Admin

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

## 11. Export dan PDF

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

## 12. Supabase dan Vercel

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

## 13. Troubleshooting

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

## 14. Checklist Sebelum Dipakai User

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
