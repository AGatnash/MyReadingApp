#!/usr/bin/env python3
"""Split a combined digraph-sounds recording into per-grapheme MP3 clips.

Record the multi-letter grapheme SOUNDS (pure phonemes, not letter names) as a
single track, in this exact order, leaving a clear pause (~0.3-0.5s of silence)
between each sound:

    sh  ch  th  ng  ee  oo  ai  oa

Then run:

    python3 modules/split_grapheme_sounds.py grapheme_sounds.mp3

The script auto-detects the silence gaps and exports one clip per grapheme into
assets/audio/graphemes/ (sh.mp3, ch.mp3, ...). If segmentation is off, tune the
detection just like the letter splitter:

    python3 modules/split_grapheme_sounds.py grapheme_sounds.mp3 --noise-db -40 --silence-duration 0.1

Notes:
- Record in the SAME voice/style as the per-letter clips in
  assets/audio/letters/ so the blend ("Sound it out") stays seamless.
- 'ck' is intentionally NOT in the list: it is the /k/ sound, so ck.mp3 is a
  copy of letters/k.mp3 (already in place).
- Requires ffmpeg + ffprobe on PATH (same as the letter splitter).
"""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

# Default grapheme order expected in the recording. 'ck' is omitted on purpose
# (it reuses letters/k.mp3).
DEFAULT_LABELS = ["sh", "ch", "th", "ng", "ee", "oo", "ai", "oa"]

SILENCE_START_RE = re.compile(r"silence_start:\s*([0-9.]+)")
SILENCE_END_RE = re.compile(r"silence_end:\s*([0-9.]+)")


def run_cmd(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, text=True, capture_output=True, check=True)


def get_duration_seconds(source: Path) -> float:
    result = run_cmd(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(source),
        ]
    )
    return float(result.stdout.strip())


def detect_segments(source: Path, noise_db: int, silence_duration: float, min_segment: float) -> list[tuple[float, float]]:
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-i",
        str(source),
        "-af",
        f"silencedetect=noise={noise_db}dB:d={silence_duration}",
        "-f",
        "null",
        "-",
    ]
    result = subprocess.run(cmd, text=True, capture_output=True, check=True)

    events: list[tuple[str, float]] = []
    for line in result.stderr.splitlines():
        if match := SILENCE_START_RE.search(line):
            events.append(("silence_start", float(match.group(1))))
        if match := SILENCE_END_RE.search(line):
            events.append(("silence_end", float(match.group(1))))

    duration = get_duration_seconds(source)
    segments: list[tuple[float, float]] = []
    current_start = 0.0

    for event_type, timestamp in events:
        if event_type == "silence_start":
            if timestamp - current_start >= min_segment:
                segments.append((current_start, timestamp))
        else:  # silence_end
            current_start = timestamp

    if duration - current_start >= min_segment:
        segments.append((current_start, duration))

    return segments


def export_segment(source: Path, output_file: Path, start: float, end: float) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-y",
        "-i",
        str(source),
        "-ss",
        f"{start:.3f}",
        "-to",
        f"{end:.3f}",
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2",
        str(output_file),
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Split a digraph-sounds recording into per-grapheme clips.")
    parser.add_argument("source", type=Path, help="Path to combined source recording")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("assets/audio/graphemes"),
        help="Directory for exported grapheme clips",
    )
    parser.add_argument(
        "--labels",
        nargs="+",
        default=DEFAULT_LABELS,
        help="Grapheme labels in recorded order",
    )
    parser.add_argument("--noise-db", type=int, default=-35, help="Silence detection threshold in dB")
    parser.add_argument(
        "--silence-duration",
        type=float,
        default=0.15,
        help="Minimum silence duration in seconds",
    )
    parser.add_argument(
        "--min-segment",
        type=float,
        default=0.08,
        help="Minimum non-silent segment duration",
    )
    args = parser.parse_args()

    if not args.source.exists():
        raise FileNotFoundError(f"Source file not found: {args.source}")

    labels = args.labels
    segments = detect_segments(args.source, args.noise_db, args.silence_duration, args.min_segment)

    if len(segments) < len(labels):
        raise RuntimeError(
            f"Only detected {len(segments)} segments; expected at least {len(labels)} "
            f"for {labels}. Try lowering --noise-db (e.g. -40) or --silence-duration, "
            "or add clearer pauses between sounds."
        )

    for label, (start, end) in zip(labels, segments[: len(labels)]):
        export_segment(args.source, args.output_dir / f"{label}.mp3", start, end)

    print(f"Exported {len(labels)} clips ({', '.join(labels)}) to {args.output_dir.resolve()}")


if __name__ == "__main__":
    main()
