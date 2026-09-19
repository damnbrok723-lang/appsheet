# SOP: Supabase Idle, Keep-Alive, Backup, dan Ownership

## 1. Tujuan
Dokumen ini berfungsi sebagai catatan operasional agar aplikasi tetap dapat dipakai meskipun menggunakan infra gratis seperti Supabase dan Vercel free tier. Tujuan utamanya adalah:

- mencegah aplikasi masuk kondisi idle yang terlalu lama
- menjelaskan mengapa app bisa terasa lambat setelah tidak dipakai selama beberapa hari
- memastikan data tetap aman dan mudah dipulihkan
- menetapkan siapa yang punya akses ke GitHub, Supabase, dan deployment

---

## 2. Kenapa Supabase bisa “pause” atau “idle”?
Supabase dan platform hosting seperti Vercel pada plan gratis biasanya tidak selalu aktif 24/7 tanpa request. Jika aplikasi tidak menerima traffic dalam beberapa waktu, maka:

- database bisa masuk ke kondisi cold start
- koneksi baru harus dibuat ulang
- saat pertama kali dibuka, login atau loading halaman bisa terasa lebih lambat
- request pertama setelah idle bisa memakan waktu beberapa detik sampai menit

Ini bukan berarti data hilang. Biasanya ini hanya fase wake-up dari server atau database yang sedang idle.

---

## 3. Apa yang sebenarnya terjadi?
Yang umum terjadi adalah:

- aplikasi tidak dipakai 3–7 hari
- server/database masuk ke kondisi tidak aktif
- saat client membuka aplikasi, request pertama memerlukan waktu untuk menghubungkan kembali
- setelah koneksi dibuat, aplikasi kembali normal

Karakteristiknya:

- data tetap ada
- struktur database tetap utuh
- yang terasa adalah delay saat pertama kali akses

---

## 4. Cara supaya tetap “alive” meskipun free tier
Untuk menjaga aplikasi tetap siap dipakai, langkah paling efektif adalah:

### 4.1 Keep-Alive Otomatis
Gunakan scheduler/monitoring untuk selalu mengakses aplikasi secara berkala.

Metode yang umum dipakai:

- GitHub Actions cron
- UptimeRobot
- cron-job.org
- scheduler lain yang bisa memanggil URL aplikasi setiap 5–15 menit

Contoh target:

- https://domain-anda.vercel.app/api/health

Semakin sering ping, semakin kecil kemungkinan aplikasi benar-benar idle untuk waktu lama.

### 4.2 Health Check Endpoint
Aplikasi sudah memiliki endpoint health check di:

- /api/health

Endpoint ini berguna untuk menyalakan atau mengecek apakah service masih aktif. Biasanya endpoint ini hanya mengembalikan status JSON seperti:

```json
{
  "ok": true,
  "status": "alive",
  "timestamp": "2026-09-19T00:00:00.000Z"
}
```

Endpoint ini dipanggil oleh monitoring atau cron untuk menjaga aplikasi tetap “warm”.

---

## 5. Backup manual yang wajib
Karena free tier tidak sepenuhnya menjamin kestabilan jangka panjang, backup tetap wajib dilakukan.

### Frekuensi backup yang disarankan
- untuk demo / uji coba: mingguan
- untuk aplikasi yang mulai dipakai rutin: harian
- untuk data penting / fungsi operasional: setiap hari atau setiap perubahan signifikan

### Cara backup yang umum dipakai
- backup database dari Supabase dashboard
- ekspor data penting ke CSV / SQL / JSON
- simpan file dokumen penting di folder aman atau cloud penyimpanan cadangan
- simpan backup di tempat yang berbeda dari aplikasi utama

---

## 6. Berapa lama free tier aman?
Untuk project dengan traffic kecil, aktifitas ringan, dan data tidak terlalu besar, free tier umumnya masih aman untuk jangka pendek, misalnya:

- 1–3 bulan untuk demo
- 3–6 bulan untuk uji coba internal
- lebih dari itu mulai berisiko kalau aplikasi aktif rutin

Jika aplikasi sudah dipakai setiap hari oleh client atau karyawan, maka free tier mulai kurang cocok. Pada tahap ini lebih aman untuk naik ke plan yang lebih stabil.

---

## 7. Solusi tanpa client pegang GitHub/Supabase
Jika client tidak boleh pegang GitHub maupun Supabase, maka pengaturan yang aman adalah:

- GitHub milik developer / owner project
- Supabase milik developer / owner project
- client hanya diberi akses:
  - login aplikasi
  - halaman utama / dashboard
  - fitur operasional yang dibutuhkan
  - bukan akses ke repo atau database utama

Ini paling aman untuk:

- menjaga data tetap aman
- menjaga kode tetap terkontrol
- menghindari client mengubah konfigurasi tanpa izin
- menjaga stabilitas deployment dan maintenance

Jika client ingin “lihat database”, maka bisa diberikan akses read-only terbatas, bukan akses penuh.

---

## 8. Cara menjelaskan ke client agar tidak panik
Kalimat yang aman dan profesional:

> Aplikasi ini menggunakan layanan free tier untuk efisiensi biaya. Setelah lama tidak aktif, sistem akan melakukan wake-up terlebih dahulu. Ini bukan kehilangan data, melainkan proses pengaktifan kembali server/database. Kami sudah menyiapkan mekanisme keep-alive dan backup untuk meminimalkan risiko.

Kalimat lain yang bisa digunakan:

> Sistem kami menggunakan infra yang hemat biaya dan akan otomatis warm-up saat dibuka kembali setelah idle. Data tetap aman, dan kami tetap melakukan backup rutin.

---

## 9. Rekomendasi final
Untuk project yang sudah memakai client dan data bisnis, yang paling aman adalah:

- tetap miliki akun GitHub dan Supabase sendiri
- client hanya akses aplikasi dan bukan repo/database
- aktifkan keep-alive
- backup rutin
- upgrade plan saat project sudah mulai aktif rutin

---

## 10. Checklist operasional
Sebelum client mulai memakai aplikasi, pastikan checklist ini sudah dilengkapi:

- [ ] Health check endpoint aktif
- [ ] Keep-alive otomatis berjalan
- [ ] Backup database rutin dibuat
- [ ] Domain production sudah siap
- [ ] Env file aman dan tidak dibagikan sembarangan
- [ ] GitHub owner jelas
- [ ] Supabase owner jelas
- [ ] Client tidak punya akses penuh ke repo / database
- [ ] SOP maintenance ditulis dan dipahami developer

---

## 11. Kesimpulan
Supabase free dan Vercel free bisa dipakai untuk proyek kecil atau demo, tapi tidak ideal untuk produksi yang aktif setiap hari. Dengan keep-alive, health check, backup rutin, dan ownership yang jelas, risiko dapat diminimalkan secara signifikan.

Yang paling penting adalah: data aman, app tetap hidup, dan client tidak perlu pegang repo/database secara langsung.
