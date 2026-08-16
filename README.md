# Same Day

Live: https://same-day-seven.vercel.app

## What it is

Draw the shape of your day as five points. You are matched with one person whose
day had the same shape. You record thirty seconds for them before you hear
theirs. Then you mark where you are right now, and the app shows the distance
between that and where your day ended.

The day itself is never redrawn. Hearing from a stranger does not retroactively
change what your afternoon was, and asking someone to redraw it invites them to
lie about their own morning.

## The loop

1. `/` — draw five points, morning to night
2. match — closest day in the pool, by Euclidean distance over the five points
3. give — thirty seconds of voice, or type it (a joke, a song, a film)
4. receive — their clip
5. right now — the day is locked; you add one more point for where you are now
6. result — the day plus that point, and the distance between them

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run build
```

## Recording the starting pool

`/seed` is a builder tool, linked from nowhere in the app. It records ten clips
and downloads each as the filename `lib/seeds.ts` expects. Drop them into
`public/voices/`.

## Files

```
lib/curve.ts                 five-point day, banding, distance, the now-delta
lib/prompts.ts               which ask you get, from both days
lib/seeds.ts                 the starting pool: real recordings
lib/pool.ts                  match, store, block, history, smiles
components/CurveCanvas.tsx   the draggable curve, with keyboard controls
components/Recorder.tsx      thirty-second recorder, or type it instead
components/Waveform.tsx      their voice, drawn while it plays
components/Logo.tsx          the mark, and the once-per-session intro
app/page.tsx                 the loop
app/seed/page.tsx            builder tool for recording the pool
```

## Honest limits

- The starting pool is seeded by the builder. It is real human voice, not
  generated, but it is not yet a crowd.
- Clips recorded in the app are stored in that browser's `localStorage`. So is
  your history and the smile tally, which means the board is per-device. A
  shared server-side pool is the next step and only has to replace the storage
  functions in `lib/pool.ts`.
- The delta is one person's own drawing, four minutes apart. It is a
  self-report, not a clinical measure, and it moves for reasons other than the
  clip.
- Matching is arithmetic over five numbers. No model decides how anyone feels.
- One tap pulls a clip and it is never served to you again. There is no live
  channel and no public text, so a clip you opted into hearing is the whole
  attack surface. What is missing is human review of a shared pool.

## Accessibility

- Every curve point has up/down buttons, so dragging is not the only way in.
- Typing is a full alternative to voice: emoji, or 240 characters, or both.
- Every seeded clip carries a caption for anyone who cannot play audio.
- `prefers-reduced-motion` and `prefers-color-scheme` are both respected.

## AI use

Built with Claude (Opus 5) as a coding assistant. No model runs at runtime:
matching, banding and the delta are plain arithmetic in `lib/curve.ts`, and
nothing in the app generates text at the user.
