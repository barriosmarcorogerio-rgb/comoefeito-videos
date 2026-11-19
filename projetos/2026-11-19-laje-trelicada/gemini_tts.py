"""Narração oficial do canal: Gemini TTS, voz Iapetus.
uso: python3 gemini_tts.py script.txt voice.wav [VOZ] [VELOCIDADE]
- A chave fica no ambiente da nuvem (header x-goog-api-key injetado pelo proxy); não precisa de variável.
- Mande SÓ o texto: instruções de estilo são lidas em voz alta. A emoção vem da pontuação do roteiro
  ("...", "!", "?", palavras em MAIÚSCULA para ênfase).
- Uma chamada por vez. Em 429 (cota) espera e tenta de novo o modelo novo antes de cair para o antigo."""
import sys, json, base64, wave, time, subprocess, urllib.request, urllib.error
src, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "Iapetus"
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.05
txt = open(src, encoding="utf-8").read().strip()
body = {"contents": [{"parts": [{"text": txt}]}],
        "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
d = None; used = None
for model, tries in [("gemini-3.8-flash-tts", 4), ("gemini-2.5-flash-preview-tts", 3), ("gemini-2.5-pro-preview-tts", 2)]:
    for attempt in range(tries):
        req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                                     data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        try:
            r = json.load(urllib.request.urlopen(req, timeout=300))
            if "inlineData" in json.dumps(r): d = r; used = model; break
            print(model, "sem áudio na resposta", json.dumps(r)[:160], flush=True); time.sleep(10); continue
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore"); print(model, e.code, msg[:160].replace("\n", " "), flush=True)
            if e.code == 429 and "PerDay" in msg: print(model, "cota DIÁRIA esgotada (10/dia no plano grátis) -> próximo modelo", flush=True); break
            if e.code in (429, 500, 503): time.sleep(45 * (attempt + 1)); continue
            break
        except Exception as e:
            print(model, e, flush=True); time.sleep(20)
    if d: break
if not d: sys.exit("Gemini TTS falhou em todas as tentativas")
pcm = base64.b64decode(d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
with wave.open("_raw.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "_raw.wav", "-af", f"atempo={speed},silenceremove=start_periods=1:start_threshold=-45dB,apad=pad_dur=0.4", "-ar", "24000", out], check=True)
print(out, used, voice, speed)
