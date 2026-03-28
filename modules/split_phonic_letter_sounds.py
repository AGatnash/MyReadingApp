#!/usr/bin/env python3
"""Split a combined phonics track into per-letter MP3 clips.

Expected source order: a-z.
The script auto-detects silence gaps and exports the first 26 segments.
"""

from __future__ import annotations

import argparse
import re
import string
import subprocess
from pathlib import Path

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
    parser = argparse.ArgumentParser(description="Split Phonic_letter_sounds.mp3 into a-z files.")
    parser.add_argument("source", type=Path, help="Path to combined source MP3")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("assets/audio/letters"),
        help="Directory for exported letter clips",
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

    segments = detect_segments(args.source, args.noise_db, args.silence_duration, args.min_segment)

    if len(segments) < 26:
        raise RuntimeError(
            f"Only detected {len(segments)} segments; expected at least 26 for letters a-z. "
            "Try lowering --noise-db (e.g. -40) or --silence-duration."
        )

    letters = list(string.ascii_lowercase)
    for letter, (start, end) in zip(letters, segments[:26]):
        export_segment(args.source, args.output_dir / f"{letter}.mp3", start, end)

    print(f"Exported 26 clips to {args.output_dir.resolve()}")


if __name__ == "__main__":
    main()
