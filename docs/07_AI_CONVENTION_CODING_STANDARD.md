# AI Development Convention & Coding Standards

# E-Voting OSIS System

Version: 1.0

Status: Mandatory

---

# 1. Purpose

Dokumen ini mendefinisikan standar pengembangan proyek menggunakan AI Coding Assistant.

Seluruh AI yang digunakan dalam pengembangan proyek wajib mengikuti dokumen ini sebelum membuat, mengubah, atau menghapus kode.

Dokumen ini memiliki prioritas tertinggi dibandingkan seluruh dokumen teknis lainnya.

---

# 2. AI Development Philosophy

AI bukan hanya bertugas menghasilkan kode.

AI bertugas menjaga konsistensi sistem.

Setiap perubahan implementasi harus selalu selaras dengan dokumentasi proyek.

Kode bukan sumber kebenaran.

Dokumentasi adalah sumber kebenaran (Single Source of Truth).

---

# 3. Project Source of Truth

AI wajib menganggap dokumen berikut sebagai acuan utama.

Urutan prioritas:

1. AI Development Convention & Coding Standards
2. PRD
3. System Architecture
4. Database Design
5. API Specification
6. UI/UX Specification
7. Development Roadmap
8. PROGRESS.md

Apabila terdapat konflik antar dokumen, AI harus mengikuti urutan prioritas tersebut.

---

# 4. Mandatory AI Workflow

Sebelum mengimplementasikan fitur baru, AI wajib:

1. Membaca seluruh dokumen proyek.
2. Memahami struktur sistem.
3. Memastikan fitur sesuai PRD.
4. Memastikan arsitektur tidak dilanggar.
5. Memastikan perubahan database sesuai Database Design.
6. Memastikan endpoint sesuai API Specification.
7. Memastikan UI mengikuti UI/UX Specification.

AI tidak boleh langsung menulis kode tanpa memahami konteks proyek.

---

# 5. Documentation First

Prinsip utama:

Dokumentasi terlebih dahulu.

Implementasi setelah dokumentasi.

Apabila perubahan membutuhkan perubahan desain sistem, AI wajib memperbarui dokumentasi terlebih dahulu sebelum mengubah kode.

---

# 6. Documentation Synchronization

Setiap perubahan besar maupun kecil wajib dievaluasi terhadap seluruh dokumentasi.

Jika perubahan memengaruhi salah satu aspek berikut:

* fitur,
* arsitektur,
* database,
* endpoint,
* UI,
* alur bisnis,

maka AI wajib memperbarui dokumen terkait.

Contoh:

Menambah QR Login.

AI harus memperbarui:

* PRD
* System Architecture
* Database
* API
* UI/UX
* Development Roadmap

Implementasi tanpa pembaruan dokumentasi dianggap tidak selesai.

---

# 7. PROGRESS.md

Proyek wajib memiliki file:

PROGRESS.md

File ini digunakan sebagai log perkembangan proyek.

AI wajib memperbarui PROGRESS.md setiap selesai menyelesaikan pekerjaan.

Format minimal:

Tanggal

Milestone

Fitur

Status

Catatan

Contoh:

* Phase 2 selesai
* Student Login selesai
* JWT selesai
* Voting Session selesai

PROGRESS.md harus selalu mencerminkan kondisi proyek yang sebenarnya.

---

# 8. Feature Completion Rules

Suatu fitur dianggap selesai apabila:

* Kode selesai.
* Build berhasil.
* Lint berhasil.
* Dokumentasi diperbarui.
* PROGRESS.md diperbarui.

Jika salah satu belum terpenuhi maka status fitur adalah "In Progress".

---

# 9. Coding Principles

AI wajib menghasilkan kode yang:

* Clean.
* Readable.
* Modular.
* Reusable.
* Testable.
* Type Safe.
* Consistent.

Hindari:

* Hardcoded Value
* Duplicate Logic
* Dead Code
* Magic Number
* Over Engineering

---

# 10. Architecture Rules

AI tidak boleh:

* Mengubah Modular Monolith menjadi Microservices.
* Membuat module baru tanpa alasan yang jelas.
* Menggabungkan domain bisnis yang berbeda.
* Melanggar struktur folder yang telah ditentukan.

---

# 11. Database Rules

AI tidak boleh:

* Mengubah relasi database tanpa memperbarui Database Design.
* Menambahkan tabel tanpa dokumentasi.
* Menambahkan kolom tanpa dokumentasi.
* Menyimpan relasi permanen antara Student dan Vote.

