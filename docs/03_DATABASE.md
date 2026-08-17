# Database Design

# E-Voting OSIS System

Version: 1.0

---

# 1. Overview

Dokumen ini menjelaskan struktur database, relasi antar entitas, aturan bisnis, serta prinsip penyimpanan data pada Sistem E-Voting OSIS.

Database dirancang dengan tiga tujuan utama:

* Menjaga integritas data.
* Menjamin setiap siswa hanya dapat memilih satu kali.
* Menjaga anonimitas suara sehingga tidak ada relasi permanen antara identitas siswa dan pilihan kandidat.

Database menggunakan PostgreSQL dengan Prisma ORM.

---

# 2. Database Principles

Seluruh desain database mengikuti prinsip berikut:

* One Student, One Vote.
* Privacy by Design.
* Anonymous Ballot.
* Data Integrity.
* Auditability.
* Simplicity.

---

# 3. Business Rules

## Election

* Sistem dapat memiliki banyak Election.
* Beberapa Election boleh berstatus Active bersamaan (mis. OSIS + MPK).
* Election berstatus Closed tidak dapat diubah kembali menjadi Active.
* Hasil suara hanya dapat diakses ketika Election berstatus Closed.

---

## Student

* Setiap siswa dapat terdaftar pada beberapa Election (satu baris Student per Election).
* NIS harus unik dalam satu Election.
* NISN harus unik dalam satu Election apabila digunakan.
* Setiap siswa memiliki satu Token Voting aktif untuk setiap Election.
* Status hak pilih hanya berlaku pada Election yang sedang berlangsung.

---

## Candidate

* Kandidat hanya dapat mengikuti satu Election.
* Nomor urut harus unik dalam satu Election.
* Foto kandidat bersifat opsional namun disarankan.

---

## Voting

* Satu siswa hanya boleh memberikan satu suara pada setiap Election.
* Satu suara hanya boleh diberikan kepada satu kandidat.
* Data suara tidak boleh memiliki relasi langsung dengan identitas siswa.
* Voting hanya dapat dilakukan ketika Election berstatus Active.

---

## Token

* Token bersifat unik (global).
* Token hanya berlaku untuk satu Election.
* Token hanya dapat digunakan satu kali.
* Token memiliki masa berlaku (`expires_at`); default 24 jam (`TOKEN_EXPIRY_HOURS`).
* Token dapat direset sebelum Election dimulai.

---

# 4. Entity Relationship

Entity utama:

```text id="x2l4uv"
Election

│

├── Candidate

├── Student

├── VotingToken

└── Vote
```

Audit Log berdiri sendiri.

Settings berdiri sendiri.

Admin berdiri sendiri.

---

# 5. Tables

## Election

Menyimpan informasi pemilihan.

Field:

* id
* title
* description
* academic_year
* status
* start_at
* end_at
* results_public
* created_at
* updated_at

Status:

* Draft
* Scheduled
* Active
* Closed

Catatan:

* `results_public` (Boolean, default false): menentukan apakah hasil election ditampilkan ke publik (halaman `/results`). Hanya dapat diubah oleh admin setelah election Closed.

---

## Student

Menyimpan data siswa.

Field:

* id
* election_id
* nis
* nisn
* full_name
* class_name
* major
* grade
* has_voted
* voted_at
* created_at
* updated_at

Catatan:

Tabel ini **tidak menyimpan informasi kandidat yang dipilih.**

---

## Candidate

Field:

* id
* election_id
* candidate_number
* chairman_name
* vice_chairman_name
* photo_url
* vision
* mission
* show_on_landing
* created_at
* updated_at

Catatan:

* `show_on_landing` (Boolean, default true): menentukan apakah kandidat ditampilkan pada halaman landing publik.

---

## CandidateImage

Menyimpan galeri gambar kandidat (foto program, foto kegiatan, dan lain-lain).

Field:

* id
* candidate_id
* url
* caption
* sort_order
* created_at

Relasi: banyak CandidateImage untuk satu Candidate.

---

## VotingToken

Field:

* id
* election_id
* student_id
* token
* is_used
* expires_at
* created_at

Setelah token digunakan:

* is_used = true

---

## Vote

Field:

* id
* election_id
* candidate_id
* created_at

Tidak terdapat:

* student_id
* nis
* nisn

Tujuan utama:

