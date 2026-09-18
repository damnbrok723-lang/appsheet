# PANDUAN PENGGUNA APLIKASI
## Daily Repair Monitoring System

**Versi:** 1.0  
**Tanggal:** September 2026  
**Dibuat untuk:** Tim Operasional & Client

---

## DAFTAR ISI

1. Tentang Aplikasi
2. Cara Login
3. Navigasi Utama
4. Dashboard
5. Monitoring Operasional
6. Stok NCR
7. Output Repair
8. Laporan Produksi
9. Alur Data Lengkap
10. Import & Export Excel
11. Hak Akses Per Peran

---

## 1. Tentang Aplikasi

Aplikasi ini adalah sistem monitoring harian proses *repair* pipa berbasis web yang
terhubung langsung dengan data SAP perusahaan. Aplikasi dapat diakses dari browser di
komputer maupun HP tanpa perlu instalasi apapun.

**Tujuan utama aplikasi:**

- Memantau jumlah manpower (operator) per gudang dan per shift setiap harinya
- Mengelola dan memonitor stok Grade C (NCR)
- Mencatat output hasil repair (Qty OK dan Qty NG)
- Membuat laporan produksi yang dapat direview oleh atasan
- Mengimpor data langsung dari file Excel SAP tanpa perlu mengubah format

---

## 2. Cara Login

1. Buka URL aplikasi di browser (Chrome, Edge, atau Firefox direkomendasikan)
2. Masukkan **Username** dan **Password** yang diberikan oleh Admin
3. Klik tombol **Masuk**
4. Aplikasi akan langsung membuka halaman **Dashboard**

Catatan: Jika lupa password, hubungi Admin untuk reset akun.

---

## 3. Navigasi Utama

Sidebar di sebelah kiri layar memiliki 5 menu utama:

| Menu | Fungsi Singkat |
|---|---|
| **Dashboard** | Grafik ringkasan manpower & output harian |
| **Stok NCR** | Data stok Grade C dari SAP |
| **Output Repair** | Hasil repair pipa (OK & NG) |
| **Laporan** | Input & review laporan produksi harian |
| **Monitoring** | Input data operator per shift per gudang |

---

## 4. Dashboard

Dashboard adalah halaman pertama yang muncul setelah login. Halaman ini menampilkan
**grafik ringkasan** yang diperbarui otomatis setiap kali ada data baru diinput.

### 4.1 Isi Dashboard

| Grafik / Kartu | Sumber Data | Keterangan |
|---|---|---|
| Total Manpower Bulan Ini | Menu Monitoring | Akumulasi seluruh operator bulan berjalan |
| Manpower per Gudang | Menu Monitoring | Dipisah: Gudang 1, Gudang 5, Gudang 13 |
| Grafik Harian Manpower | Menu Monitoring | Batang per tanggal, dikelompokkan per gudang |
| Qty OK & Qty NG | Output Repair / Laporan | Total hasil repair |

### 4.2 Cara Membaca Grafik

- Setiap **batang** pada grafik mewakili satu tanggal
- Warna batang membedakan gudang:
  - Biru = Gudang 1
  - Teal/Hijau = Gudang 5
  - Ungu = Gudang 13
- Arahkan kursor ke batang untuk melihat detail (tanggal, gudang, shift, jumlah operator)

---

## 5. Monitoring Operasional

Menu Monitoring digunakan untuk **mencatat jumlah operator** yang bekerja setiap hari,
per gudang, per shift. Data ini menjadi sumber utama grafik di Dashboard.

### 5.1 Input Data Manual

1. Klik menu **Monitoring** di sidebar
2. Scroll ke bawah ke bagian **Input & Kelola Data Monitoring**
3. Isi formulir berikut:

