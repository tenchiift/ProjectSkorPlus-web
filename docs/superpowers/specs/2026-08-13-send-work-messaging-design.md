# Send Work + Messaging — Design

Date: 2026-08-13

## Goal

Let students send their work (photo, PDF, or related files) to a lecturer, with a
message, and have a per-submission chat thread between student and lecturer.

## Decisions

- **Role** chosen at registration: `student` or `lecturer`.
- **Submission** = one or more photos and/or a PDF + a text message, addressed to a lecturer.
- **Messaging** = a chat thread tied to each submission (not free-form 1-on-1).
- **Finding a lecturer** = search by username / lecturer list.

## Data Model (Supabase)

### `profiles` — add column
```
role text not null default 'student'  ('student' | 'lecturer')
```

### `submissions`
```
id            uuid pk default gen_random_uuid()
student_id    uuid references profiles(id) on delete cascade
lecturer_id   uuid references profiles(id) on delete cascade
message       text
status        text not null default 'submitted'
created_at    timestamptz default now()
```

### `submission_files`
```
id            uuid pk default gen_random_uuid()
submission_id uuid references submissions(id) on delete cascade
file_url      text not null
file_type     text not null  ('image' | 'pdf')
created_at    timestamptz default now()
```

### `messages`
```
id            uuid pk default gen_random_uuid()
submission_id uuid references submissions(id) on delete cascade
sender_id     uuid references profiles(id) on delete cascade
body          text not null
created_at    timestamptz default now()
```

### Storage
Bucket `submissions` (public). Files stored at `{submissionId}/{filename}`.

## RLS

- `submissions`: student & lecturer can read their own rows; student can insert.
- `submission_files`: readable by the submission's student/lecturer.
- `messages`: readable/writable by the submission's student/lecturer.

## Frontend

- `src/services/submissionService.js`:
  - `searchLecturers(query)`
  - `createSubmission(studentId, lecturerId, message, files)`
  - `getStudentSubmissions(studentId)`
  - `getLecturerSubmissions(lecturerId)`
  - `getSubmission(id)`
  - `getMessages(submissionId)`, `sendMessage(submissionId, senderId, body)`
- Screens: `SubmitWorkScreen`, `MySubmissionsScreen`, `LecturerInboxScreen`,
  `SubmissionThreadScreen`.
- Sidebar/AppLayout: role-aware menu (student: Send Work + My Submissions;
  lecturer: Inbox).

## Routes
`/submit-work`, `/my-submissions`, `/inbox`, `/submission/:id`.

## Verification
`npm run build` passes; manual student → lecturer → chat flow.
