"""Trilha + efeitos a partir de work/cues.json -> music.wav e sfx.wav (mix.py faz o nível).
cues.json: {"dur": seg, "music_end": seg (opcional), "sfx": [{"t": seg, "k": "pop|thud|crack|ding|whoosh|drop|tick"}]}
Trilha: ukulele/pluck alegre em Dó maior, 112 bpm, original, gerada aqui (sem direitos de terceiros)."""
import json, wave, numpy as np
SR = 48000; C = json.load(open('work/cues.json')); N = int(C['dur'] * SR); rng = np.random.default_rng(3)
def env(n, a, r): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def place(buf, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N: buf[i:j] += sig[: j - i] * g
def lp(x, fc): X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / fc) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hp(x, fc): X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / fc) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(f, dur=0.4, b=0.55):
    n = int(dur * SR); t = np.arange(n) / SR; s = sum((b ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.3)).astype(np.float32)
music = np.zeros(N, np.float32); beat = 60 / 112; end = C.get('music_end', C['dur'])
prog = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]      # C Am F G
mel = [72, 74, 76, 79, 76, 74, 72, 67, 69, 72, 74, 72, 71, 67, 69, 71]
t = 0.0; k = 0
while t < end:
    ch = prog[(k // 8) % 4]
    for i, m in enumerate(ch): place(music, pluck(hz(m), 0.35, 0.45), t + i * 0.012, 0.25)
    if k % 2 == 0: place(music, pluck(hz(ch[0] - 12), 0.5, 0.3), t, 0.35)
    if k % 2 == 1: place(music, pluck(hz(mel[(k // 2) % 16]), 0.3, 0.6), t, 0.22)
    n = int(0.05 * SR); place(music, hp(rng.standard_normal(n).astype(np.float32), 6000) * env(n, 0.001, 0.015), t + beat / 2, 0.08)
    t += beat / 2; k += 1
fade = int(0.6 * SR); i = min(N, int(end * SR)); music[max(0, i - fade):i] *= np.linspace(1, 0, min(fade, i)); music[i:] = 0
sfx = np.zeros(N, np.float32)
def make(k):
    if k == 'pop': n = int(0.09 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * (900 - 5000 * t) * t) * env(n, 0.002, 0.03)).astype(np.float32)
    if k == 'tick': n = int(0.04 * SR); return (hp(rng.standard_normal(n).astype(np.float32), 2500) * env(n, 0.001, 0.008))
    if k == 'thud': n = int(0.35 * SR); t = np.arange(n) / SR; f = 45 + 80 * np.exp(-t * 25); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) + lp(rng.standard_normal(n).astype(np.float32), 400) * np.exp(-t * 18) * 0.5).astype(np.float32)
    if k == 'drop': n = int(0.25 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * (1400 * np.exp(-t * 14) + 300) * t) * env(n, 0.002, 0.05) * 0.6).astype(np.float32)
    if k == 'crack':
        n = int(0.6 * SR); s = np.zeros(n, np.float32)
        for j in range(14): i = int(rng.uniform(0, 0.5) * SR); m = int(0.02 * SR); s[i:i + m] += hp(rng.standard_normal(m).astype(np.float32), 1500) * env(m, 0.0005, 0.004) * rng.uniform(0.4, 1)
        return s
    if k == 'whoosh': n = int(0.45 * SR); t = np.arange(n) / SR; return (lp(rng.standard_normal(n).astype(np.float32), 1800) * np.sin(np.pi * t / t[-1]) ** 2).astype(np.float32)
    if k == 'ding':
        n = int(0.9 * SR); t = np.arange(n) / SR; return ((np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 1976 * t) + 0.3 * np.sin(2 * np.pi * 2637 * t)) * env(n, 0.002, 0.25) * 0.5).astype(np.float32)
    raise ValueError(k)
for e in C['sfx']: place(sfx, make(e['k']), e['t'], e.get('g', 1.0))
for name, x in [('music.wav', music), ('sfx.wav', sfx)]:
    x = x / max(1e-6, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
print('music.wav sfx.wav', C['dur'])