| Kolom | Pilihan / Format | Keterangan |
|---|---|---|
| Tanggal | YYYY-MM-DD (contoh: 2026-09-17) | Wajib diisi |
| Shift | Shift 1 / Shift 2 / Shift 3 / Longshift 1 / Longshift 2 | Pilih salah satu |
| Jumlah Operator | Angka (contoh: 12) | Wajib diisi |
| Gudang | 1, 5, atau 13 | Pilih salah satu |
| Kepala Regu | Nama lengkap | Wajib diisi |

4. Klik **Simpan Data Monitoring**
5. Data langsung muncul di tabel dan grafik Dashboard diperbarui

### 5.2 Import dari File Excel SAP

Jika sudah punya data di Excel (format SAP), tidak perlu input satu per satu:

1. Klik **File SAP Asli** untuk mengunduh file referensi lengkap dengan data nyata
   ATAU klik **Template Kosong** untuk mengunduh template kosong sheet MP repair
2. Buka file di Microsoft Excel
3. Isi data pada sheet **MP repair** dengan kolom: No | Tanggal | Jumlah Operator | Shift | Gudang
4. Simpan file (tetap format .xlsx)
5. Kembali ke aplikasi, klik **Import Excel / CSV**
6. Pilih file yang sudah diisi
7. Data masuk ke database dan grafik Dashboard langsung diperbarui

Catatan: Jika mengimpor file SAP lengkap (6 sheet), aplikasi otomatis mengambil
sheet MP repair saja untuk halaman Monitoring.

### 5.3 Filter Tanggal

Gunakan filter **Dari** dan **Sampai** untuk menyaring data berdasarkan rentang tanggal.

---

## 6. Stok NCR

Menu Stok NCR menampilkan data stok pipa **Grade C** yang bersumber dari sistem SAP.
Data ini mencakup informasi SLOC, customer, material, dimensi pipa, dan jumlah stok.

### 6.1 Melihat Data Stok NCR

| Kolom Utama | Keterangan |
|---|---|
| Customer | Nama pelanggan pemilik stok |
| Material Number | Kode material SAP |
| Dimensi (Diameter, Tebal, Panjang) | Spesifikasi pipa |
| Unrestricted Pcs / Kg | Jumlah stok yang tersedia |
| BATCH | Nomor batch produksi |
| Gudang (SLOC) | Lokasi penyimpanan |
| Grade | Prime / Grade C |

### 6.2 Import Data Stok NCR dari SAP

1. Klik **File SAP Asli** untuk file referensi lengkap
   ATAU klik **Template Kosong** untuk template sheet Stok Grade C
2. Pastikan data ada di sheet bernama **Stok Grade C**
3. Klik **Import Excel**, pilih file
4. Aplikasi otomatis membaca sheet Stok Grade C

---

## 7. Output Repair

Menu Output Repair menampilkan **hasil perbaikan pipa** per tanggal, operator, dan shift.

### 7.1 Kolom Data Output Repair

| Kolom Utama | Keterangan |
|---|---|
| Tanggal | Tanggal produksi/repair |
| Customer | Nama pelanggan |
| No. Batch | Nomor batch pipa |
| Operator | Nama operator yang mengerjakan |
| Shift | Shift kerja |
| Qty OK | Jumlah pipa berhasil direpair |
| Qty NG | Jumlah pipa gagal / reject |

### 7.2 Import dari File SAP

1. Klik **File SAP Asli** untuk file berisi data nyata
   ATAU klik **Template Kosong** untuk template sheet Repair
2. Pastikan data ada di sheet bernama **Repair**
3. Klik **Import Excel**, pilih file
4. Aplikasi otomatis mengambil sheet Repair

### 7.3 Filter & Export

- Filter **Dari / Sampai**: menyaring berdasarkan tanggal
- Filter **Shift**: tampilkan hanya shift tertentu
- **Cari**: ketik nama customer, batch, atau operator
- **Export Excel**: unduh data yang sedang ditampilkan dalam format .xlsx

---

## 8. Laporan Produksi

Menu Laporan digunakan untuk **membuat laporan harian** yang dapat direview atasan.

### 8.1 Membuat Laporan Baru

