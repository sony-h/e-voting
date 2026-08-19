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

Catatan:
* field `identifier` menerima NIS atau NISN.
* Login berbasis token: sistem mencari token (unik global), lalu memverifikasi `identifier` cocok dengan NIS/NISN siswa pemilik token, token belum dipakai, dan belum kedaluwarsa (`expires_at`).
* Token kedaluwarsa setelah 24 jam (`TOKEN_EXPIRY_HOURS` di `.env`). Saat kedaluwarsa, kembalikan `TOKEN_EXPIRED` dan hubungi panitia untuk token baru.
* Satu siswa dapat memiliki token di tiap pemilihan (per-eleksi); suara dibatasi per pemilihan (`has_voted` per baris Student).

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

Field `order` (Int, default 1) menentukan urutan tampilan di halaman landing.

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

Aturan file: format jpeg/png/webp, maksimal 10MB per file, lebar minimal 800px (error `IMAGE_TOO_SMALL`).

---

POST

```text
/candidates/:id/images
```

Upload galeri gambar kandidat (multipart, field `files`, maksimal 5 file).

Aturan file: format jpeg/png/webp, maksimal 10MB per file, lebar minimal 800px (error `IMAGE_TOO_SMALL`).

---

DELETE

```text
/candidate-images/:id
```

Hapus gambar galeri.

Error: `CANDIDATE_IMAGE_NOT_FOUND`.

---

# 4b. Public

GET

```text
/public/candidates?electionId=
```

Daftar kandidat untuk halaman landing publik.

Public: tidak memerlukan autentikasi.

Hanya menampilkan kandidat dengan `show_on_landing = true`.

Tidak menampilkan data suara/hasil.

---

GET

```text
/health
```

Cek status infrastruktur (database dan cache).

Public: tidak memerlukan autentikasi.

Response

```json
{
  "database": "up",
  "cache": "up"
}
```

---

GET

```text
/public/results?electionId=
```

Hasil pemilihan untuk publik.

Public: tidak memerlukan autentikasi.

Hanya tersedia apabila Election Closed **dan** `results_public = true`; jika belum dipublikasikan: error code `RESULTS_NOT_PUBLISHED`.

---

POST

```text
/results/publish
```

Mengatur visibilitas hasil ke publik.

Hanya admin. Body: `{ "electionId": "uuid", "visible": true }`.

Hanya dapat diubah setelah Election Closed.

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
* Validasi Election (current)
* Validasi hak pilih
* Menyimpan Vote
* Menandai StudentElection.has_voted
* Menandai VotingToken.is_used
* Update session: tandai election current sebagai `has_voted: true`
* Jika masih ada election lain yang belum dipilih, session tetap ada; jika tidak, session dihapus

Catatan: Session Redis dihapus hanya jika tidak ada election tersisa. Jika siswa memiliki beberapa election aktif, session tetap hidup sampai semua selesai.

Session Shape

```json
{
  "studentId": "uuid",
  "nis": "231045",
  "elections": [
    {
      "electionId": "uuid",
      "studentId": "uuid",
      "has_voted": false
    }
  ]
}
```

Response

```json
{
  "success": true,
  "message": "Your vote has been recorded.",
  "next": {
    "electionId": "uuid"
  }
}
```

Field `next`:

* Jika ada election lain yang belum dipilih: `{ "electionId": "uuid" }` — client harus mengarahkan siswa ke portal voting election berikutnya.
* Jika semua election sudah dipilih: `null` — voting selesai, client dapat redirect ke halaman sukses.

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

Hanya tersedia apabila Election Closed **dan** `results_public = true`.

Query param `electionId` wajib. Hanya untuk admin.

Apabila Election belum Closed: error code `ELECTION_NOT_CLOSED`.

Apabila hasil belum ditampilkan ke publik: error code `RESULTS_NOT_PUBLISHED` (hasil juga disembunyikan dari admin sampai dipublikasikan).

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
* TOKEN_EXPIRED (token telah kedaluwarsa; buat token baru dari panel admin)
* SESSION_EXPIRED
* UNAUTHORIZED

---

Election

* ELECTION_NOT_FOUND
* ELECTION_NOT_ACTIVE
* ELECTION_CLOSED

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
* CANDIDATE_IMAGE_NOT_FOUND
* IMAGE_TOO_SMALL

---

System

* INTERNAL_SERVER_ERROR
* VALIDATION_ERROR
* RATE_LIMITED
* ELECTION_NOT_CLOSED
* DATABASE_UNAVAILABLE
* CACHE_UNAVAILABLE
* RESULTS_NOT_PUBLISHED

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
