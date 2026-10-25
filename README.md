# plural-client

The Plural app for Android, iOS and web, built with Expo and Expo Router.
It talks to [`plural-api`](../plural-api).

## Development

```bash
npm install
npx expo start          # press i (iOS), a (Android) or w (web)
```

Start the API first (`cd ../plural-api && make run`). The app finds it at:

| Platform | API URL |
|---|---|
| Web, iOS simulator | `http://localhost:4100` |
| Android emulator | `http://10.0.2.2:4100` |
| Physical device | Set `EXPO_PUBLIC_API_URL=http://<your LAN IP>:4100` in `.env` (see `.env.example`) |

The API only accepts browser requests from origins in its `-cors.origins`
flag (default `http://localhost:8081`). Running web on another port means
adding that origin there.

Checks to run before committing:

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

## Layout

| Path | What |
|---|---|
| `src/app/` | Routes only. Each file is a screen, `_layout.tsx` files are navigators |
| `src/api/` | HTTP client, API types, one file of request functions per domain |
| `src/auth/` | Session state and token storage |
| `src/hooks/` | Data hooks (queries, mutations) and screen logic |
| `src/media/` | Image preparation and upload |
| `src/components/` | UI, grouped by feature (`post/`, `profile/`, `comments/`, `moderation/`, `ui/`) |
| `src/constants/` | Theme and limits shared with the API |

Platform-specific code lives in a sibling file with the Expo suffix, for
example `token-storage.web.ts` next to `token-storage.ts`.

## Building blocks

### API client (`src/api/client.ts`)

Every request goes through `apiFetch`. It adds the bearer token, encodes JSON,
and turns every non-2xx response into an `ApiError` with the server's `status`,
`type` and `details`. Screens branch on `error.type` (for example
`invalidCredentials`) and never parse responses themselves. A network failure
is an `ApiError` with status `0`.

### Session (`src/auth/session-context.tsx`)

`SessionProvider` restores the token on startup, keeps the API client's token
in sync with storage, and exposes one state: `loading`, `signedOut`,
`signedIn` or `error`. The root layout routes on it with `Stack.Protected`,
so signed-out users only reach the `(auth)` screens. Any 401 on a request that
sent a token signs the user out.

### Server data (TanStack Query)

All server reads and writes use TanStack Query. Query keys live in
`src/api/query-keys.ts`. Lists are infinite queries that page with the API's
`nextCursor` (`src/hooks/use-post-queries.ts`).

The same post can be cached in a feed, a profile grid and its detail screen at
once. `src/api/post-cache.ts` updates or removes a post in every cache, so a
like shows everywhere without a refetch. Likes and follows are optimistic:
they change the cache first and roll back if the request fails
(`src/hooks/use-post-mutations.ts`).

### Feed (`src/components/post/feed-pager.tsx`)

A `FlatList` where each item is exactly as tall as the screen, so paging and
`getItemLayout` are exact. The Home tab keeps both feeds mounted and hides the
inactive one, so switching keeps each scroll position. On web, a wheel or
trackpad gesture moves exactly one post (`src/hooks/use-wheel-paging.web.ts`).

### Video playback (`src/components/post/video-post.tsx`)

Only the active post and its two neighbors get a video player; every other
video shows its poster image. This keeps at most three players alive, which
Android needs, and preloads the next video so swiping never shows a black
frame. A video plays only while its post is on screen, the screen is focused
and the app is in the foreground (`useFocusEffect`, `useAppActive`). It
restarts from the beginning when you scroll back. The mute setting is shared
by every video (`PlaybackProvider`) and starts muted on web, where browsers
block autoplay with sound.

Videos are transcoded on the server after upload. Profiles and post pages poll
while a post is `processing`, and refresh the feeds once it turns `ready`.

### Uploads (`src/media/`)

`prepareImage` converts picked photos to JPEG (HEIC included) and scales them
down before upload. Videos upload as they are; the picker checks their length,
size and format first so an upload the server would reject never starts. `uploadMedia` sends the raw bytes to `POST /media`: native
uses `expo-file-system` for progress, web uses `fetch`.

### Moderation

Users block accounts and report posts, comments and accounts from the post
menu, comment rows and profile menu (`ReportSheet`, `useBlockUser`).

Users with the `moderator` or `admin` role see a "Moderation" button on their
Profile tab. It lists reports and lets them dismiss them, remove content, or
suspend accounts.

Lifting a suspension has no screen yet. Admins call the API directly:

```bash
curl -X POST "$API/admin/accounts/<account uuid>/unsuspend" -H "Authorization: Bearer $ADMIN_TOKEN"
```
