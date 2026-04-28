# Improvement Roadmap

This document captures known gaps and potential enhancements for the Recruitment Quiz System. Items are organized by impact and implementation effort.

---

## 1. Anti-Cheat & Monitoring

**Current state:** Tab switch detection exists client-side but is invisible to reviewers.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Persist tab-switch count server-side | **High** | Small | Add `tabSwitchCount` to `CandidateSession` model; POST count on every visibilitychange event; expose in results dashboard |
| Log key events per session | **Medium** | Medium | Add `SessionEvent` table (eventType, timestamp, metadata) for: tab switches, refresh attempts, copy/paste, full-screen exit |
| Disable copy/paste/right-click in quiz | **Medium** | Small | Add event listeners in `QuizInterface.jsx` for `contextmenu`, `copy`, `cut` |
| Require full-screen mode | **Low** | Small | Request fullscreen on quiz start; warn/flag if exited |

---

## 2. Session Lifecycle & Control

**Current state:** Once a session is `COMPLETED`, it is permanently locked. Admins have no recovery controls.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Admin session reset / retake | **High** | Small | Add `POST /api/quiz-sessions/:id/reset` to clear answers, set status back to `ACTIVE`, reset timer and `currentQuizIndex` |
| Time extension mid-session | **High** | Small | Add `POST /api/quiz-sessions/:id/extend-time` (body: `additionalSeconds`); update `deadlineAt` client-side |
| Force-submit an active session | **Medium** | Small | Admin endpoint to mark a stuck `ACTIVE` session as `COMPLETED` |
| Session cloning / templates | **Medium** | Medium | Add "Duplicate session" button that copies quiz group and time limit to a new session |

---

## 3. Bulk Operations

**Current state:** All operations are single-record. Does not scale past ~50 candidates/sessions.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Bulk candidate import (CSV) | **High** | Medium | Re-use `ImportQuestionsModal` pattern; validate name+phone uniqueness; map department/position by name |
| Bulk session assignment | **High** | Medium | Multi-select candidates in `Candidates.jsx`; assign one session to all selected |
| Bulk grading UI | **Medium** | Medium | Use existing `POST /api/grading/session/:id/batch` endpoint; build inline scoring grid in `ResultDetail.jsx` |
| Bulk export (PDF per candidate) | **Low** | Medium | Generate printable result PDFs using a library like `jsPDF` or `react-pdf` |

---

## 4. Scalability & UX

**Current state:** Every list loads all records. No client-side or server-side pagination.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Server-side pagination + search | **High** | Medium | Add `page`, `limit`, `search` query params to list endpoints (`/candidates`, `/questions`, `/sessions`, `/results`); update tables |
| Results filters (date, score range, status) | **High** | Medium | Filter by completed date range, score min/max, grading status |
| Candidate self-registration link | **Medium** | Medium | Generate a unique URL per department/position; candidate fills name, email, phone; creates pending candidate record |
| Searchable dropdowns | **Medium** | Small | Replace native `<select>` for department/position with a combobox (e.g., Headless UI) |

---

## 5. Access Control & Audit

**Current state:** Single `Admin` role. No record of who changed what.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Role-based access control (RBAC) | **Medium** | Large | Add `role` to `Admin` model (`SUPER_ADMIN`, `ADMIN`, `GRADER`); middleware to restrict routes |
| Audit log | **Medium** | Medium | Add `AuditLog` table (actor, action, entityType, entityId, oldValue, newValue, timestamp); hook into all mutating routes |
| Admin activity view | **Low** | Small | Simple table in admin portal to view recent audit entries |

---

## 6. Notifications

**Current state:** None. Candidates are never notified of assignments.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Email notifications | **Low** | Large | Requires SMTP integration; notify on session assignment, reminder before deadline, results available |
| In-app notification banner | **Low** | Small | Toast on admin portal when new grading is pending |

---

## 7. Question Bank Enhancements

**Current state:** Plain text only. No versioning.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Question versioning / history | **Medium** | Medium | On edit, soft-delete old question and create new one with `previousVersionId`; or add `QuestionRevision` table |
| Rich text / Markdown support | **Medium** | Medium | Use a lightweight editor (e.g., TipTap) for question text; store as Markdown; render in quiz |
| Image/code attachment per question | **Medium** | Medium | Add `attachments` array to `Question` model; upload to `server/uploads/`; serve via static route |
| Question duplication | **Low** | Small | "Clone question" button in question bank |

---

## 8. Analytics & Reporting

**Current state:** Dashboard shows raw counts only.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Score distribution chart | **Low** | Medium | Use a charting library (e.g., Recharts) on dashboard; show histogram of scores per session |
| Candidate performance over time | **Low** | Medium | Line chart of average scores per session over date range |
| Category-level accuracy | **Low** | Small | Bar chart of % correct per question category |
| Grader throughput stats | **Low** | Small | Count of answers graded per admin per week |

---

## 9. Ad-Hoc Quiz Generation

**Current state:** The only workflow is pre-built sessions.

| Improvement | Priority | Effort | Notes |
|---|---|---|---|
| Per-candidate quiz generation | **Medium** | Large | The removed `GenerateQuizModal` was the UI for this. Requires: restoring the modal, adding `candidatesApi.generateQuiz`, and a backend route that creates a session + assigns it on the fly |
| Randomized question pools | **Medium** | Medium | Instead of fixed `SessionQuiz` linking, define a pool rule (category + count) and pick questions at session start |

---

## Quick Wins (implement first)

1. **Persist tab-switch count** — small schema change + one API call + display in results
2. **Admin session reset** — single endpoint + confirmation dialog
3. **Time extension** — single endpoint + input in `CandidateDetail.jsx`
4. **Bulk candidate import** — reuse existing CSV import pattern from questions
5. **Server-side pagination** — add to the three most-used list endpoints first

---

## Deferred / Nice-to-Have

- Full-screen enforcement
- Email notifications
- PDF export
- Rich text editor
- Admin activity view

---

*Last updated: 2026-04-28*
