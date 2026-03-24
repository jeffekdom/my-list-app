# My Lists — PWA

A clean, minimal list manager that installs as an app on your phone or desktop.

## How to use

### Quickest option — open directly in browser
Just open `index.html` in Chrome or Safari. Your data saves automatically in local storage.

### Install as a PWA (recommended)

**On iPhone/iPad (Safari):**
1. Open the app in Safari
2. Tap the Share button → "Add to Home Screen"
3. Tap "Add" — it'll appear as an app icon

**On Android (Chrome):**
1. Open the app in Chrome
2. Tap the three-dot menu → "Add to Home screen" or "Install app"

**On Desktop (Chrome/Edge):**
1. Open the app
2. Look for the install icon (⊕) in the address bar, or go to menu → "Install My Lists"

### To host it (so you can install properly):
Run a simple local server:
```
cd listapp
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

Or host the folder on any static host (Netlify, GitHub Pages, Vercel — all free).

## Features
- All your lists in one place
- Tap to open, checkbox to complete items
- Drag to reorder lists and items
- Rename any list (tap the title)
- Delete lists with confirmation
- Most recently used lists appear first
- Add tabs within any list for sub-sections
- Data persists locally — works offline