Tidak ada hubungan permanen antara identitas siswa dan suara.

---

## AuditLog

Field:

* id
* actor_type
* actor_id
* action
* entity
* ip_address
* user_agent
* created_at

Audit Log tidak pernah menyimpan pilihan kandidat siswa.

---

## Settings

Field:

* school_name
* school_logo
* principal_name
* current_academic_year
* updated_at

---

## Admin

Menyimpan akun administrator.

Field:

* id
* username
* password_hash
* full_name
* created_at
* updated_at

Constraint: username harus unik.

---

# 6. Database Relationships

Election

1

↓

Many Candidate

---

Election

1

↓

Many Student

---

Election

1

↓

Many VotingToken

---

Election

1

↓

Many Vote

---

Candidate

1

↓

Many Vote

---

Candidate

1

↓

Many CandidateImage

---

Student

1

↓

One VotingToken

---

Student

Tidak memiliki relasi ke Vote.

---

# 7. Anonymous Voting Design

Sistem memisahkan proses validasi hak pilih dan penyimpanan suara.

Proses:

Student Login

↓

Voting Session dibuat di Redis

↓

Student memilih kandidat

↓

Vote disimpan

↓

Status Student diubah menjadi has_voted = true

↓

Voting Session dihapus

Database hanya mengetahui:

* siswa telah memilih
* jumlah suara kandidat

Database tidak dapat mengetahui:

* siswa memilih kandidat siapa

---

# 8. Transaction Rules

Seluruh proses voting menggunakan database transaction.

Urutan:

1. Validasi Election.
2. Validasi Token.
3. Validasi Student.
4. Simpan Vote.
5. Update Student.has_voted.
6. Update VotingToken.is_used.
7. Commit.

Apabila salah satu langkah gagal:

Rollback seluruh transaksi.

---

# 9. Index Strategy

Unique Index

Election

* Active Status

Student

* NIS
* NISN

Candidate

* Election + Candidate Number

VotingToken

* Token

---

Normal Index

Vote

* Candidate ID

Student

* Class Name

Student

* Major

Election

* Status

---

# 10. Constraints

Student

* NIS wajib unik per Election (satu siswa dapat mengikuti beberapa Election, NIS sama diperbolehkan di Election berbeda).
* NISN opsional tetapi unik per Election jika diisi.

---

Candidate

Nomor urut tidak boleh sama pada Election yang sama.

---

Vote

Candidate harus berasal dari Election yang sama.

---

VotingToken

Token tidak boleh digunakan dua kali.

---

Admin

Username wajib unik.

---

Election

Hanya satu status Active.

---

# 11. Soft Delete

MVP tidak menggunakan Soft Delete.

Data penting seperti:

* Vote
* Audit Log
* Election

tidak boleh dihapus.

Data Student dan Candidate hanya dapat dihapus sebelum Election dimulai.

---

# 12. Data Retention

Vote

Disimpan permanen.

---

Audit Log

Minimal 5 tahun.

---

Student

Mengikuti kebutuhan sekolah.

---

# 13. Backup Strategy

Backup database dilakukan:

* Harian
* Sebelum Election dimulai
* Setelah Election selesai

Backup menggunakan PostgreSQL Dump.

---

# 14. Future Expansion

Struktur database telah dipersiapkan untuk:

* Multi Election
* Multi Organization
* Multi School
* QR Login
* Public Result Portal
* Digital Certificate

Perubahan tersebut tidak memerlukan redesign database secara besar.

---

# 15. Data Integrity Rules

Sistem harus selalu memenuhi aturan berikut:

* Setiap Student hanya dapat memiliki satu status has_voted pada setiap Election.
* Setiap Token hanya dapat digunakan satu kali.
* Setiap Vote harus berasal dari Candidate yang valid.
* Vote tidak boleh memiliki relasi langsung ke Student.
* Election yang telah Closed tidak boleh menerima Vote baru.
* Penghitungan hasil selalu berasal dari tabel Vote, bukan dari cache.

---

# 16. Database Philosophy

Desain database mengikuti prinsip:

> "Database harus mampu membuktikan bahwa seorang siswa telah menggunakan hak pilihnya, tetapi tidak boleh mampu membuktikan kandidat yang dipilih oleh siswa tersebut."

Prinsip ini menjadi dasar seluruh implementasi database pada Sistem E-Voting OSIS.
