"""Record every German line the site reads aloud, as MP3 files in audio/.

The site plays these recordings instead of the browser's built-in voice, so German always sounds
the same, in every browser and offline. Run this after adding or changing German text in data/:

    pip install sherpa-onnx lameenc numpy
    python tools/make_audio.py            # records only what's missing
    python tools/make_audio.py --prune    # also deletes recordings nothing uses any more

The main voice is Thorsten (Piper de_DE-thorsten-high: CC0 voice data, MIT model).
Authored dialogues alternate Thorsten and Kerstin (de_DE-kerstin-low, CC0 voice data).
Both run locally with sherpa-onnx. Models are downloaded once into tools/.models/ (kept out of git).
File names are a hash of the text, computed the same way in js/ui/audio.js.
"""

import argparse
import json
import re
import sys
import tarfile
import time
import urllib.request
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
AUDIO = ROOT / "audio"
MODELS = Path(__file__).resolve().parent / ".models"

VOICE = "vits-piper-de_DE-thorsten-high"
VOICE_URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{VOICE}.tar.bz2"
VOICE_LABEL = "Thorsten (Piper de_DE-thorsten-high)"
SECOND_VOICE = "vits-piper-de_DE-kerstin-low"
BITRATE = 48  # kbit/s, mono


# ---------- which texts are spoken (keep in step with the views that call speak()) ----------


def spoken_texts():
    """Every string the site passes to speak(), in a stable order."""
    texts = {}
    levels = json.loads((DATA / "levels.json").read_text(encoding="utf-8"))
    for level in levels:
        content = json.loads((DATA / f"{level['id']}.json").read_text(encoding="utf-8"))
        course = {}
        if level.get("courseFile"):
            course = json.loads((DATA / level["courseFile"]).read_text(encoding="utf-8"))
            content["lessons"].extend(course.get("lessons", []))
            content.setdefault("topics", []).extend(course.get("topics", []))
            content["test"] = course.get("test", content["test"])
        for lesson in content["lessons"]:
            for example in lesson.get("examples", []):
                texts.setdefault(example["de"])
            for word in lesson.get("vocab", []):
                texts.setdefault(word["de"])
            for task in lesson["tasks"]:
                if task["type"] == "listen":
                    texts.setdefault(task["audioText"])
                elif task["type"] == "write":
                    texts.setdefault(task["modelAnswer"])
        for support in course.get("support", {}).values():
            for drill in support.get("pronunciationDrills", []):
                texts.setdefault(drill["text"])
            for item in support.get("speaking", []):
                texts.setdefault(item["modelAnswer"])
        for module in course.get("modules", []):
            workshop = module.get("workshop", {})
            if workshop:
                texts.setdefault(workshop["listening"]["audioText"])
                texts.setdefault(workshop["writing"]["modelAnswer"])
                texts.setdefault(workshop["speaking"]["modelAnswer"])
        for topic in content.get("topics", []):
            for word in topic["vocab"]:
                texts.setdefault(word["de"])
                texts.setdefault(word["ex"]["de"])
        test = content["test"]
        for item in test["listening"]:
            texts.setdefault(item["audioText"])
        for item in test["speaking"]:
            texts.setdefault(item["modelAnswer"])
    practice_file = DATA / "practice.json"
    if practice_file.exists():
        practice = json.loads(practice_file.read_text(encoding="utf-8"))
        for sets in practice["levels"].values():
            for practice_set in sets:
                if practice_set.get("audioText"):
                    texts.setdefault(practice_set["audioText"])
    return [t for t in texts if t.strip()]


def dialogue_segments():
    """Authored speaker turns; the combined file keeps the hash of the visible transcript."""
    course = json.loads((DATA / "a1-course.json").read_text(encoding="utf-8"))
    return {item["audioText"]: item["segments"] for item in course["test"]["listening"] if item.get("segments")}


# Spellings the voice says more clearly than the written form (the file still belongs to the written form)
SAY_AS = {
    "kennenlernen": "kennen lernen",
    "Hallo": "Hallo!",
    "schmecken": "schmecken!",
    "Straße schreibt man mit ß.": "Straße schreibt man mit Eszett.",
}

