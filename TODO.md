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
- [x] **Encoding-first "Movable Alphabet" mode** — "Build a Word" activity on
      the home menu. The app says a target word (replayable via the speaker
      button); the child builds it from the full tile board (no guide filter,
      no correctness reveal) and taps Check. Accepts single-letter or digraph
      spellings; successes count toward level mastery. Picture prompts are a
      separate item below.
- [x] **Word pictures** — emoji picture per word (`modules/pictures.js`):
      shown as the Build-mode prompt (build the name of the thing) and revealed
      in ReadStar once a word is decoded. Covers the concrete nouns in the
      levels; words with no clear emoji degrade to audio-only.
- [ ] **Comprehension beyond single words** — decodable phrases / sentences,
      building toward simple decodable mini-books. (Real illustrations instead
      of emoji could come here too.)
- [ ] **Multisensory letter formation** — sandpaper-letter-style finger tracing
      (lowercase, correct stroke order, sound plays as you trace).
- [ ] **Pure phonemes + clear Sound vs. Name modes** — reconcile ReadStar
      (sounds) with Letter Crunch (letter names); consistent lowercase.
- [ ] **Teacher/parent dashboard** — per-GPC mastery, spaced review of weak
      sounds; turn the completed-words log into real formative assessment.
- [x] **Make speech recognition optional & forgiving** — added a manual "I read
      it" tick (always available; the only path when speech is off/unsupported),
      a "Listen for Reading" settings toggle, and graceful degradation when the
      browser lacks speech support. Replaced the loose `includes` match with
      whole-word, length-scaled edit-distance matching across all recognizer
      alternatives (maxAlternatives=5), so "at" is no longer matched by "cat".
- [ ] **Self-correcting, non-competitive solo mode** alongside Letter Crunch
      (Montessori alignment).

### Tuning / polish
- [x] **Mastery threshold** — a level now unlocks the next at 80% of its words
      read (`MASTERY_RATIO` in `app.js`), not 100%, so a flaky mic or a couple of
      stubborn words can't stall a learner; they can still go back and finish.
      Completion counts words read via the mic OR the manual "I read it" tap.
- [ ] Consistent letter case across ReadStar (lowercase) and Letter Crunch
      (uppercase).
- [ ] Allow dot-segmented graphemes in the Custom word list (advanced) so
      custom words can use digraph tiles too.
