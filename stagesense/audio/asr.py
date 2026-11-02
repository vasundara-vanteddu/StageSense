
from pathlib import Path

from faster_whisper import WhisperModel


class SpeechTranscriptionError(Exception):
    """Raised when speech transcription fails."""


def transcribe_audio(audio_path: str | Path) -> dict:
    """Transcribe English speech with word-level timestamps."""
    path = Path(audio_path)

    if not path.is_file():
        raise FileNotFoundError(f"Audio not found: {path}")

    model = WhisperModel(
        "small.en",
        device="cpu",
        compute_type="int8",
    )

    segments, info = model.transcribe(
        str(path),
        language="en",
        word_timestamps=True,
        vad_filter=True,
        condition_on_previous_text=False,
        initial_prompt="Um, uh, so, you know, I mean.",
    )

    words = []
    transcript_segments = []

    for segment in segments:
        transcript_segments.append({
            "t0": segment.start,
            "t1": segment.end,
            "text": segment.text.strip(),
        })

        for word in segment.words or []:
            words.append({
                "start": word.start,
                "end": word.end,
                "text": word.word.strip(),
                "probability": word.probability,
            })

    if len(words) < 30:
        raise SpeechTranscriptionError(
            "NO_SPEECH_DETECTED: fewer than 30 words were recognized."
        )

    return {
        "language": info.language,
        "duration_s": info.duration,
        "words": words,
        "segments": transcript_segments,
    }
