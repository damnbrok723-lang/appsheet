# OfficeHub
## Cara Pemakaian dan Maksud Sistem

**Versi:** 1.0  
**Tanggal:** 17 September 2026

---

## 1. Maksud Sistem

OfficeHub adalah aplikasi internal untuk mengelola pekerjaan, monitoring operasional, laporan produksi, dokumen, kehadiran, dan aktivitas organisasi dalam satu tempat.

Sistem ini memisahkan dua jenis data utama:

1. **Monitoring operasional** untuk mencatat tanggal, shift, jumlah operator, dan gudang.
2. **Laporan produksi** untuk mencatat hasil produksi dan dokumentasi laporan.

Data monitoring dipakai pada grafik Dashboard. Data laporan produksi memiliki alur review dan approval yang terpisah.

---

## 2. Alur Utama

```text
Login
  |
  v
Dashboard
  |
  +--> Monitoring --> Input manual / Import CSV --> Grafik Dashboard
  |
  +--> Laporan Produksi --> Simpan Draft --> Kirim Review --> Approve / Revisi
  |
  +--> Tasks --> Terima --> Kerjakan --> Kirim Review --> Approve / Selesai
  |
  +--> Dokumen --> Upload --> Tautkan ke Task --> Download
  |
  +--> Kehadiran --> Check In --> Check Out
  |
  +--> Audit Log --> Lihat aktivitas sistem
  |
  +--> Logout
```

---

## 3. Login

1. Buka halaman `/login`.
2. Masukkan email dan kata sandi.
3. Tekan **Masuk**.
4. Setelah berhasil, sistem membuka Dashboard.
5. Tekan ikon keluar di header untuk logout.

Akun demo yang dibuat oleh seed:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.local | password123 |
| Manager | manager@example.local | password123 |
| Employee | andi@example.local | password123 |

Ganti password demo sebelum digunakan di lingkungan production.

---

## 4. Dashboard

Dashboard menampilkan ringkasan:

- Total task.
- Jumlah anggota workspace.
- Task yang menunggu review.
- Jumlah event.
- Task terbaru.
- Event mendatang.
- Grafik jumlah operator dari data Monitoring.

Grafik Monitoring memakai data dari input manual dan data hasil import CSV.

---

## 5. Monitoring Operasional

### 5.1 Input Manual

Buka menu **Monitoring**, lalu isi:

| Kolom | Keterangan | Contoh |
|---|---|---|
| Tanggal | Tanggal operasional | 2026-09-17 |
| Shift | Shift kerja | PAGI |
| Jumlah Operator | Angka operator pada shift | 12 |
| Gudang | Nama gudang | Gudang Utama |

Tekan **Simpan monitoring**. Data akan masuk database dan grafik Dashboard akan diperbarui.

### 5.2 Import CSV dari Excel

1. Download `monitoring-template.csv`.
2. Buka file dengan Microsoft Excel.
3. Isi baris data tanpa mengubah nama kolom.
4. Simpan sebagai CSV UTF-8.
5. Buka menu **Monitoring**.
6. Tekan **Import CSV**.
7. Pilih file CSV.

Format kolom wajib:

```text
Tanggal,Shift,Jumlah Operator,Gudang
```

Nilai Shift yang valid:

```text
PAGI
SIANG
MALAM
```

---

## 6. Laporan Produksi

Menu Laporan tidak sama dengan Monitoring. Laporan produksi berisi detail produksi dan dokumentasi.

### 6.1 Kolom Laporan

| Kolom | Aturan |
|---|---|
| Tanggal | Wajib diisi |
| Customer | Wajib diisi |
| Dimensi | Wajib diisi |
| Jenis Pipa | Pilih Kotak dan/atau Bulat |
| Batch | Wajib diisi |
| No NCR | Wajib jika Qty NG lebih dari 0 |
| Operator | Pilih Borongan dan/atau Internal |
| Nama Operator | Wajib diisi |
| Shift | Pagi, Siang, atau Malam |
| Qty OK | Angka nol atau lebih |
| Qty NG | Angka nol atau lebih |
| Keterangan NG | Diisi jika terdapat masalah |
| Keterangan Proses | Catatan proses produksi |
| Foto | Kamera HP atau galeri |

Total Qty dihitung otomatis:

