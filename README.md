# Firebase emulator

## Reference

The relevant commands are available in the `package.json` scripts section. Relevant docs and info can be found in the following links

- https://firebase.google.com/docs/emulator-suite (the docs)
- https://www.youtube.com/watch?v=qbd_4LT0Y4s (data types: part of an excellent series, https://www.youtube.com/playlist?list=PLAJ--8GPzi0T7yOm4WWRqK2l7rzYASmsw)

## Setup

In this project we have removed `.env.local` from .gitignore so git is tracking the `.env.local` file to make it easier to reference. If you are forking this repo you will probably not want to ignore `.env.local`.

In the firebase console set up a new project and add firestore and auth to your project. If you want to use other firebase features these work quite similarly and you can use the docs to help.

Create a new Next app and add the firebase config to the file. From here we have the simple UI in `index.tsx`

## Installation

Review the relevant scripts in `package.json`

- `firebase init` - This is cli wizard that allows you to select the firebase features you require, make sure to add the emulators as well as firestore and auth.
- `firebase emulators:start` - Starts the emulator
- `firebase deploy --only firestore:rules` - deploys the rules

## Usage

Make sure to add the following lines within your config to connect to the emulator

```
  connectFirestoreEmulator(initDb, "127.0.0.1", 8080);
  connectAuthEmulator(initAuth, "http://127.0.0.1:9099");
```

Or to connect depending on the environment add an environment variable and do the following.

```
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  connectFirestoreEmulator(initDb, "127.0.0.1", 8080);
  connectAuthEmulator(initAuth, "http://127.0.0.1:9099");
}
```

With this you can then add `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` to your .env.local file, alternatively you can also add it as part of the `package.json` script.

### env.local

```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

### command line

```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true next dev
```

### package.json

```
"dev:local": "NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true next dev"
```

## Firestore rules

### deploy

Firestore rules will update when `firestore.rules` is edited and saved. To deploy use the command `firebase deploy --only firestore:rules`.

### examples

Some examples are shown within the firebase folder that can be found in the root directory