# Loanwords and compounds the voice's German spelling rules get wrong, respelled wherever they appear
RESPELL = [
    (r"\bApp\b", "Äpp"),
    (r"\bjogge(n?)\b", r"dschogge\1"),
    (r"\bchatten\b", "tschätten"),
    (r"\bSmartphone\b", "Smartfohn"),
    (r"\bHomeoffice\b", "Hohm-Offis"),
    (r"\bEsstisch\b", "Ess-Tisch"),
    (r"\bGarage\b", "Ga-rahsche"),
    (r"\bCousin\b", "Ku-säng"),
    (r"\bFitnessstudio\b", "Fitness-Studio"),
    (r"\bFebruar\b", "Fehbruar"),
    (r"\bSonnencreme\b", "Sonnenkreem"),
    (r"\brecycel(n|t)\b", r"ri-ßaikel\1"),
    (r"\beinchecken\b", "eintschecken"),
    (r"\bToilette\b", "Toa-lette"),
    (r"\bRathaus\b", "Raht-Haus"),
    (r"\bHotel\b", "Hotell"),
    (r"\bGoethestraße\b", "Göhte-Straße"),
    (r"\bNotarzt\b", "Not-Arzt"),
    (r"\bfit\b", "fitt"),
]

# The alphabet set: each letter is read as its German name, and "B wie Berta." as "Beh, wie Berta."
LETTER_NAMES = {
    "A": "Ah", "B": "Beh", "C": "Zeh", "D": "Deh", "E": "Eh", "F": "Eff", "G": "Geh", "H": "Hah", "I": "Ih",
    "J": "Jott", "K": "Kah", "L": "Ell", "M": "Emm", "N": "Enn", "O": "Oh", "P": "Peh", "Q": "Kuh", "R": "Err",
    "S": "Ess", "T": "Teh", "U": "Uh", "V": "Fau", "W": "Weh", "X": "Iks", "Y": "Üpsilon", "Z": "Zett",
    "Ä": "Äh", "Ö": "Öh", "Ü": "Üh", "ß": "Eszett",
}


def for_speech(text):
    """What the voice actually reads: dashes and ellipses become short pauses, and single words get a
    full stop, which makes the voice finish them cleanly instead of trailing off."""
    if text in LETTER_NAMES:
        text = LETTER_NAMES[text]
    elif len(text) > 2 and text[1] == " " and text[0] in LETTER_NAMES and text[2:].startswith("wie "):
        text = f"{LETTER_NAMES[text[0]]}, {text[2:]}"
    text = SAY_AS.get(text, text)
    # Read contact digits individually and spell surnames using German letter names.
    digit_names = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]
    text = re.sub(r"(?<!\w)0\d{3,}(?: \d{2,})*(?!\w)", lambda m: ", ".join(digit_names[int(c)] for c in m[0] if c.isdigit()), text)
    text = re.sub(r"(?<!\d)\d{5}(?!\d)", lambda m: ", ".join(digit_names[int(c)] for c in m[0]), text)
    text = re.sub(r"(?<!\w)[A-ZÄÖÜ](?=\s*[,\.]|\s*$)", lambda m: LETTER_NAMES[m[0]], text)
    for pattern, spoken in RESPELL:
        text = re.sub(pattern, spoken, text)
    text = text.replace(" — ", " ").replace("—", ", ")
    text = text.replace(" … ", ", ").replace("…", ", ").replace("...", ", ")
    text = " ".join(text.split())
    return text if text[-1:] in ".!?" else text + "."


# ---------- file names: cyrb53 hash of the text, base 36 (same as js/ui/audio.js) ----------

M32 = 0xFFFFFFFF


def _imul(a, b):
    return (a * b) & M32


def cyrb53(text, seed=0):
    h1 = (0xDEADBEEF ^ seed) & M32
    h2 = (0x41C6CE57 ^ seed) & M32
    units = text.encode("utf-16-le")
    for i in range(0, len(units), 2):
        ch = units[i] | (units[i + 1] << 8)
        h1 = _imul(h1 ^ ch, 2654435761)
        h2 = _imul(h2 ^ ch, 1597334677)
    h1 = _imul(h1 ^ (h1 >> 16), 2246822507)
    h1 ^= _imul(h2 ^ (h2 >> 13), 3266489909)
    h2 = _imul(h2 ^ (h2 >> 16), 2246822507)
    h2 ^= _imul(h1 ^ (h1 >> 13), 3266489909)
    return 4294967296 * (2097151 & h2) + (h1 & M32)


def clip_id(text):
    n = cyrb53(text)
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    out = ""
    while n:
        n, r = divmod(n, 36)
        out = digits[r] + out
    return out or "0"


# ---------- voice ----------


def ensure_model(voice=VOICE):
    folder = MODELS / voice
    if (folder / "tokens.txt").exists():
        return folder
    MODELS.mkdir(parents=True, exist_ok=True)
    archive = MODELS / f"{voice}.tar.bz2"
    url = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{voice}.tar.bz2"
    print(f"Downloading the voice from {url}", flush=True)
    urllib.request.urlretrieve(url, archive)
    with tarfile.open(archive, "r:bz2") as tar:
        try:
            tar.extractall(MODELS, filter="data")
        except TypeError:  # Python without extraction filters
            tar.extractall(MODELS)
    archive.unlink()
    return folder