```text
Total Qty = Qty OK + Qty NG
```

### 6.2 Foto Laporan

1. Tekan area foto.
2. Izinkan akses kamera pada browser HP.
3. Ambil foto atau pilih dari galeri.
4. Periksa preview.
5. Tekan **Ambil ulang** jika foto tidak sesuai.
6. Simpan laporan.

Format foto yang diterima: JPG, JPEG, PNG, WEBP. Batas ukuran: 10 MB.

### 6.3 Status Laporan

```text
DRAFT
  |
  v
SUBMITTED
  |
  +--> APPROVED
  |
  +--> REVISION
  |
  +--> REJECTED
```

Employee membuat laporan dan mengirimkannya untuk review. Manager atau Admin dapat menyetujui, meminta revisi, atau menolak laporan.

---

## 7. Task dan Lampiran Dokumen

### 7.1 Membuat Task

1. Buka menu **Tasks**.
2. Tekan **New Task**.
3. Isi judul, deskripsi, prioritas, dan tanggal jatuh tempo.
4. Simpan task.

### 7.2 Menghubungkan Dokumen ke Task

1. Buka detail task.
2. Pada bagian **Lampiran Task**, pilih file.
3. Tekan **Upload ke task**.
4. File disimpan ke Supabase Storage.
5. Metadata lampiran disimpan pada task.
6. Pengguna dapat menekan **Download** untuk mengambil file.

Ukuran file maksimal 25 MB. Gunakan file yang relevan dengan pekerjaan task, seperti instruksi kerja, foto bukti, laporan, atau dokumen pendukung.

---

## 8. Kehadiran

1. Buka menu **Kehadiran**.
2. Tekan **Check In** saat mulai bekerja.
3. Tekan **Check Out** saat selesai bekerja.
4. Riwayat kehadiran tersimpan di database.

---

## 9. Notifikasi

Notifikasi muncul ketika:

- Task ditugaskan.
- Laporan membutuhkan review.
- Laporan dikembalikan untuk revisi.
- Aktivitas penting terjadi pada workspace.

Tekan notifikasi untuk menandainya sudah dibaca. Tombol **Mark all read** menandai seluruh notifikasi sebagai sudah dibaca.

---

## 10. Admin

Admin dapat mengakses:

- Dashboard Admin.
- Pengguna.
- Department.
- Team.
- Monitoring.
- Audit Log.
- Dokumen.
- Laporan.

Audit Log menyimpan aktivitas penting seperti pembuatan data, perubahan status, upload dokumen, download dokumen, dan pencatatan kehadiran.

---

## 11. Export Data

Pada menu Laporan:

- **Export Excel** menghasilkan file CSV UTF-8 yang dapat dibuka di Microsoft Excel.
- **Export PDF** membuka dialog print browser. Pilih printer **Save as PDF**.

Agar hasil PDF tidak rusak:

1. Pilih ukuran kertas A4.
2. Pilih orientasi Portrait atau Landscape sesuai kebutuhan.
3. Aktifkan Background graphics jika warna dibutuhkan.
4. Pastikan margin memakai Default.
5. Simpan sebagai PDF.

Dokumen panduan ini memakai heading pendek, tabel sederhana, dan blok kode agar hasil konversi PDF tetap rapi.

---

## 12. Troubleshooting

### Login gagal

- Pastikan email dan password benar.
- Pastikan `AUTH_SECRET` tersedia.
- Pastikan `DATABASE_URL` dan `DIRECT_URL` valid.
- Pastikan akun berstatus ACTIVE.

### Data tidak muncul

- Periksa koneksi Supabase.
- Jalankan `pnpm prisma db push`.
- Jalankan `pnpm prisma db seed` bila membutuhkan data demo.
- Periksa Network tab browser untuk status API.

### Upload gagal

- Pastikan bucket Storage tersedia.
- Pastikan nama bucket sesuai `SUPABASE_STORAGE_BUCKET`.
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` hanya berada di server/Vercel.
- Pastikan ukuran file tidak lebih dari 25 MB.

---

## 13. Environment Production

Variable wajib di Vercel:

```text
DATABASE_URL
DIRECT_URL
AUTH_SECRET
NEXT_PUBLIC_APP_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
```

Jangan menaruh secret di kode frontend atau repository publik.
