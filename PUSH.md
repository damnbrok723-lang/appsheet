# Push ke GitHub Sekali Jalan

Jalankan PowerShell dari folder project:

```powershell
cd C:\Users\yuman\Downloads\APPSHEET\officehub; git add -A; git commit -m "update documentation"; if ($LASTEXITCODE -eq 0) { git push origin main }
```

Perintah tersebut:

1. Masuk ke folder `officehub`.
2. Menambahkan perubahan ke staging.
3. Membuat commit.
4. Hanya menjalankan push jika commit berhasil.

Jika muncul `nothing to commit`, tidak ada perubahan baru yang perlu di-push.
Jika muncul `rejected`, jalankan ini setelah memastikan perubahan remote aman:

```powershell
git pull --rebase origin main; git push origin main
```

Jangan menjalankan perintah Git dari `C:\Users\yuman\Downloads\APPSHEET`
karena folder tersebut bukan root repository OfficeHub.
