# API Specification

# E-Voting OSIS System

Version: 1.0

---

# 1. API Overview

Seluruh endpoint menggunakan REST API dengan format JSON.

Base URL

```text
/api/v1
```

Semua response menggunakan struktur yang konsisten.

Success Response

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Error Response

```json
{
  "success": false,
  "message": "Voting token is invalid.",
  "errorCode": "INVALID_TOKEN"
}
```

---

# 2. Authentication

## Admin Authentication

Menggunakan:

* JWT Access Token
* HttpOnly Cookie

Endpoint:

POST

```text
/auth/admin/login
```

Body

```json
{
  "username": "admin",
  "password": "password"
}
```

---

POST

```text
/auth/admin/logout
```

---

GET

```text
/auth/admin/profile
```

---

## Student Authentication

Student login menggunakan:

* NIS atau NISN
* Voting Token

Endpoint

POST

```text
/auth/student/login
```

Body

```json
{
  "identifier": "231045",
  "token": "ABCD-1234"
}
```

Catatan: field `identifier` menerima NIS atau NISN.

Response

Temporary Voting Session dibuat di Redis.

---

POST

```text
/auth/student/logout
```

---

GET

```text
/auth/student/session
```

Memvalidasi session siswa.

---

# 3. Election

GET

```text
/elections
```

Daftar seluruh Election.

Public: tidak memerlukan autentikasi (digunakan landing page).

---

GET

```text
/elections/:id
```

Detail Election.

Public: tidak memerlukan autentikasi.

---

POST

```text
/elections
```

Membuat Election.

---

PATCH

```text
/elections/:id
```

Mengubah Election.

Field `status` tidak dapat diubah melalui endpoint ini; perubahan status hanya melalui `/start` dan `/close` (state machine satu arah).

---

POST

```text
/elections/:id/start
```

Mengubah status menjadi Active.

---

POST

```text
/elections/:id/close
```

Menutup Election.

---

# 4. Candidate

GET

```text
/candidates
```

Daftar kandidat.

Query param opsional `electionId` untuk memfilter kandidat per Election.

---

GET

```text
/candidates/:id
```

Detail kandidat.

---

POST

```text
/candidates
```

Menambah kandidat.

---

PATCH

```text
/candidates/:id
```

Mengubah kandidat.

---

DELETE

```text
/candidates/:id
```

Menghapus kandidat.

---

POST

```text
/candidates/:id/photo
```

Upload foto kandidat.

---

# 5. Student

GET

```text
/students
```

Daftar siswa.

Query param opsional `electionId` untuk memfilter siswa per Election.

---

GET

```text
/students/:id
```

Detail siswa.

---

POST

```text
/students
```

Tambah siswa.

---

PATCH

```text
/students/:id
```

Edit siswa.

---

DELETE

```text
/students/:id
```

Hapus siswa.

---

POST

```text
/students/import
```

Import Excel.

---

POST

```text
/students/export
```

Export Excel.

---

# 6. Student Election

GET

```text
/student-elections
```

Daftar partisipasi siswa pada Election.

Catatan: pada implementasi, `:id` pada endpoint di bawah merujuk pada student id (tidak ada tabel StudentElection terpisah; status partisipasi disimpan pada Student.has_voted dan VotingToken.is_used).

---

PATCH

```text
/student-elections/:id/reset
```

Reset status voting.

Hanya dapat dilakukan sebelum Election Active.

---

POST

```text
/student-elections/:id/token/reset
```

Generate Token baru.

Format token: `XXXX-XXXX` (huruf kapital dan angka, tanpa karakter ambigu seperti O/0/I/1/L).

---

# 7. Voting

GET

```text
/voting/candidates
```

Daftar kandidat untuk portal siswa.

---

POST

```text
/voting/submit
```

Body

```json
{
  "candidateId": "uuid"
}
```

Flow

Backend akan:

* Validasi Session
* Validasi Election
* Validasi hak pilih
* Menyimpan Vote
* Menandai StudentElection.has_voted
* Menandai VotingToken.is_used
* Menghapus Session Redis

