# Grade it

Minimal Next.js + Supabase app where anyone can browse posts and authenticated users can create, rate, and delete their own posts.

## Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (Auth, Postgres, Storage)
- Minimal CSS (no Tailwind)

## Quickstart
1. Install deps: `npm install`
2. Copy environment template: create `.env.local` with:
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
3. Set up Supabase:
   - Create a new project.
   - In SQL editor, run the contents of `supabase.sql` (tables, RLS, storage policies, view).
   - Ensure the `media` storage bucket exists (the script creates/updates it to public read).
4. Dev server: `npm run dev` (http://localhost:3000)
5. Lint: `npm run lint`

## Routes
- `GET /` feed (public)
- `GET /p/[id]` post detail (public)
- `GET /login` sign in / sign up
- `GET /new` create post (auth only)
- `POST /api/posts` create post (auth only)
- `POST /api/rate` rate/update rating (auth only)
- `POST /api/posts/[id]/delete` soft delete own post (auth only, owner)
- `POST /logout` sign out

## Auth
- Supabase email + password.
- Sessions persisted via cookies using `@supabase/ssr` helpers.
- Middleware enforces auth for `/new`, `/api/*`, and `/logout` (redirects or 401).

## Media rules
- Images: only `image/*`, max 5MB.
- Video: only `video/*`, max 20MB, duration <= 10s (client + server enforced).
- Storage path: `{user_id}/{post_id}/{filename}` in the `media` bucket (public read; RLS restricts writes to the owner prefix).

## Database
See `supabase.sql` for:
- Tables: `posts`, `ratings`
- RLS policies (public reads; inserts/updates/deletes require ownership)
- View: `post_rating_stats` (optional aggregate)
- Storage policies for `media` bucket

## Acceptance checklist (self-verify)
- [ ] Anonymous user can open `/` and `/p/[id]` and see media/rating stats.
- [ ] Auth flow: sign up, sign in, sign out.
- [ ] Auth-only actions: `/new` redirects to login when logged out; API routes return 401 when not authed.
- [ ] Create text post; create image post under 5MB; create video <=10s & <=20MB; uploads saved under `{uid}/{postId}/...`.
- [ ] Rating: logged-in user can rate/update once per post; averages/counts update; anonymous users cannot rate.
- [ ] Delete: author can soft delete their post; post disappears from feed/detail.
- [ ] Lint passes: `npm run lint`.

## Notes
- Feed/detail queries use RLS-friendly Supabase client with dynamic rendering (no static caching).
- Deleting a post leaves uploaded media intact (can be cleaned manually if desired).
