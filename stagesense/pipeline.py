
from pathlib import Path
import json

from stagesense.audio.save_transcript import save_transcript
from stagesense.audio.acoustics import extract_acoustic_features
from stagesense.visual.save_features import save_visual_features
from stagesense.align.combine_features import combine_features
from stagesense.scoring.score_windows import score_feature_windows
from stagesense.report.builder import build_report

from stagesense.io.probe import probe_video
from stagesense.io.ffmpeg import extract_audio
from stagesense.io.playback import prepare_playback


def preprocess_video(video_path: str | Path, job_dir: str | Path) -> dict:
    """Validate a video and prepare its audio and browser playback copy."""
    source = Path(video_path)
    output_dir = Path(job_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    metadata = probe_video(source)

    audio_path = extract_audio(source, output_dir / "audio.wav")
    playback_path = prepare_playback(source, output_dir / "playback.mp4")

    return {
        "source": str(source.resolve()),
        "duration_s": metadata["duration_s"],
        "audio_path": str(audio_path.resolve()),
        "playback_path": str(playback_path.resolve()),
    }


def analyze_video(
    video_path: str | Path,
    job_dir: str | Path,
    filename: str | None = None,
    visual_fps: float = 5.0,
) -> dict:
    """Run the complete StageSense analysis pipeline."""
    source = Path(video_path)
    output_dir = Path(job_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Validate video and prepare audio/playback.
    prepared = preprocess_video(source, output_dir)
    audio_path = Path(prepared["audio_path"])

    # Step 2: Transcribe speech and save word timestamps.
    save_transcript(audio_path, output_dir / "words.json")

    # Step 3: Extract pitch and intensity features.
    acoustic_features = extract_acoustic_features(audio_path)

    (output_dir / "acoustic_features.json").write_text(
        json.dumps(acoustic_features, indent=2),
        encoding="utf-8",
    )

    # Step 4: Extract posture and gesture features.
    save_visual_features(
        str(source),
        str(output_dir / "visual_features.json"),
        fps=visual_fps,
    )

    # Step 5: Align audio and visual features.
    combine_features(
        output_dir / "acoustic_features.json",
        output_dir / "visual_features.json",
        output_dir / "combined_features.json",
    )

    # Step 6: Score individual time windows.
    score_feature_windows(
        output_dir / "combined_features.json",
        output_dir / "window_scores.json",
    )

    # Step 7: Build the final report.
    report = build_report(
        output_dir,
        filename=filename or source.name,
    )

    return {
        "job_dir": str(output_dir.resolve()),
        "audio_path": prepared["audio_path"],
        "playback_path": prepared["playback_path"],
        "report_path": str(
            (output_dir / "report.json").resolve()
        ),
        "overall_score": report.overall.score,
        "dimensions_scored": report.overall.dimensions_scored,
        "window_count": len(report.windows),
        "event_count": len(report.events),
    }