Catatan: Session Redis dihapus setelah commit transaksi database (Redis tidak dapat bergabung dalam transaksi Postgres).

Response

```json
{
  "success": true,
  "message": "Your vote has been recorded."
}
```

---

GET

```text
/voting/status
```

Mengembalikan status:

* Sudah memilih
* Belum memilih

Tidak mengembalikan kandidat yang dipilih.

---

# 8. Dashboard

GET

```text
/dashboard/summary
```

Response

* Total Student
* Total Vote
* Participation Rate
* Election Status

Query param `electionId` wajib. Hanya untuk admin.

---

GET

```text
/dashboard/classes
```

Progress voting per kelas.

Query param `electionId` wajib. Hanya untuk admin.

---

GET

```text
/dashboard/majors
```

Progress voting per jurusan.

Query param `electionId` wajib. Hanya untuk admin.

---

# 9. Result

GET

```text
/results
```

Hanya tersedia apabila Election Closed.

Query param `electionId` wajib. Hanya untuk admin.

Apabila Election belum Closed: error code `ELECTION_NOT_CLOSED`.

Response

```json
[
  {
    "candidateNumber": 1,
    "votes": 320
  }
]
```

---

GET

```text
/results/export/pdf
```

---

GET

```text
/results/export/excel
```

---

# 10. Settings

GET

```text
/settings
```

---

PATCH

```text
/settings
```

Mengubah konfigurasi sekolah.

---

POST

```text
/settings/logo
```

Upload logo sekolah.

---

# 11. Error Codes

Authentication

* INVALID_CREDENTIALS
* INVALID_TOKEN
* SESSION_EXPIRED
* UNAUTHORIZED

---

Election

* ELECTION_NOT_FOUND
* ELECTION_NOT_ACTIVE
* ELECTION_CLOSED
* MULTIPLE_ACTIVE_ELECTION

---

Voting

* ALREADY_VOTED
* INVALID_CANDIDATE
* VOTING_NOT_ALLOWED

---

Student

* STUDENT_NOT_FOUND
* DUPLICATE_NIS
* DUPLICATE_NISN

---

Candidate

* CANDIDATE_NOT_FOUND
* DUPLICATE_CANDIDATE_NUMBER

---

System

* INTERNAL_SERVER_ERROR
* VALIDATION_ERROR
* RATE_LIMITED
* ELECTION_NOT_CLOSED

---

# 12. Authorization Matrix

| Endpoint       | Student | Admin |
| -------------- | :-----: | :---: |
| Login Student  |    ✓    |       |
| Login Admin    |         |   ✓   |
| Voting         |    ✓    |       |
| Candidate CRUD |         |   ✓   |
| Student CRUD   |         |   ✓   |
| Election CRUD  |         |   ✓   |
| Dashboard      |         |   ✓   |
| Result         |         |   ✓   |
| Settings       |         |   ✓   |

---

# 13. Validation Rules

Voting hanya berhasil apabila:

* Election berstatus Active.
* Session Student valid.
* StudentElection.has_voted = false.
* Token belum pernah digunakan.
* Candidate berasal dari Election yang aktif.

Jika salah satu validasi gagal, request ditolak.

---

# 14. Rate Limiting

Student Login

* 5 request / menit

Voting Submit

* 3 request / menit

Admin Login

* 5 request / menit

Import Excel

* 2 request / menit

---

# 15. API Versioning

Seluruh endpoint menggunakan prefix:

```text
/api/v1
```

Perubahan yang bersifat breaking change akan menggunakan versi baru:

```text
/api/v2
```

tanpa menghapus versi sebelumnya selama masa transisi.

---

# 16. API Design Principles

Seluruh API mengikuti prinsip berikut:

* RESTful Endpoint.
* JSON Only.
* Stateless untuk Admin (JWT).
* Temporary Session untuk Student.
* Consistent Response Structure.
* Validation Before Business Logic.
* Privacy by Design.
* Idempotent untuk operasi yang sesuai.
* Tidak ada endpoint yang dapat mengungkap hubungan antara identitas siswa dan suara yang diberikan.
