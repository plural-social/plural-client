# plural-client

The Plural app for Android, iOS and web. Plural is a decentralized,
open-source social network. People post photos and short videos, watch them in
a full-screen feed, follow each other, like and comment.

Built with Expo (SDK 58), React Native and Expo Router. It talks to
[`plural-api`](https://github.com/plural-social/plural-api).

## Contents

- [Quick start](#quick-start)
- [Features](#features)
- [Connecting to the API](#connecting-to-the-api)
- [Running on a phone or emulator](#running-on-a-phone-or-emulator)
- [Project layout](#project-layout)
- [How the app works](#how-the-app-works)
- [Checks](#checks)
- [Before a store release](#before-a-store-release)

## Quick start

1. Start the API. In the `plural-api` folder:

   ```bash
   make run              # the API on :4100
   make run-transcoder   # in a second terminal, so uploaded videos get processed
   make seed             # optional: test users alice, bob and carol, password password123
   ```

2. Start the app in a browser:

   ```bash
   npm install
   npx expo start --web
   ```

3. Open http://localhost:8081 and sign in as `alice` with `password123`, or
   create an account.

## Features

| Area | What users can do |
|---|---|
| Account | Sign up, sign in, stay signed in after a restart, sign out, delete the account |
| Profile | Edit display name, bio and photo. See posts in a grid with follower counts |
| Posting | Pick a photo or video, preview it, add a caption, upload with progress |
| Feed | Swipe through a full-screen feed with Following and Explore tabs. Videos play on their own and loop |
| Social | Like, comment, follow |
| Safety | Report posts, comments and accounts. Block and unblock users |
| Moderation | Moderators and admins review reports, remove content and suspend accounts |

## Connecting to the API

The app finds the API here:

| Where the app runs | API address |
|---|---|
| Web browser, iOS simulator | `http://localhost:4100` |
| Android emulator | `http://10.0.2.2:4100` |
| Physical phone | Set it in `.env` (see below) |

To use a different address, copy `.env.example` to `.env` and set
`EXPO_PUBLIC_API_URL`. Restart Metro after you change `.env`.

The API accepts browser requests only from the origins in its `-cors.origins`
flag. The default is `http://localhost:8081`. If you run the web app on
another port, add that origin to the flag.

### A physical phone on your network

1. Find your computer's address. On macOS: `ipconfig getifaddr en0`.
2. In `.env`, set `EXPO_PUBLIC_API_URL=http://<that address>:4100`.
3. Start the API as usual. No extra flag is needed: file links use the address
   the phone called.
4. Restart Metro. The phone and the computer must be on the same network.

## Running on a phone or emulator

The app uses native modules that are not in Expo Go, so phones and emulators
need a development build. You build it once, then reload code changes as usual.

| Target | You need | Command |
|---|---|---|
| Android emulator or USB phone | Android Studio and JDK 17 | `npm run android` |
| iOS simulator | Xcode and CocoaPods (`brew install cocoapods`) | `npm run ios` |
| iPhone over USB | Xcode and an Apple ID signed in to Xcode | `APP_VARIANT=development npx expo run:ios --device` |

After the first build, start Metro with `npx expo start --dev-client`.

The first build creates the `ios/` and `android/` folders. They are generated
files: git ignores them, and you should not edit them. Change native settings
in `app.json`, `app.config.ts` or a config plugin, then build again.

### Build variants

`app.json` holds the shared settings. `app.config.ts` changes a few of them
based on `APP_VARIANT`:

| Variant | App ID | Network |
|---|---|---|
| `development` | `social.plural.app.dev` | Can use plain HTTP on the local network |
| `preview`, `production` | `social.plural.app` | HTTPS only |

The different app ID lets a development build and a release build sit side by
side on one phone.

### Cloud builds with EAS

EAS builds the app in the cloud, so you do not need Xcode or Android Studio.
You need an Expo account. iOS builds for real devices also need an Apple
Developer account.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

The profiles are in `eas.json`. The `preview` and `production` profiles need
`EXPO_PUBLIC_API_URL` set to an HTTPS API, for example as an EAS environment
variable.

## Project layout

| Path | What it holds |
|---|---|
| `src/app/` | Screens. Each file is a route. `_layout.tsx` files set up navigation |
| `src/app/(auth)/` | Sign-in and sign-up, for signed-out users |
| `src/app/(app)/` | Everything for signed-in users: tabs, posts, profiles, settings, moderation |
| `src/api/` | The HTTP client, API types, and one file of requests per area |
| `src/auth/` | The session and token storage |
| `src/hooks/` | Data hooks (queries and mutations) and screen logic |
| `src/media/` | Preparing and uploading photos and videos |
| `src/components/` | UI, grouped by feature: `post/`, `profile/`, `comments/`, `moderation/`, `ui/` |
| `src/constants/` | Theme colors and the limits shared with the API |
| `app.config.ts`, `eas.json` | Build variants and cloud build profiles |

Code for one platform lives next to the shared file, with the platform in the
name. For example, `token-storage.web.ts` sits next to `token-storage.ts`, and
web uses the `.web` file.

## How the app works

### API client (`src/api/client.ts`)

Every request goes through `apiFetch`. It adds the token, encodes JSON, and
turns every error response into an `ApiError` with the server's `status`,
`type` and `details`. Screens decide what to show from `error.type`, for
example `invalidCredentials`. When the server cannot be reached, the error has
status `0`.

### Session (`src/auth/session-context.tsx`)

`SessionProvider` restores the saved token when the app starts and keeps the
API client in step with it. It has one of four states: `loading`,
`signedOut`, `signedIn` or `error`. The root layout shows the sign-in screens
or the app based on that state.

The token is saved in the device's secure storage on phones, and in
`localStorage` on web. When the server rejects the token, the app signs out on
its own. A wrong password, for example when deleting the account, does not
sign you out.

### Server data (TanStack Query)

All data from the server goes through TanStack Query. Query keys are in
`src/api/query-keys.ts`. Lists load one page at a time as you scroll
(`src/hooks/use-post-queries.ts`).

One post can appear in a feed, a profile grid and its own screen at the same
time. `src/api/post-cache.ts` updates every copy at once, so a like shows
everywhere without reloading.

Likes and follows update the screen before the server answers. If the request
fails, the change is undone (`src/hooks/use-post-mutations.ts`).

### Feed (`src/components/post/feed-pager.tsx`)

The feed is a list where each post fills the screen. The Home tab keeps the
Following and Explore feeds both loaded and hides the inactive one, so
switching tabs keeps your place.

On web, one turn of the mouse wheel or one trackpad swipe moves exactly one
post (`src/hooks/use-wheel-paging.web.ts`).

### Video playback (`src/components/post/video-post.tsx`)

- Only the post on screen and the two next to it have a video player. The
  others show a still image. This keeps memory low on Android and loads the
  next video before you reach it.
- A video plays only while its post is on screen, the screen is open and the
  app is in front. Scrolling back starts it from the beginning.
- Mute applies to every video (`PlaybackProvider`). It starts muted on web,
  because browsers block videos that start with sound.

### Posting (`src/hooks/use-create-post.ts`, `src/media/`)

- Photos are converted to JPEG and made smaller on the device before upload.
  This also handles iPhone HEIC photos.
- Videos upload as they are. The server converts them. The app first checks the
  length, size and format, so an upload the server would reject never starts.
- After a video posts, it shows "Processing" on your profile. The profile
  checks every few seconds and shows the video when it is ready.

Some web browsers cannot read every video format, for example iPhone HEVC
`.mov` files. Then the app cannot read the length or show a preview, but it
still lets you upload. The server checks the real length.

### Moderation

Report and block options are in the post menu, on each comment, and in the
menu on other people's profiles (`ReportSheet`, `useBlockUser`).

Users with the `moderator` or `admin` role see a "Moderation" button on their
profile. It lists reports, and lets them dismiss a report, remove the content
or suspend the account.

The app has no screen to lift a suspension. Admins call the API:

```bash
curl -X POST "$API/admin/accounts/<account uuid>/unsuspend" -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Checks

Run these before every commit. All must pass with no errors or warnings.

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

Install packages with `npx expo install <package>`, not `npm install`. It
picks versions that work with this Expo SDK.

## Before a store release

Already done, as both app stores require for apps with user content:

- Users can report posts, comments and accounts, and block users.
- Sign-up asks users to agree to the terms when the API has a terms URL
  (`-instance.terms.url`).
- Users can delete their account from Edit profile.

Still to do:

- Replace the placeholder icons and splash screen with Plural branding.
- Choose the final app ID. It is `social.plural.app` for now.
- Deploy the API over HTTPS.
- Create Apple Developer and Google Play accounts.
