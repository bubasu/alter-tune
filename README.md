# AlterTune

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.8.

A minimal skeleton to explore alternative guitar tunings using SVG (for the UI) and the Web Audio API (for sound).

Features in this skeleton:
- Tuning Editor (SVG preview, adjustable number of strings and pitch per string)
- Fingering Editor (simple SVG fretboard; set per‑string fret, mute/open)
- Arpeggio Sequencer (step grid per string; toggle events)
- Transport (Play/Stop and BPM)
- Audio engine (basic pluck synth with a look‑ahead scheduler)
- Default example: One bar arpeggio over standard tuning

## Development server

To start a local development server, run:

```bash
yarn install   # or: npm install
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`.

Click "Play" in the Transport panel to start audio. You may need to interact with the page (click) before audio can start due to browser autoplay policies.

## Building

To build the project run:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Notes
- UI is intentionally simple and uses SVG only (no Canvas).
- Audio uses the raw Web Audio API (no external libs) and a simple triangle‑wave pluck through a low‑pass filter.
- State is held via Angular Signals in the workspace and passed down to standalone components.
- This is a foundation to extend with more advanced features (strumming, velocity editing, multiple patterns, persistence, etc.).
