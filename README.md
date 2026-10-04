# Praggymatics

Praggymatics is a web app that helps children practice **pragmatic language skills**: understanding sarcasm, white lies, emotions and social situations. Children learn through games and conversations with Praggy, an AI-powered parrot. Their speech therapist plans the sessions, prescribes exercises and follows their progress.

The project was developed for the Advanced User Interfaces course at Politecnico di Milano.

## Features

**For children**
- Five exercise categories, each with its own map: illustrated stories, cause-and-effect “why” questions, feelings, social reactions and cloze texts.
- Conversations with Praggy, an AI tutor that gives hints instead of answers.
- Training and assessment modes, each with its own progress.
- Coins to unlock a collection of parrots.

**For therapists**
- Patient management with diagnosis, goals and private notes.
- A calendar to schedule sessions and prescribe exercises, synced with Google Calendar.
- Results of every session, full chatbot transcripts and a progress chart.
- An AI assistant for evidence-based clinical questions.
- Sign-in with username and password or with Google.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL · NextAuth · Azure OpenAI · Google Calendar API · Framer Motion

## Getting started

**Prerequisites:** Node.js 20.9 or later, and Docker (or any PostgreSQL database).

1. Install the dependencies:
   ```bash
   npm install
   ```
2. Start a PostgreSQL database:
   ```bash
   docker run --name praggymatics-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=praggymatics -p 5432:5432 -d postgres
   ```
3. Create the `.env` file from the template and fill in the values (see below):
   ```bash
   cp .env.example .env
   ```
4. Create the database schema and load the demo data:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Start the app on [http://localhost:3000](http://localhost:3000):
   ```bash
   npm run dev
   ```

### Environment variables

| Variable | Needed for | Description |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | everything | PostgreSQL connection strings. The defaults in `.env.example` match the Docker command above. |
| `JWT_SECRET` | everything | Secret used to sign the login tokens. |
| `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` | AI chats | Azure OpenAI deployment used by Praggy and by the therapist assistant. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Google sign-in | Google OAuth client (with the Calendar scope) and NextAuth settings. |
| `SEED_THERAPIST_EMAIL` | optional | Google email given to the demo therapist, so they can sign in with Google. |

The app runs without the Azure and Google variables: the chats show a configuration notice and only password login works.

### Demo accounts

After seeding, every account uses the password `123456`.

| Username | Role |
|---|---|
| `sarah_connor` | Therapist with two patients |
| `mark_smith` | Therapist with no patients |
| `timmy_turner` | Child |
| `sammy_johnson` | Child |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate the route types and run the TypeScript compiler |

## Project structure

```
prisma/              schema, migrations and seed scripts
public/              images for exercises, characters and Praggy
src/app/             child pages, therapist pages (/therapist) and API routes (/api)
src/components/ui/   shared UI components
src/lib/             Prisma client, auth helpers, Google Calendar, hooks and story exercises
src/utils/           Azure OpenAI client
```

[DOCUMENTATION.md](DOCUMENTATION.md) explains how the app works: data model, authentication, exercise unlocking, sessions and the API.

## Team

- [Arianna Balducci](https://github.com/ariannabalducci)
- [Greta Severi](https://github.com/gretaseveri04)

## Acknowledgements

Praggymatics builds on an earlier version of the project by Zhu Zhenyu, [Pedro Rafael Angélico Madureira](https://gitlab.com/up202108866) and [Sofia Vieira Pinto](https://gitlab.com/SofiaViP), which provided the child's story and chat exercises.

On top of it, the current team added:
- the therapist area;
- the four special exercise categories;
- the training and assessment modes;
- therapy sessions with prescribed exercises;
- Google sign-in and Calendar sync;
- the AI features based on Azure OpenAI.
