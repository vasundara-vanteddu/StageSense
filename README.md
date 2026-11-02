# StageSense

Multimodal presentation delivery assessment platform. StageSense analyses a rehearsal recording of a single speaker and reports observable indicators across six dimensions: **Speaking Rate**, **Vocal Expressiveness**, **Pausing & Fluency**, **Gestures**, **Posture**, and **Visual Engagement** along one synchronized timeline.

## Features

- **The Rehearsal Room ("Atmospheric Blue")**: Editorial theatre aesthetic with midnight grounds, cool white-blue horizons, 1px hairlines, and data-true traces.
- **Six Assessment Dimensions**:
  - `Speaking Rate`: Sliding window wpm against polished-speaker reference corridor (130–175 wpm).
  - `Vocal Expressiveness`: Pitch semitone standard deviation (F0) and RMS dynamic intensity variation.
  - `Pausing & Fluency`: Pause share (≥0.4s), disfluencies per minute, and long pauses (≥3s).
  - `Gestures`: 2D wrist displacement relative to inter-shoulder width while hands are in frame.
  - `Posture`: 2D lateral sway, shoulder tilt, and slump against the speaker's median baseline.
  - `Visual Engagement`: Camera-facing head orientation proxy (±20° lens cone).
- **Synchronized Session Replay**:
  - Live readout updating with playhead position.
  - Multi-lane `SignalTimeline` with CUE flags, compound event merges, and 1×/2×/4× zoom.
  - Recharts signal multiples aligned with the session timeline.
  - Transcript panel with clickable timecodes, segment follow, and subtle filler word highlighting.
  - Explainability side sheet with piecewise trapezoid `BandCurve`, numbers, and limits.
- **Rehearsal Archive**:
  - Search, filter, and sorting.
  - Progress trajectory chart across attempts.
  - Two-session side-by-side comparison mode with delta indicators.
- **Open Methodology**:
  - Interactive pipeline diagram.
  - 10-second window overlap demo with 5-second hops.
  - Live renormalizing overall calculator with dimension exclusion toggles.

## Environments & Configuration

### Mock Mode (Default)
By default, StageSense operates with `VITE_API_MODE=mock` (or `NEXT_PUBLIC_API_MODE=mock`). It includes a deterministic local simulation that:
- Simulates upload progress over ~2.5s.
- Simulates parallel audio (`Listening`) and video (`Watching`) processing leading to `Aligning` and `Writing` over ~24s.
- Supports error simulation (`fail` in filename triggers `NO_SPEECH_DETECTED`; `restart` triggers `SERVER_RESTARTED`).
- Ships with 3 complete sample reports: `product-pitch`, `thesis-update`, and `lab-update`.
- Includes seeded demo authentication: `demo@stagesense.dev` / `Rehearse!2026` as well as guest mode.

### Live Mode
To connect to a live FastAPI / OpenAPI backend:
1. Update `.env`:
   ```bash
   VITE_API_MODE=live
   VITE_API_URL=http://localhost:8000/api/v1
   ```
2. Generate TypeScript types directly from the running FastAPI OpenAPI schema:
   ```bash
   npm run gen:api
   ```

## Development

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Build for production
npm run lint     # Validate TypeScript types
```
