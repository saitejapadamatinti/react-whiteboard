# Sketchboard — React Whiteboard

A responsive browser-based whiteboard built with React, Vite, HTML Canvas and Lucide icons.

## Features
- Pen, eraser, line, rectangle, ellipse and arrow tools
- Text and sticky notes
- Color palette and adjustable stroke width
- Undo and redo (Ctrl/Cmd+Z, Ctrl/Cmd+Y)
- Grid toggle and PNG export
- Automatic browser-local saving and restore after refresh
- Import/export editable `.sketchboard.json` backups
- Zoom controls and keyboard shortcuts
- Responsive layout

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy on Vercel
Import this repository at https://vercel.com/new. Vercel detects Vite automatically.
- Framework preset: Vite
- Build command: npm run build
- Output directory: dist

Note: boards are saved in the current browser using local storage. They are not synchronized between users or devices. Use **Backup** to export a `.sketchboard.json` file and **Import** to restore it elsewhere.