def load_voice(folder):
    import sherpa_onnx

    vits = sherpa_onnx.OfflineTtsVitsModelConfig(
        model=str(next(folder.glob("*.onnx"))),
        tokens=str(folder / "tokens.txt"),
        data_dir=str(folder / "espeak-ng-data"),
        lexicon="",
        noise_scale=0.667,
        noise_scale_w=0.8,
        length_scale=1.0,
    )
    config = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(vits=vits, provider="cpu", num_threads=2, debug=False),
        max_num_sentences=1,
    )
    if not config.validate():
        sys.exit("The voice model files look incomplete. Delete tools/.models and run again.")
    return sherpa_onnx.OfflineTts(config)


def record(tts, text, speed):
    """Speech as 16-bit PCM: silence trimmed, peak-normalised, with a little air at both ends."""
    audio = tts.generate(for_speech(text), sid=0, speed=speed)
    x = np.asarray(audio.samples, dtype=np.float32)
    rate = audio.sample_rate
    loud = np.flatnonzero(np.abs(x) > 0.012 * (np.abs(x).max() or 1))
    if loud.size:
        x = x[max(0, loud[0] - int(0.03 * rate)) : loud[-1] + int(0.12 * rate)]
    x = x / (np.abs(x).max() or 1) * 0.89  # about -1 dBFS
    x = np.concatenate([np.zeros(int(0.08 * rate)), x, np.zeros(int(0.05 * rate))])
    return (x * 32767).astype("<i2").tobytes(), rate


def to_mp3(pcm, rate):
    import lameenc

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(BITRATE)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(1)
    encoder.set_quality(2)
    return encoder.encode(pcm) + encoder.flush()


def record_dialogue(voices, segments, speed):
    parts = []
    output_rate = None
    for segment in segments:
        pcm, rate = record(voices[segment["voice"]], segment["text"], speed)
        samples = np.frombuffer(pcm, dtype="<i2").astype(np.float32)
        output_rate = output_rate or rate
        if rate != output_rate:
            count = round(len(samples) * output_rate / rate)
            samples = np.interp(np.arange(count) * rate / output_rate, np.arange(len(samples)), samples)
        parts.extend([samples.astype("<i2"), np.zeros(round(output_rate * 0.25), dtype="<i2")])
    return np.concatenate(parts).tobytes(), output_rate


# ---------- main ----------


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--speed", type=float, default=0.92, help="1.0 is normal speed (default 0.92)")
    parser.add_argument("--force", action="store_true", help="record every line again")
    parser.add_argument("--prune", action="store_true", help="delete recordings nothing uses any more")
    args = parser.parse_args()

    texts = spoken_texts()
    dialogues = dialogue_segments()
    ids = {text: clip_id(text) for text in texts}
    if len(set(ids.values())) != len(ids):
        sys.exit("Two texts got the same file name; change one of them slightly.")
    AUDIO.mkdir(exist_ok=True)
    todo = [t for t in texts if args.force or not (AUDIO / f"{ids[t]}.mp3").exists()]
    print(f"{len(texts)} German lines, {len(todo)} to record")

    if todo:
        tts = load_voice(ensure_model())
        second = load_voice(ensure_model(SECOND_VOICE)) if any(t in dialogues for t in todo) else None
        start = time.time()
        for n, text in enumerate(todo, 1):
            pcm, rate = record_dialogue([tts, second], dialogues[text], args.speed) if text in dialogues else record(tts, text, args.speed)
            (AUDIO / f"{ids[text]}.mp3").write_bytes(to_mp3(pcm, rate))
            if n % 25 == 0 or n == len(todo):
                print(f"  {n}/{len(todo)} recorded ({time.time() - start:.0f}s)", flush=True)

    if args.prune:
        used = {f"{i}.mp3" for i in ids.values()}
        stale = [p for p in AUDIO.glob("*.mp3") if p.name not in used]
        for p in stale:
            p.unlink()
        print(f"{len(stale)} unused recordings deleted")

    manifest = {"voice": VOICE_LABEL, "dialogueVoices": [VOICE_LABEL, "Kerstin (Piper de_DE-kerstin-low)"], "dialogues": [ids[t] for t in dialogues], "speed": args.speed, "clips": sorted(ids.values())}
    (AUDIO / "index.json").write_text(json.dumps(manifest, indent=0) + "\n", encoding="utf-8")
    print(f"audio/index.json lists {len(ids)} recordings")


if __name__ == "__main__":
    main()
