#!/usr/bin/env bash
# Junta quadros + mix -> mp4, depois QA.   bash finish.sh slug     (FRAMES=frames_cap por padrão)
set -e; S="${1:-short}"; F="out/$S.mp4"; mkdir -p out
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7" -ar 48000 -ac 2 mix.wav
ffmpeg -v error -y -framerate 30 -i ${FRAMES:-frames_cap}/f%04d.jpg -i mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart "$F"
ffprobe -v error -show_entries format=duration,size -of compact "$F"
echo "--- QA (vazio = sem trechos pretos/congelados)"; ffmpeg -i "$F" -vf "freezedetect=n=0.0005:d=0.6,blackdetect=d=0.05" -an -f null - 2>&1 | grep -E "freeze_start|black_start" || true
ffmpeg -i "$F" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
ffmpeg -v error -y -i "$F" -vf "fps=2,scale=180:-1,tile=10x5" -frames:v 1 out/qa_sheet.jpg
# versão leve para o YouTube via Make (plano grátis aceita arquivos pequenos): alvo < 5 MB
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F"); KB=$(python3 -c "print(max(300, int(4.4*8*1024/$D - 100)))")
ffmpeg -v error -y -i "$F" -c:v libx264 -preset slow -b:v ${KB}k -maxrate $((KB*12/10))k -bufsize $((KB*2))k -vf scale=720:1280 -c:a aac -b:a 96k -movflags +faststart "out/$S-yt.mp4"
ls -la "$F" "out/$S-yt.mp4"
