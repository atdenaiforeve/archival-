# ARCHIVAL — Central Records Database

ARCHIVAL is a fictional digital records archive built as an interactive-style website. It presents a collection of restricted personnel records, audio transmissions, and visual evidence in a dark, terminal-inspired interface.

## Archive Sections

- **Written Records** — year-based personnel files and administrative registers.
- **Audio Transmissions** — archived audio records.
- **Visual Evidence** — collected visual records and supporting material.

## Personnel Records

The Written Records directory is organised by record year, currently covering **2019–2026**. Each record has its own archive viewer page.

The 2019 file, **FARB-2019-001 // Employee Attendance Register**, contains a fictional attendance register with 50 employee entries, including employee IDs, names, recorded roles, and clock-in times.

## Design

The site uses a dark charcoal interface with muted text, cyan highlights, and blue record elements to create a consistent archival-terminal aesthetic. Shared styling lives in `assets/css/archival.css`; `assets/js/archival-ui.js` only displays ARCHID status in the sidebar and never touches identity data.

## Filing audio and visual records

The Audio Transmissions and Visual Evidence pages are currently empty. Each page has a clearly marked list near the bottom of its file (`TRANSMISSIONS` in `audio/index.html`, `EVIDENCE` in `visual/index.html`). Adding an entry to that list builds the catalogue rows, the playback panel or the evidence viewer automatically; the entry format is described in the comment above the list.

## Technology

ARCHIVAL is a static website hosted with **GitHub Pages**. Its pages are built with HTML, CSS, and JavaScript.

## Project Note

ARCHIVAL is a fictional world-building project. Its records and organisation are created for storytelling and creative use; they are not official government or real-world records.
