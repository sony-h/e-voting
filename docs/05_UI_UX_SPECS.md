# UI / UX Specification

# E-Voting OSIS System

Version: 1.0

---

# 1. Design Philosophy

Seluruh antarmuka dirancang berdasarkan prinsip:

* Simple First
* Mobile First
* Accessibility First
* Fast Interaction
* Minimal Cognitive Load

Tujuan utama adalah memastikan seluruh siswa dapat menggunakan sistem tanpa memerlukan panduan.

---

# 2. Design Style

Visual Style

* Modern Minimal
* Clean Layout
* Spacious White Space
* Rounded Corner
* Soft Shadow
* Neutral Color Palette

Inspirasi:

* Apple
* Material Design 3
* shadcn/ui

---

# 3. Color Palette

Primary

Blue

Digunakan untuk:

* Primary Button
* Active State
* Link

---

Success

Green

Digunakan untuk:

* Vote Success
* Completed
* Active Status

---

Warning

Orange

Digunakan untuk:

* Confirmation
* Pending

---

Danger

Red

Digunakan untuk:

* Delete
* Error
* Validation

---

Neutral

Gray

Digunakan untuk:

* Border
* Background
* Secondary Text

---

# 4. Typography

Heading

Bold

---

Body

Regular

---

Caption

Small

---

Seluruh typography mengikuti skala yang konsisten.

---

# 5. Layout System

Desktop

Maximum Width

1280px

---

Tablet

Responsive

---

Mobile

Priority Layout

Semua halaman harus dapat digunakan sepenuhnya pada layar smartphone tanpa kehilangan fungsi.

---

# 6. Navigation

## Student

Flow

Login

↓

Candidate List

↓

Confirmation

↓

Success

Tidak terdapat sidebar.

Tidak terdapat menu tambahan.

---

## Admin

Sidebar Navigation

Dashboard

Election

Candidates

Students

Import

Results

Settings

Profile

Logout

---

# 7. Sitemap

```text id="s4ayoi"
Landing
│
├── Student Login
│      │
│      ├── Candidate List
│      │       │
│      │       ├── Candidate Detail
│      │       │
│      │       ├── Vote Confirmation
│      │       │
│      │       └── Vote Success
│      │
│      └── Already Voted
│
└── Admin Login
        │
        └── Dashboard
                │
                ├── Election
                ├── Candidates
                ├── Students
                ├── Import
                ├── Results
                ├── Settings
```

---

# 8. Student User Flow

## Login

Input

* NIS / NISN
* Voting Token

↓

Validasi

↓

Masuk

---

## Candidate List

Menampilkan seluruh kandidat.

Setiap kandidat terdiri dari:

* Nomor Urut
* Foto
* Nama Ketua
* Nama Wakil
* Ringkasan Visi
* Tombol Detail
* Tombol Pilih

---

## Candidate Detail

Menampilkan:

* Foto
* Profil Singkat
* Visi
* Misi
* Tombol Pilih

---

## Confirmation

Dialog

"Apakah Anda yakin memilih kandidat ini?"

Button

* Ya
* Kembali

---

## Success

Menampilkan:

* Ikon Berhasil
* Pesan Terima Kasih
* Informasi bahwa hak pilih telah digunakan

Tidak menampilkan kandidat yang dipilih.

---

# 9. Admin User Flow

Login

↓

Dashboard

↓

Kelola Election

↓

Kelola Kandidat

↓

Kelola Siswa

↓

Monitoring

↓

Hasil

↓

Export

---

# 10. Dashboard

Menampilkan ringkasan:

Card

* Total Student
* Sudah Voting
* Belum Voting
* Participation Rate
* Election Status

Progress Bar

Partisipasi Voting

Countdown

Sisa waktu Election

Tidak menampilkan hasil suara selama Election masih Active.

---

# 11. Candidate Management

Table

Kolom

* Nomor
* Foto
* Ketua
* Wakil
* Status
* Action

Action

* Edit
* Delete

Button

Tambah Kandidat

---

# 12. Student Management

Table

Kolom

* NIS
* Nama
* Kelas
* Jurusan
* Token
* Voting Status

Action

* Edit
* Reset Token
* Reset Voting

Import

Excel

Export

Excel

---

# 13. Result Page

Hanya muncul setelah Election Closed.

Menampilkan:

Ranking Kandidat

Jumlah Suara

Persentase

Grafik Batang

Tombol

Export PDF

Export Excel

---

# 14. Empty States

Contoh:

Belum ada kandidat.

Belum ada siswa.

Belum ada Election.

Tidak ditemukan data.

---

# 15. Loading States

Gunakan Skeleton Loading.

Hindari Spinner yang berkepanjangan.

---

# 16. Error States

Contoh:

Token tidak valid.

Election belum dimulai.

Election telah selesai.

Anda sudah menggunakan hak pilih.

Seluruh pesan menggunakan bahasa yang mudah dipahami.

---

# 17. Success States

Vote berhasil.

Import berhasil.

Export berhasil.

Data berhasil diperbarui.

---

# 18. Components

Student

* Candidate Card
* Vote Button
* Confirmation Dialog
* Success Screen

Admin

* Sidebar
* Topbar
* Data Table
* Statistic Card
* Progress Card
* Countdown
* Modal
* Alert Dialog
* Toast
* Pagination
* Search
* Filter

---

# 19. Accessibility

Seluruh komponen harus memenuhi prinsip berikut:

* Navigasi menggunakan keyboard.
* Fokus (focus state) terlihat jelas.
* Kontras warna memenuhi standar WCAG AA.
* Ukuran target sentuh minimal 44 × 44 px pada perangkat mobile.
* Form memiliki label yang jelas.
* Pesan kesalahan dapat dibaca screen reader.

---

# 20. Responsive Behavior

Desktop

Sidebar permanen.

---

Tablet

Sidebar dapat dilipat.

---

Mobile

Sidebar berubah menjadi Drawer.

Student Portal

Semua halaman menggunakan layout satu kolom.

---

# 21. Micro Interaction

Animasi maksimal 200ms.

Button

Hover

Press

Loading

Success Check Animation

Dialog Fade

Toast Slide

Tidak menggunakan animasi berlebihan.

---

# 22. UI Principles

Seluruh antarmuka mengikuti prinsip berikut:

* Satu halaman memiliki satu tujuan utama.
* Informasi penting selalu berada di bagian atas.
* Tombol aksi utama selalu mudah ditemukan.
* Hindari lebih dari satu aksi primer dalam satu layar.
* Gunakan istilah yang familiar bagi siswa dan panitia.
* Jangan pernah menampilkan informasi yang dapat mengungkap pilihan siswa.

---

# 23. Design System

Komponen mengikuti standar:

* shadcn/ui
* Tailwind CSS
* Lucide Icons

Spacing menggunakan skala 4px.

Border Radius konsisten.

Shadow digunakan seperlunya.

---

# 24. UI Success Criteria

Antarmuka dianggap berhasil apabila:

* Siswa dapat menyelesaikan proses voting tanpa bantuan.
* Proses voting dapat diselesaikan dalam kurang dari 2 menit.
* Admin dapat mengelola seluruh Election tanpa pelatihan khusus.
* Seluruh fitur utama dapat digunakan dengan nyaman pada desktop maupun smartphone.
