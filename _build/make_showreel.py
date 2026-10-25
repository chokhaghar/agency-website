"""Hero showreel: each before/after pair plays RAW, wipes to EDITED, plus two tracking highlights.
Output: assets/video/hero-showreel.mp4 (+ poster). Muted, 540x960, ~16 s loop."""
import subprocess, os

A = 'E:/Only For Claude/agency-website/assets'
TMP = 'E:/Only For Claude/agency-website/_build/sr'
os.makedirs(TMP, exist_ok=True)
FONT = "C\\:/Windows/Fonts/segoeuib.ttf"
ENC = ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-r', '30']


def dur(p):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p],
                                capture_output=True, text=True).stdout)


def label(txt, enable, gold=False):
    fc, bc = ('0x1A1204', '0xF5B83D') if gold else ('white', 'black@0.6')
    return (f"drawtext=fontfile='{FONT}':text='{txt}':fontsize=26:fontcolor={fc}:box=1:boxcolor={bc}:boxborderw=14:"
            f"x=(w-text_w)/2:y=h*0.14:enable='{enable}'")


def pair(name, out):
    b, a = f'{A}/ba/{name}-before.mp4', f'{A}/ba/{name}-after.mp4'
    L = min(dur(b), dur(a), 3.2)
    r, w = round(L * 0.42, 2), 0.5
    fc = (f"[0:v]trim=0:{r + w},setpts=PTS-STARTPTS,fps=30[b];"
          f"[1:v]trim={r}:{L},setpts=PTS-STARTPTS,fps=30[a];"
          f"[b][a]xfade=transition=wiperight:duration={w}:offset={r},"
          f"{label('RAW FOOTAGE', f'lt(t,{r + 0.2})')},{label('AFTER OUR EDIT', f'gte(t,{r + 0.2})', True)}[v]")
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', b, '-i', a, '-filter_complex', fc, '-map', '[v]', *ENC, out], check=True)


def highlight(src, ss, d, txt, out):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(ss), '-t', str(d), '-i', f'{A}/video/{src}.mp4',
                    '-vf', f"fps=30,{label(txt, 'gte(t,0)', True)}", *ENC, out], check=True)


parts = []
for i, step in enumerate([('pair', 'kitchen'), ('pair', 'villa'), ('hl', 'rajpal-walkthrough', 15.9, 1.8, '3D WALL TRACKING'),
                          ('pair', 'plot'), ('hl', 'villa-township', 30.4, 1.8, 'DRONE MAP PINS'), ('pair', 'portrait')]):
    out = f'{TMP}/p{i}.mp4'
    pair(step[1], out) if step[0] == 'pair' else highlight(*step[1:], out)
    parts.append(out)
with open(f'{TMP}/list.txt', 'w') as f:
    f.writelines(f"file '{p}'\n" for p in parts)
final = f'{A}/video/hero-showreel.mp4'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', f'{TMP}/list.txt', '-c', 'copy', '-movflags', '+faststart', final], check=True)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', '1.8', '-i', final, '-frames:v', '1', '-q:v', '4', f'{A}/img/hero-showreel.jpg'], check=True)
print('ok', round(dur(final), 2), 's', os.path.getsize(final) // 1024, 'KB')
