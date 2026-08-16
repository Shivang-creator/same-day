# Same Day

Live: https://same-day-seven.vercel.app

## What it is

Draw the shape of your day as five points. You are matched with one person whose
day had the same shape. You record ten seconds for them before you hear theirs.
Then you draw your day again, and the app shows the difference between the two
curves.

## The loop

1. `/` — draw five points, morning to night
2. match — closest day in the pool, by Euclidean distance over the five points
3. give — ten seconds of voice, or an emoji if the mic is unavailable
4. receive — their clip
5. draw again — same five points
6. result — before and after on one axis, and the delta

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
lib/curve.ts                 five-point day, banding, distance, delta, colour
lib/seeds.ts                 the starting pool — real recordings, with prompts
lib/pool.ts                  match, store, smile count (storage isolated here)
components/CurveCanvas.tsx   the draggable curve, with keyboard controls
components/Recorder.tsx      ten-second recorder + emoji fallback
app/page.tsx                 the loop
app/seed/page.tsx            builder tool for recording the pool
```

## Honest limits

- The starting pool is seeded by the builder. It is real human voice, not
  generated, but it is not yet a crowd.
- Clips recorded in the app are stored in that browser's `localStorage`. A
  shared server-side pool is the next step; it only has to replace the four
  functions in `lib/pool.ts`.
- The before/after delta is one person's own drawing, four minutes apart. It is
  a self-report, not a clinical measure, and it moves for reasons other than the
  clip.
- Matching is arithmetic over five numbers. No model decides how anyone feels.
- There is no live channel, so there is no live moderation problem — but there
  is also no report-and-remove flow yet.

## Accessibility

- Every curve point has ▲/▼ buttons — the drag is not the only way in.
- The emoji path is a full alternative to voice, not a downgrade.
- Captions accompany every seeded clip.
- `prefers-reduced-motion` and `prefers-color-scheme` are both respected.

## AI use

Built with Claude (Opus 5) as a coding assistant. No model runs at runtime:
matching, banding and the delta are plain arithmetic in `lib/curve.ts`, and
nothing in the app generates text at the user.