1. Klik menu **Laporan** di sidebar
2. Klik tombol **+ Input Laporan Baru**
3. Isi formulir:

| Kolom | Keterangan |
|---|---|
| Tanggal | Tanggal produksi |
| Customer | Nama pelanggan |
| Dimensi Pipa | Contoh: 28.6 x 1.5 x 267mm |
| Jenis Pipa | Pilih Kotak atau Bulat |
| No. Batch | Nomor batch pipa |
| No. NCR | Wajib diisi jika Qty NG lebih dari 0 |
| Jenis Operator | Pilih Borongan atau Internal |
| Nama Operator | Nama lengkap operator |
| Shift | Shift 1 / Shift 2 / Shift 3 / Longshift 1 / Longshift 2 |
| Qty OK | Jumlah pipa OK |
| Qty NG | Jumlah pipa NG / reject |
| Keterangan NG | Penjelasan jika ada NG |
| Catatan Proses | Catatan tambahan |
| Foto | Foto hasil kerja dari kamera HP atau galeri |

4. Klik **Simpan sebagai Draft** untuk menyimpan sementara
5. Klik **Kirim untuk Review** jika laporan sudah siap

### 8.2 Alur Status Laporan

```
DRAFT  -->  SUBMITTED  -->  APPROVED (Selesai)
                       -->  REVISION  -->  SUBMITTED (kirim ulang setelah diperbaiki)
                       -->  REJECTED
```

| Status | Artinya | Tindakan |
|---|---|---|
| DRAFT | Baru dibuat, belum dikirim | Kirim untuk review |
| SUBMITTED | Menunggu review atasan | Tunggu keputusan |
| APPROVED | Disetujui | Selesai |
| REVISION | Dikembalikan untuk diperbaiki | Perbaiki lalu kirim ulang |
| REJECTED | Ditolak | Buat laporan baru jika perlu |

### 8.3 Cara Upload Foto

1. Di formulir laporan, klik area **Foto Laporan**
2. Di HP: pilih Kamera untuk foto langsung, atau Galeri untuk foto yang sudah ada
3. Di komputer: klik dan pilih file foto (JPG, PNG, WEBP, maksimal 10 MB)
4. Preview foto muncul sebelum laporan disimpan

---

## 9. Alur Data Lengkap

### 9.1 Diagram Alur

```
SUMBER DATA
====================================================================

FILE SAP (Control Daily Repair by SAP.xlsx)
|
+-- Sheet "MP repair"      -->  MONITORING      -->  DASHBOARD (Grafik Manpower)
|
+-- Sheet "Stok Grade C"   -->  STOK NCR        -->  Tabel & Grafik NCR
|
+-- Sheet "Repair"         -->  OUTPUT REPAIR   -->  Tabel Hasil Repair
|
+-- Sheet "DashBoard Repair" --> (Referensi visual, tidak diimpor ke sistem)


INPUT MANUAL
====================================================================

Form Monitoring  -->  MONITORING  -->  DASHBOARD (Grafik Manpower)

Form Laporan     -->  LAPORAN     -->  OUTPUT REPAIR & STOK NCR
                        |
                        +--> Foto  -->  Tersimpan di database
```

### 9.2 Tabel Ringkasan Alur

| Langkah | Dari | Ke | Caranya |
|---|---|---|---|
| 1 | File SAP / Input Manual | Monitoring | Import Excel atau isi form |
| 2 | Monitoring | Dashboard | Otomatis real-time |
| 3 | File SAP | Stok NCR | Import Excel (sheet Stok Grade C) |
| 4 | File SAP | Output Repair | Import Excel (sheet Repair) |
| 5 | Form Laporan | Database | Simpan lalu Submit lalu Review |
| 6 | Database | File Excel | Klik tombol Export di tiap halaman |

---

## 10. Import & Export Excel

### 10.1 Pilihan Download Template

Setiap halaman menyediakan dua pilihan download:

