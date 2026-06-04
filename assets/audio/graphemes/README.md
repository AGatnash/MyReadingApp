# Grapheme Audio Clips

Sound clips for multi-letter graphemes (digraphs) used by the higher levels.
One clip per grapheme, named exactly as the grapheme. Each clip should be the
**pure phoneme** for that grapheme (e.g. the /sh/ sound), recorded in the **same
voice/style as the per-letter clips** in `../letters/` so the "Sound it out"
blend stays seamless.

| Grapheme | File | Level | Status |
|----------|------|-------|--------|
| ck | `ck.mp3` | 8 | ✅ Done — copy of `../letters/k.mp3` (same /k/ sound) |
| sh | `sh.mp3` | 7 | ⬜ Record |
| ch | `ch.mp3` | 7 | ⬜ Record |
| th | `th.mp3` | 7 | ⬜ Record |
| ng | `ng.mp3` | 8 | ⬜ Record |
| ee | `ee.mp3` | 9 | ⬜ Record |
| oo | `oo.mp3` | 9 | ⬜ Record |
| ai | `ai.mp3` | 10 | ⬜ Record |
| oa | `oa.mp3` | 10 | ⬜ Record |

## How to record the 8 remaining clips

This mirrors the per-letter workflow (`split_phonic_letter_sounds.py`).

1. Record ONE track saying the 8 grapheme **sounds** (not letter names), in
   this exact order, with a clear ~0.3-0.5s pause between each:

   ```
   sh   ch   th   ng   ee   oo   ai   oa
   ```

   Save it as e.g. `grapheme_sounds.mp3` (or `.wav`) in the repo root.

2. Split it into the individual clips:

   ```bash
   python3 modules/split_grapheme_sounds.py grapheme_sounds.mp3
   ```

   This drops `sh.mp3`, `ch.mp3`, … into this folder. If the segment count is
   off, tune detection (same flags as the letter splitter):

   ```bash
   python3 modules/split_grapheme_sounds.py grapheme_sounds.mp3 --noise-db -40 --silence-duration 0.1
   ```

   (Requires `ffmpeg` + `ffprobe` on PATH.)

## Fallback behaviour

If a clip is missing, the app falls back to browser speech synthesis, which
*spells out* the grapheme rather than saying its phoneme — usable, but not ideal
for teaching. Adding the real clips here makes Levels 7-10 sound correct,
exactly like the single-letter clips do.
