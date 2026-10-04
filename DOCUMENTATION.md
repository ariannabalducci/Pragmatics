# Technical Documentation

This document explains how Praggymatics works under the hood: the data model, authentication, how exercises are unlocked, and how therapy sessions affect a child's progress. For setup instructions see the [README](README.md).

## Contents

1. [Architecture](#1-architecture)
2. [Data model](#2-data-model)
3. [Authentication and authorization](#3-authentication-and-authorization)
4. [Exercises and maps](#4-exercises-and-maps)
5. [Training and assessment modes](#5-training-and-assessment-modes)
6. [Therapy sessions and home progress](#6-therapy-sessions-and-home-progress)
7. [Therapist area](#7-therapist-area)
8. [AI integration](#8-ai-integration)
9. [API reference](#9-api-reference)

## 1. Architecture

Praggymatics is a single Next.js application (App Router) written in TypeScript:

- **Pages** (`src/app/**/page.tsx`) are client components. Child pages live at the root (`/path`, `/why`, `/cloze`, …) and therapist pages under `/therapist`.
- **API routes** (`src/app/api/**/route.ts`) implement the backend and talk to PostgreSQL through Prisma.
- **Shared code** lives in `src/lib` (Prisma client, auth helpers, Google Calendar, hooks), `src/utils` (Azure OpenAI client) and `src/components/ui`.
- **Exercise content** is stored as JSON in the database. The story exercises are seeded from `src/lib/exercises/*.json`, the special exercises from `prisma/seed-special-exercises.ts`.

## 2. Data model

The schema is defined in [`prisma/schema.prisma`](prisma/schema.prisma):

| Model | Purpose |
|---|---|
| `User` | Login credentials and role (`CHILD`, `THERAPIST`, `ADMIN`). Also stores the therapist's Google OAuth tokens. |
| `Therapist` / `Child` | Role-specific profiles. Each child belongs to one therapist and has coins, an avatar and clinical notes. |
| `ExerciseGroup` | A node on a map, with a `groupType`: `generic`, `cloze`, `feelings`, `why` or `reactions`. |
| `Exercise` | A single exercise inside a group. Its content is stored in `contentJson`. |
| `Path` | The child's status (`available`, `blocked`, `completed`) for each generic group. |
| `ExerciseAttempt` | One record per completed exercise, with duration, mistakes, the chat transcript and the mode (`training` or `testing`). |
| `Appointment` | A therapy session: start time, duration, type and the exercise groups prescribed for it. |
| `Feedback`, `CollectionItem` | Therapist feedback, and the parrots a child can unlock with coins. |

## 3. Authentication and authorization

- **Password login.** `POST /api/auth/login` checks the bcrypt hash and returns a JWT signed with `JWT_SECRET`, valid for 12 hours. The client stores it in `localStorage` and sends it as `Authorization: Bearer <token>`.
- **Google sign-in (therapists only).** NextAuth handles the OAuth flow and saves the Google tokens. Sign-in is refused if the Google email does not belong to a therapist. The client then calls `GET /api/auth/google-token` to exchange the NextAuth session for the same kind of JWT, so the rest of the app has a single auth model.
- **Checks on every route.** All API routes go through `getAuthUser()` in [`src/lib/auth.ts`](src/lib/auth.ts), which verifies the token. Each route then checks the role. Therapist routes also check, with `isTherapistOf()`, that the patient belongs to the logged-in therapist, so a therapist can only read or change their own patients and appointments.

## 4. Exercises and maps

The child chooses a category from `/select-mode`. Each category has its own map:

| Category | Map | Exercise | How it works |
|---|---|---|---|
| General | `/path` | `/story`, `/chat` | Illustrated stories with a multiple-choice question, followed by an open chat with Praggy about the story. |
| Why | `/path-why` | `/why` | Cause-and-effect questions (“Why do we wash our hands?”) discussed with Praggy, who gives hints instead of answers. |
| Feelings | `/path-feelings` | `/feelings` | A picture of a social situation, analyzed in three guided steps with Praggy. |
| Reactions | `/path-reactions` | `/reactions` | Pick the right reaction (A or B) to a social situation. |
| Cloze | `/path-cloze` | `/cloze` | Complete a short story by dragging words into the blanks. |

**Unlocking.** The general map uses the stored `Path` statuses: completing a group unlocks the next blocked one. The special categories compute their status from the attempt history instead. Groups are ordered by title. A group is `completed` when all of its exercises have an attempt, and `available` when it is the first group not yet completed. All later groups stay `blocked`.

Every completed exercise also earns 20 coins, which the child can spend on the parrot collection.

## 5. Training and assessment modes

From `/select-mode` the child picks one of two modes:

- **Training:** hints, feedback and positive reinforcement.
- **Assessment** (`testing` in the code): a silent run with no feedback, which gives the therapist an unbiased picture.

The mode is kept in `localStorage` (`pragmatics_mode`) and saved on every `ExerciseAttempt`. Map statuses only count attempts made in the current mode, so the two progressions are independent.

## 6. Therapy sessions and home progress

A therapist can schedule an `Appointment` and prescribe specific exercise groups for it. A session is **active** from its start time until start time + duration.

During an active session:

- the child's maps show only the prescribed groups, all unlocked;
- the session type (training or assessment) decides the mode;
- attempts are saved normally but don't advance the home path.

Outside sessions, **home progress ignores attempts made during today's sessions**. As soon as a session ends, the child's maps go back to exactly where their home progress was.

## 7. Therapist area

- **Dashboard:** patient count, today's appointments and the exercise library.
- **Patients:** create child accounts, edit diagnosis, goals and private notes, and reset a child's progress.
- **Patient detail:** upcoming and past sessions with the results of every exercise, the full transcript of each chatbot conversation, and a progress chart (pragmatics vs narrative topics).
- **Calendar:** schedule sessions with prescribed exercises. If the therapist signed in with Google, each new appointment is also added to their Google Calendar (`src/lib/google.ts`).
- **AI assistant:** a chat with an evidence-based clinical assistant for speech therapists.

## 8. AI integration

All chats go through `chatWithAzure()` in [`src/utils/azureHelpers.ts`](src/utils/azureHelpers.ts), which calls an Azure OpenAI deployment (GPT-4o) in JSON mode. Each route has its own system prompt:

| Route | Role of the model | JSON returned |
|---|---|---|
| `/api/chat` | Keeps an open conversation about the current story | `message`, `is_ended` (always `false`) |
| `/api/chat-why` | Evaluates the child's explanation and gives hints | `message`, `is_ended` |
| `/api/chat-feelings` | Checks the answer to the current step | `message`, `step_completed` |
| `/api/chat/therapist` | Clinical assistant for therapists | `message` |

If the Azure credentials are missing, the chat answers with a configuration warning instead of failing.

## 9. API reference

| Method and route | Role | Description |
|---|---|---|
| `POST /api/auth/login` | public | Password login, returns a JWT |
| `GET /api/auth/google-token` | therapist (NextAuth session) | Exchanges a Google session for a JWT |
| `GET /api/student/[userId]` | child (self) | General map, coins and session state |
| `GET, POST /api/student/[userId]/collection` | child (self) | Parrot collection and purchases |
| `GET /api/exercises/by-type/[groupType]` | child | Map of a special category |
| `GET /api/exercise/[exerciseId]` | child | Exercise content, after checking that it is unlocked |
| `POST /api/exercise/[exerciseId]/attempt` | child | Saves an attempt and updates progress |
| `GET /api/appointments/today` | child | Today's active or upcoming session |
| `POST /api/chat`, `/api/chat-why`, `/api/chat-feelings` | logged in | Praggy chats |
| `GET, POST /api/therapist/student` | therapist | List and create patients |
| `GET, PATCH /api/therapist/student/[studentId]` | therapist (owner) | Patient detail and notes |
| `POST /api/therapist/student/[studentId]/feedback` | therapist (owner) | Adds feedback |
| `POST /api/therapist/student/[studentId]/reset-progress` | therapist (owner) | Resets the child's progress |
| `GET, POST /api/appointments`, `DELETE /api/appointments/[id]` | therapist (owner) | Manages appointments |
| `GET /api/exercises` | therapist | Exercise library |
| `POST /api/chat/therapist` | therapist | AI assistant |