| Tombol | Isi File | Gunakan Untuk |
|---|---|---|
| Template Kosong | Header kolom saja, data kosong | Isi data baru lalu import |
| File SAP Asli | Data SAP lengkap (semua sheet) | Testing atau referensi format |

### 10.2 Sheet yang Dibaca per Halaman

File SAP lengkap memiliki 6 sheet. Sistem otomatis membaca sheet yang sesuai:

| Halaman | Sheet yang Dibaca Otomatis | Kolom Utama |
|---|---|---|
| Monitoring | MP repair | No, Tanggal, Jumlah Operator, Shift, Gudang |
| Stok NCR | Stok Grade C | SLOC, Customer, Material Number, BATCH |
| Output Repair | Repair | Plant, Order, Post.Date, GR Qty Pcs |

Tidak perlu memisah file SAP. Cukup upload file SAP yang sama di halaman
yang berbeda — sistem otomatis mengambil sheet yang sesuai.

### 10.3 Format Shift yang Diterima saat Import

| Isi di Excel | Dibaca Sebagai |
|---|---|
| 1 atau Shift 1 atau Pagi | Shift 1 |
| 2 atau Shift 2 atau Siang | Shift 2 |
| 3 atau Shift 3 atau Malam | Shift 3 |
| Longshift 1 atau LS1 | Longshift 1 |
| Longshift 2 atau LS2 | Longshift 2 |

### 10.4 Format Gudang yang Diterima saat Import

| Isi di Excel | Dibaca Sebagai |
|---|---|
| 1 atau Gd 1 atau Gd.01 | Gudang 1 |
| 5 atau Gd 5 atau Gd.05 | Gudang 5 |
| 13 atau Gd 13 | Gudang 13 |

---

## 11. Hak Akses Per Peran

| Fitur | Employee | Manager | Admin |
|---|---|---|---|
| Lihat Dashboard | Ya | Ya | Ya |
| Input Monitoring manual | Ya | Ya | Ya |
| Import Excel semua halaman | Ya | Ya | Ya |
| Export Excel semua halaman | Ya | Ya | Ya |
| Buat Laporan (Draft) | Ya | Ya | Ya |
| Kirim Laporan untuk Review | Ya | Ya | Ya |
| Upload Foto Laporan | Ya | Ya | Ya |
| Approve / Revisi / Tolak Laporan | Tidak | Ya | Ya |
| Lihat semua laporan tim | Tidak | Ya | Ya |
| Kelola akun pengguna | Tidak | Tidak | Ya |
| Atur permission per pengguna | Tidak | Tidak | Ya |
| Lihat log aktivitas sistem | Tidak | Tidak | Ya |

---

## Catatan Penting

- Data yang sudah diimport tidak dapat diedit langsung dari aplikasi saat ini.
  Untuk koreksi, hapus lalu import ulang (hubungi Admin jika diperlukan).

- File SAP Control Daily Repair by SAP.xlsx tidak perlu diubah formatnya sebelum
  diimport. Cukup download dan upload langsung ke aplikasi.

- Semua data tersimpan di server dan tidak hilang meski browser ditutup.

- Untuk akses terbaik, gunakan Google Chrome atau Microsoft Edge versi terbaru.

---

## Cara Export Dokumen Ini ke PDF

**Menggunakan VS Code:**

1. Buka file PANDUAN_PENGGUNA.md di VS Code
2. Install ekstensi "Markdown PDF" jika belum ada
3. Klik kanan di editor
4. Pilih "Markdown PDF: Export (pdf)"
5. File PDF tersimpan otomatis di folder yang sama

**Menggunakan Browser (tanpa ekstensi):**

1. Buka file .md di aplikasi seperti Typora, Obsidian, atau GitHub
2. Gunakan Ctrl+P (Print)
3. Pilih "Save as PDF"
4. Atur ukuran kertas: A4, orientasi Portrait
5. Margin: Default atau Normal

---

*Daily Repair Monitoring System - Panduan Pengguna v1.0*
*September 2026*
