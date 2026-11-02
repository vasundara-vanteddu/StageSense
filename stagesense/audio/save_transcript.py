
import json
from pathlib import Path

from stagesense.audio.asr import transcribe_audio


def save_transcript(audio_path: str, output_path: str) -> dict:
    """Transcribe audio and save word-level timestamps as JSON."""
    result = transcribe_audio(audio_path)

    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(result, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    return result


if __name__ == "__main__":
    audio = "storage/jobs/wikimania-test/audio.wav"
    output = "storage/jobs/wikimania-test/words.json"

    result = save_transcript(audio, output)

    print("Transcript saved:", output)
    print("Total words:", len(result["words"]))
    print("Total segments:", len(result["segments"]))