Prinsip utama:

Anonymous Ballot harus tetap terjaga.

---

# 12. API Rules

Setiap endpoint baru wajib:

* Dicatat pada API Specification.
* Menggunakan format response yang konsisten.
* Menggunakan error code yang sesuai.
* Mengikuti versioning.

Tidak boleh membuat endpoint tersembunyi (undocumented endpoint).

---

# 13. UI Rules

Seluruh UI wajib:

* Mengikuti UI Design System.
* Mobile First.
* Responsive.
* Accessible.
* Menggunakan komponen shadcn/ui jika memungkinkan.

Tidak membuat halaman yang bertentangan dengan User Flow.

---

# 14. Security Rules

AI wajib:

* Memvalidasi seluruh input.
* Menggunakan ORM (Prisma).
* Menghindari SQL Injection.
* Menghindari XSS.
* Menghindari CSRF pada portal admin.
* Menggunakan transaksi database untuk proses voting.
* Tidak menyimpan informasi yang dapat menghubungkan siswa dengan suara yang dipilih.

---

# 15. Commit Convention

Setiap perubahan mengikuti Conventional Commits.

Contoh:

feat:

fix:

refactor:

docs:

style:

test:

build:

ci:

chore:

---

# 16. Branch Convention

Gunakan branch terpisah.

Contoh:

feature/student-login

feature/voting

fix/token-validation

refactor/dashboard

docs/database

---

# 17. AI Decision Rules

Apabila AI menemukan kondisi yang belum dijelaskan dalam dokumentasi:

AI harus:

1. Memilih solusi yang paling sederhana.
2. Mengikuti best practice industri.
3. Tidak melanggar arsitektur.
4. Tidak mengurangi keamanan.
5. Tidak mengurangi anonimitas voting.
6. Mencatat asumsi yang dibuat.
7. Menyarankan pembaruan dokumentasi jika diperlukan.

AI tidak boleh membuat asumsi besar secara diam-diam.

---

# 18. Refactoring Rules

Refactoring diperbolehkan apabila:

* Tidak mengubah perilaku sistem.
* Meningkatkan maintainability.
* Meningkatkan readability.
* Meningkatkan performance.

Jika refactoring mengubah desain sistem, dokumentasi wajib diperbarui.

---

# 19. AI Completion Checklist

Sebelum menyatakan pekerjaan selesai, AI wajib memastikan:

* Seluruh kode berhasil dikompilasi.
* Tidak ada TypeScript Error.
* Tidak ada Lint Error.
* Tidak ada import yang tidak digunakan.
* Dokumentasi telah diperbarui.
* PROGRESS.md telah diperbarui.
* Struktur folder tetap konsisten.
* Tidak ada pelanggaran arsitektur.

---

# 20. Definition of Complete

Suatu task dinyatakan selesai apabila:

✓ Implementasi selesai.

✓ Dokumentasi sinkron.

✓ PROGRESS.md diperbarui.

✓ Tidak ada konflik dengan PRD.

✓ Tidak ada konflik dengan Architecture.

✓ Tidak ada konflik dengan Database.

✓ Tidak ada konflik dengan API.

✓ Tidak ada konflik dengan UI/UX.

---

# 21. AI Golden Rules

AI harus selalu mematuhi aturan berikut:

1. Documentation is the Single Source of Truth.
2. Read before you code.
3. Never break the architecture.
4. Never violate the database principles.
5. Never compromise vote anonymity.
6. Keep code simple and maintainable.
7. Every significant change must update the affected documentation.
8. Every completed task must update PROGRESS.md.
9. Prefer consistency over cleverness.
10. When in doubt, ask or document the assumption before implementing.

---

# 22. Project Documentation Structure

```text
docs/
│
├── 00-AI-Development-Convention.md
├── 01-PRD.md
├── 02-System-Architecture.md
├── 03-Database.md
├── 04-API-Specification.md
├── 05-UI-UX-Specification.md
├── 06-Development-Roadmap.md
│
├── PROGRESS.md
├── CHANGELOG.md
└── README.md
```

---

# 23. Final Principle

Seluruh pengembangan proyek mengikuti prinsip berikut:

> "Dokumentasi mendefinisikan sistem, kode mengimplementasikan sistem, dan AI bertanggung jawab menjaga keduanya tetap selaras."

Tidak ada implementasi yang dianggap selesai apabila dokumentasi dan status proyek tidak diperbarui secara konsisten.
