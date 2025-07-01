# Mind Mapping Tool (React + TypeScript + Vite)

A modern, collaborative mind mapping tool built with React, TypeScript, Zustand, Firebase Firestore, and Vite. Supports real-time sync, offline editing (localStorage fallback), drag-and-drop, and print/export.

---

## Features
- **Visual Mind Map Editor**: Create, edit, drag, and organize nodes visually.
- **Real-time Sync**: Syncs your mind map to Firestore for collaboration (if online).
- **Offline Mode**: Works offline and saves changes to localStorage if Firestore is unavailable.
- **Robust Error Handling**: Clear UI for connection errors and offline fallback.
- **Print/Export**: Print your mind map or export as PDF.
- **TypeScript, Zustand, Vite**: Fast, type-safe, and modern stack.

---

## Getting Started

### 1. Clone & Install
```bash
npm install
```

### 2. Firebase Setup
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
- Enable **Firestore Database**.
- Copy your Firebase config to `src/firebase/firebase.ts` (already present, but check `apiKey`, `projectId`, etc.).
- Set Firestore **rules** to allow read/write for testing:
  ```
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```
- Make sure the collection `mindMaps` and document `defaultMap` exist (or let the app create them).

### 3. Run the App
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure
```
├── public/                # Static assets
├── src/
│   ├── api/               # Firebase service re-export
│   ├── assets/            # Images, icons
│   ├── components/        # UI components (Toolbar, MindMapCanvas, Node, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand store & Firestore sync logic
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions (tree, uuid, validation)
│   ├── firebase/          # Firebase config/init
│   ├── App.tsx            # Main app
│   └── main.tsx           # Entry point
├── package.json
├── vite.config.ts
└── ...
```

---

## Usage
- **Double-click** anywhere to add a node.
- **Drag** nodes to reposition.
- **Edit** node labels by double-clicking.
- **Toolbar**: Add root/child nodes, reset view, print/export, clear all.
- **Sync Status**: See online/offline/syncing status in the corner.
- **Offline?** All changes are saved locally and will sync when reconnected.

---

## Tech Stack
- [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/) (state management)
- [Firebase Firestore](https://firebase.google.com/docs/firestore) (real-time sync)
- [Framer Motion](https://www.framer.com/motion/) (animations)
- [React Hook Form](https://react-hook-form.com/) + [Yup](https://github.com/jquense/yup) (forms/validation)
- [Tailwind CSS](https://tailwindcss.com/) (utility-first styling)

---

## Troubleshooting
- **Firestore 400 errors?**
  - Check your Firestore rules and config (see above).
  - Make sure your Firebase project and credentials are correct.
  - Ensure the `mindMaps/defaultMap` document exists.
- **Offline mode?**
  - The app will work and save changes locally. Reconnect and reload to sync.

---

## License
MIT

---

## Credits
Built by Amit Yadav and contributors.

