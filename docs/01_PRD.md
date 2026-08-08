# Product Requirements Document (PRD)

# E-Voting OSIS System

Version: 1.0

Status: Draft

---

# 1. Overview

## Background

Pemilihan Ketua OSIS di lingkungan SMA/SMK masih banyak dilakukan menggunakan media kertas. Metode tersebut membutuhkan biaya operasional yang cukup besar, proses penghitungan suara yang memakan waktu, serta berpotensi menimbulkan kesalahan administratif.

Sistem E-Voting OSIS dikembangkan sebagai solusi digital yang mampu menyelenggarakan proses pemilihan secara lebih efisien, cepat, aman, dan ramah lingkungan.

Sistem ini ditujukan untuk penggunaan internal satu sekolah dan hanya berfokus pada proses pemungutan suara Ketua OSIS.

---

# 2. Vision

Menyediakan platform e-voting yang sederhana, aman, cepat, dan menjaga kerahasiaan suara setiap siswa.

---

# 3. Goals

* Mengurangi penggunaan kertas dalam proses pemilihan.
* Memastikan setiap siswa hanya dapat memilih satu kali.
* Menjaga anonimitas pilihan setiap siswa.
* Mempermudah panitia mengelola proses pemilihan.
* Menampilkan hasil secara otomatis setelah pemilihan berakhir.

---

# 4. Scope

## Included

* Portal siswa
* Portal admin
* Login siswa menggunakan NIS/NISN dan Token
* Login admin
* Manajemen kandidat
* Manajemen data siswa
* Import data siswa dari Excel
* Voting
* Validasi satu suara untuk satu siswa
* Dashboard monitoring
* Perhitungan hasil otomatis
* Export hasil

## Excluded (MVP)

* Multi sekolah
* Multi organisasi
* Mobile App
* QR Login
* OTP
* Email Notification
* Real-time campaign
* Blockchain
* Cryptographic Voting

---

# 5. Users

## Student

Hak akses:

* Login
* Melihat kandidat
* Memilih satu kandidat
* Melihat status voting selesai

Tidak dapat:

* Mengubah pilihan
* Melihat hasil sebelum voting ditutup

---

## Administrator

Hak akses:

* Login
* Membuat Election
* Mengatur waktu voting
* CRUD Kandidat
* CRUD Siswa
* Import Excel
* Monitoring partisipasi
* Melihat hasil
* Export hasil

---

# 6. Functional Requirements

## Authentication

### Student Login

Input:

* NIS atau NISN
* Token Voting

Output:

* Berhasil Login
* Token tidak valid
* Sudah menggunakan hak pilih

---

### Admin Login

* Username
* Password

---

## Election Management

Admin dapat:

* Membuat Election
* Mengubah status
* Mengatur waktu mulai
* Mengatur waktu selesai

Status:

* Draft
* Scheduled
* Active
* Closed

---

## Candidate Management

Admin dapat:

* Menambah kandidat
* Mengubah kandidat
* Menghapus kandidat
* Upload foto
* Menulis visi
* Menulis misi

---

## Student Management

Admin dapat:

* Tambah siswa
* Edit siswa
* Hapus siswa
* Import Excel
* Reset Token
* Reset Status Voting (khusus jika diperlukan sebelum pemilihan dimulai)

---

## Voting

Siswa dapat:

* Melihat seluruh kandidat
* Melihat nomor urut
* Melihat foto
* Melihat visi misi
* Memilih satu kandidat
* Konfirmasi pilihan

Setelah konfirmasi:

* Vote tersimpan
* Hak pilih dinyatakan telah digunakan
* Tidak dapat memilih kembali

---

## Dashboard

Admin dapat melihat:

* Total siswa
* Sudah memilih
* Belum memilih
* Persentase partisipasi
* Status Election

Selama Election masih Active:

* Tidak menampilkan hasil suara

---

## Result

Hasil hanya muncul ketika:

Election Status = Closed

---

# 7. Non Functional Requirements

## Performance

* Waktu respon < 2 detik
* Mendukung minimal 500 pengguna aktif secara bersamaan

---

## Security

* HTTPS
* JWT untuk Admin
* Session sementara untuk Student
* Token Voting unik
* Rate Limiting
* Audit Log

---

## Privacy

Prinsip utama sistem:

> Sistem harus mengetahui bahwa seorang siswa telah menggunakan hak pilihnya, tetapi sistem tidak boleh dapat mengetahui kandidat yang dipilih oleh siswa tersebut.

Relasi langsung antara identitas siswa dan data suara tidak boleh disimpan secara permanen.

---

## Availability

Target uptime:

99%

---

## Compatibility

* Chrome
* Edge
* Firefox
* Safari
* Mobile Browser

---

# 8. Success Metrics

* 100% siswa hanya dapat memilih satu kali.
* Tidak ada suara ganda.
* Hasil otomatis setelah voting ditutup.
* Seluruh proses pemilihan selesai tanpa penggunaan kertas.

---

# 9. Future Enhancements

* QR Code Login
* Multi Election
* Multi Organization
* Multi School
* Real-time Monitoring
* Digital Certificate
* Push Notification
* Public Result Portal
