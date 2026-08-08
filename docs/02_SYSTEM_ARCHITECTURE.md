# System Architecture

# E-Voting OSIS System

Version: 1.0

---

# 1. Architecture Overview

E-Voting OSIS menggunakan arsitektur **Modular Monolith** yang memisahkan setiap domain bisnis ke dalam module independen di dalam satu aplikasi backend.

Pendekatan ini dipilih karena:

* Mudah dikembangkan.
* Mudah dipelihara.
* Tidak membutuhkan infrastruktur microservices.
* Cocok untuk satu sekolah.
* Lebih sederhana untuk deployment dan debugging.

---

# 2. High Level Architecture

```text
                        Internet
                            │
                     HTTPS (Nginx)
                            │
            ┌───────────────┴───────────────┐
            │                               │
     Next.js Frontend               NestJS Backend
            │                               │
            └───────────────┬───────────────┘
                            │
                     PostgreSQL Database
                            │
                         Redis Cache
```

---

# 3. Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query
* React Hook Form
* Zod

---

## Backend

* NestJS
* TypeScript
* Prisma ORM
* Passport
* JWT
* Class Validator

---

## Database

* PostgreSQL

---

## Cache

Redis digunakan untuk:

* Session sementara siswa
* Rate Limiter
* Temporary Voting Session
* Login Attempt Cache

Redis **tidak digunakan** untuk menyimpan data voting permanen.

---

## Storage

Local Storage (MVP)

Digunakan untuk:

* Foto kandidat

Struktur:

```text
/uploads
    /candidate-photo
```

---

## Reverse Proxy

Nginx

Fungsi:

* HTTPS
* Reverse Proxy
* Compression
* Static Asset
* Security Header

---

# 4. Application Modules

Backend dibagi menjadi beberapa module.

## Auth Module

Bertanggung jawab untuk:

* Login Admin
* Login Student
* Logout
* Token Validation
* Session Validation

---

## Election Module

Mengelola:

* Election
* Status
* Schedule
* Start
* Close

---

## Student Module

Mengelola:

* CRUD Student
* Import Excel
* Token Voting
* Status Voting

---

## Candidate Module

Mengelola:

* CRUD Kandidat
* Foto
* Nomor Urut
* Visi
* Misi

---

## Voting Module

Bertanggung jawab terhadap:

* Validasi hak pilih
* Anonymous Vote
* Vote Submission
* Vote Counting

Module ini merupakan inti dari seluruh sistem.

---

## Dashboard Module

Menampilkan:

* Statistik
* Progress Voting
* Participation Rate

Tidak menghitung suara secara langsung.

---

## Report Module

Menghasilkan:

* PDF
* Excel
* Rekap Voting

---

## Settings Module

Mengelola:

* Konfigurasi aplikasi
* Tahun ajaran
* Nama sekolah
* Logo sekolah

---

# 5. Backend Folder Structure

```text
src/

├── modules/
│   ├── auth/
│   ├── election/
│   ├── student/
│   ├── candidate/
│   ├── voting/
│   ├── dashboard/
│   ├── report/
│   └── settings/
│
├── common/
│
├── prisma/
│
├── config/
│
├── middleware/
│
├── guards/
│
├── interceptors/
│
├── filters/
│
└── main.ts
```

---

# 6. Frontend Structure

```text
app/

(admin)

(student)

(login)

api/

components/

hooks/

lib/

services/

types/

styles/
```

---

# 7. Authentication Flow

## Student

Student memasukkan:

* NIS/NISN
* Voting Token

↓

Backend memvalidasi:

* Student Exists
* Token Valid
* Election Active
* Student Belum Voting

↓

Jika valid:

Backend membuat Temporary Voting Session.

↓

Student diarahkan ke halaman voting.

---

## Admin

Admin Login

↓

JWT

↓

Dashboard

---

# 8. Anonymous Voting Flow

Prinsip utama sistem:

Validasi identitas dan penyimpanan suara dipisahkan.

Alur:

1. Student login.
2. Backend memverifikasi hak pilih.
3. Backend membuat Temporary Voting Session di Redis.
4. Student memilih kandidat.
5. Backend memvalidasi Session.
6. Backend menyimpan suara ke tabel Vote tanpa identitas siswa.
7. Backend menandai Student sebagai "has_voted".
8. Temporary Voting Session dihapus.

Dengan pendekatan ini, hubungan langsung antara siswa dan kandidat tidak pernah disimpan secara permanen.

---

# 9. Voting Transaction Flow

Setiap proses voting wajib menggunakan transaksi database.

Urutan proses:

1. Validasi Session.
2. Validasi Election.
3. Validasi Student belum memilih.
4. Simpan Vote.
5. Update Status Student.
6. Hapus Session.
7. Commit Transaction.

Apabila salah satu langkah gagal, seluruh transaksi dibatalkan.

---

# 10. Election State

```text
Draft
   │
   ▼
Scheduled
   │
   ▼
Active
   │
   ▼
Closed
```

Hanya satu Election yang boleh berstatus **Active** pada satu waktu.

---

# 11. Security Layer

## Authentication

Admin

* JWT
* HttpOnly Cookie

Student

* Temporary Session

---

## Authorization

Role:

* ADMIN
* STUDENT

---

## Rate Limiting

Diterapkan pada:

* Login
* Voting
* Import

---

## CSRF

Diaktifkan pada portal admin.

---

## XSS Protection

Semua input disanitasi sebelum disimpan.

---

## SQL Injection

Dicegah menggunakan Prisma ORM dan parameterized query.

---

## HTTPS

Seluruh komunikasi wajib menggunakan HTTPS.

---

# 12. Error Handling

Response menggunakan format yang konsisten.

```json
{
  "success": false,
  "message": "Voting token is invalid.",
  "errorCode": "INVALID_TOKEN"
}
```

---

# 13. Logging

Sistem mencatat aktivitas berikut:

## Student

* Login berhasil
* Login gagal
* Voting berhasil
* Percobaan voting ulang

## Admin

* Login
* CRUD Kandidat
* CRUD Student
* Import Excel
* Export Result
* Membuka / Menutup Election

Log tidak menyimpan kandidat yang dipilih oleh siswa.

---

# 14. Deployment Architecture

Deployment menggunakan satu VPS.

Komponen:

* Nginx
* Next.js
* NestJS
* PostgreSQL (Docker)
* Redis (Docker)

Arsitektur ini mengikuti pendekatan pemisahan antara aplikasi dan layanan infrastruktur, sehingga frontend dan backend berjalan langsung pada host, sedangkan PostgreSQL dan Redis dijalankan dalam container Docker untuk memudahkan pengelolaan, backup, dan pembaruan.

---

# 15. Scalability

Walaupun dirancang untuk satu sekolah, sistem tetap mempertimbangkan skalabilitas.

Beberapa keputusan yang mendukung pengembangan di masa depan:

* Modul terpisah berdasarkan domain.
* Dukungan banyak Election melalui entitas Election.
* Session sementara disimpan di Redis.
* Database telah dipisahkan antara data identitas dan data suara.
* Mudah dikembangkan menjadi Multi-School apabila diperlukan.

---

# 16. Architecture Principles

Seluruh pengembangan sistem harus mengikuti prinsip berikut:

1. Simplicity First.
2. Security by Default.
3. Privacy by Design.
4. One Student, One Vote.
5. Anonymous Ballot.
6. Modular Architecture.
7. Mobile First.
8. Maintainability Over Complexity.
