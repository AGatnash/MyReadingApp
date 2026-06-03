# Grapheme Audio Clips

Optional sound clips for multi-letter graphemes (digraphs/trigraphs) used by
the higher levels. One clip per grapheme, named exactly as the grapheme:

- `sh.mp3`, `ch.mp3`, `th.mp3` (Level 7)
- `ng.mp3`, `ck.mp3` (Level 8)
- `ee.mp3`, `oo.mp3` (Level 9)
- `ai.mp3`, `oa.mp3` (Level 10)

Each clip should be the **pure phoneme** for that grapheme (e.g. the /sh/
sound), to match the per-letter clips in `../letters/`.

## Fallback behaviour

If a clip is missing, the app falls back to browser speech synthesis, which
will *spell out* the grapheme rather than say its phoneme — usable, but not
ideal for teaching. Adding real phoneme clips here makes the higher levels
sound correct, exactly like the single-letter clips do.

Single-letter sounds live in `../letters/` and are bundled already.
