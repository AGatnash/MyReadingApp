# Letter Audio Clips

Place one clip per lowercase letter in this folder:

- `a.mp3`
- `b.mp3`
- ...
- `z.mp3`

To auto-split a combined track (`Phonic_letter_sounds.mp3`), run:

```bash
python3 modules/split_phonic_letter_sounds.py Phonic_letter_sounds.mp3
```

If segmentation is off, tune the detection settings:

```bash
python3 modules/split_phonic_letter_sounds.py Phonic_letter_sounds.mp3 --noise-db -40 --silence-duration 0.1
```
