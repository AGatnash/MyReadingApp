# ReadStar — To Do

A running list of pedagogy-driven improvements. Grew out of an evaluation of
the app against modern phonics (Science of Reading / systematic synthetic
phonics) and Montessori reading practice.

## Done

- [x] **Optional letter guide filter** — toggle in Settings; when off, the full
      tile inventory is selectable so the child chooses by sound instead of
      following the only lit tile.
- [x] **"Sound it out" blending mode** — highlights and sounds each grapheme in
      turn, then lights up and speaks the whole word as one blended unit.
- [x] **Decodable default word list** — replaced the mixed list with fully
      decodable CVC/VC words ordered by GPC teaching sequence.
- [x] **Selectable levels with mastery gating** — Level Select screen; each
      level unlocks once the previous is mastered (all its words read).
- [x] **Grapheme tiles + expanded levels** — digraphs (sh, ch, th, ng, ck, ee,
      oo, ai, oa) are single tiles; 10 levels total (Letters & Sounds
      Phases 2-4), 231 decodable words.

## To Do

### Audio
- [ ] **Record the 8 digraph phoneme clips** for Levels 7-10:
      `sh ch th ng ee oo ai oa`. Workflow is ready — record one track of the
      sounds (in that order, in the same voice as the letter clips) and run
      `python3 modules/split_grapheme_sounds.py grapheme_sounds.mp3`. See
      `assets/audio/graphemes/README.md`. Until done, those graphemes fall back
      to speech synthesis (spells the digraph out, e.g. "ess-aitch").
- [x] **`ck` clip** — done; `ck.mp3` is a copy of `letters/k.mp3` (same /k/
      sound, same voice).
- [ ] Verify the bundled per-letter clips are "pure" phonemes (/c/ /a/ /t/, not
      "cuh-ay-tuh") so the letter-by-letter blend stays clean.

### Pedagogy gaps (from the evaluation, not yet built)
- [ ] **Phonemic-awareness pre-reading mode** — oral I-spy, rhyming, and
      blend/segment games with audio only (no letters yet).
- [ ] **Encoding-first "Movable Alphabet" mode** — app says a word (or shows a
      picture); child builds it from sound. Trains sound -> grapheme.
- [ ] **Meaning & comprehension** — picture per word, then decodable phrases /
      sentences, building toward simple decodable mini-books.
- [ ] **Multisensory letter formation** — sandpaper-letter-style finger tracing
      (lowercase, correct stroke order, sound plays as you trace).
- [ ] **Pure phonemes + clear Sound vs. Name modes** — reconcile ReadStar
      (sounds) with Letter Crunch (letter names); consistent lowercase.
- [ ] **Teacher/parent dashboard** — per-GPC mastery, spaced review of weak
      sounds; turn the completed-words log into real formative assessment.
- [ ] **Make speech recognition optional & forgiving** — adult "they read it"
      tap; tighten the loose `includes` match so e.g. "at" isn't matched by
      "cat".
- [ ] **Self-correcting, non-competitive solo mode** alongside Letter Crunch
      (Montessori alignment).

### Tuning / polish
- [ ] **Mastery threshold** — currently 100% of a level's words via speech
      recognition (e.g. all 19 in Level 2), which may stall a real learner.
      Consider ~80%, or count a word as "read" when blended via Sound it out.
- [ ] Consistent letter case across ReadStar (lowercase) and Letter Crunch
      (uppercase).
- [ ] Allow dot-segmented graphemes in the Custom word list (advanced) so
      custom words can use digraph tiles too.
