"""Builds web-optimised portfolio reels, posters and synced before/after clips for the site."""
import subprocess, os, sys

ROOT = 'E:/Only For Claude'
OUT = ROOT + '/agency-website/assets'
RP = ROOT + '/21 Villa Township/Rajpal House And Rajesh ji Face Shoot'
HLG = ("zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0,"
       "zscale=t=bt709:m=bt709:r=tv,format=yuv420p,")
V916 = "scale=540:960:force_original_aspect_ratio=increase:flags=lanczos,crop=540:960"

# id, source, poster time
REELS = [
    ('balaji-brand-ad', ROOT + '/Mahendra Ji Balaji Edit/Output/Shree_Bala_Ji_Homes_Brand_Ad_v2.mp4', 9.0),
    ('balaji-before-after', ROOT + '/Mahendra Ji Balaji Edit/Output/Before_After_Shree_Bala_Ji_Brand_Ad.mp4', 6.0),
    ('rajpal-walkthrough', RP + '/Rajpal_House_Reel_Final.mp4', 14.2),
    ('villa-township', ROOT + '/21 Villa Township/output/ChokhaGhar_Reel_Pro_v4.mp4', 8.0),
    ('villa-brandrise', ROOT + '/21 Villa Township/output/21_Villa_Township_BrandRise.mp4', 20.0),
    ('plot-reel', ROOT + '/Plots/output/Park_Facing_Pacific_Mall_Mansarovar_FINAL.mp4', 6.0),
    ('sarpanch-reel', ROOT + '/Sarpanch/output/Kalyan_Ji_Bhugasra_Reel_FINAL_v3.mp4', 12.0),
    ('chokhaghar-reel', ROOT + '/output/ChokhaGhar_Reel_Pro_v4.mp4', 5.0),
]

# id, raw clip, raw in, raw pre-filter (crop/zoom), hlg?, edited reel, edited in, duration
BA = [
    ('kitchen', RP + '/Seprate/IMG_2292.MOV', 1.6, '', True,
     RP + '/Rajpal_House_Reel_Final.mp4', 0.555 + 0.7695 * 17, 0.7695 * 3),
    ('bedroom', RP + '/Seprate/IMG_2291.MOV', 2.2, '', True,
     RP + '/Rajpal_House_Reel_Final.mp4', 0.555 + 0.7695 * 20, 0.7695 * 3),
    ('villa', ROOT + '/Mahendra Ji Balaji Edit/Clips/IMG_4821.MOV', 0.4, '', True,
     ROOT + '/Mahendra Ji Balaji Edit/Output/Shree_Bala_Ji_Homes_Brand_Ad_v2.mp4', 12.98 + 0.2, 3.3),
    ('plot', ROOT + '/Plots/IMG_8709.MP4', 2.0, '', True,
     ROOT + '/Plots/output/Park_Facing_Pacific_Mall_Mansarovar_FINAL.mp4', 2.0, 4.0),
    ('portrait', ROOT + '/Sarpanch/Clips/IMG_6675.MOV', 0.15,
     "crop=iw/1.12:ih/1.12:x='min(max(0.42*iw-iw/1.12/2,0),iw-iw/1.12)':y='min(max(0.55*ih-ih/1.12/2,0),ih-ih/1.12)',", False,
     ROOT + '/Sarpanch/output/Kalyan_Ji_Bhugasra_Reel_FINAL_v3.mp4', 1.75, 3.2),
]

ENC = ['-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']


def run(a):
    print(' '.join(a[-1:]), flush=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error'] + a, check=True)


only = sys.argv[1:]
for rid, src, pt in REELS:
    if only and rid not in only:
        continue
    run(['-i', src, '-vf', f'fps=30,{V916}', *ENC, '-crf', '27', '-maxrate', '1400k', '-bufsize', '2800k',
         '-c:a', 'aac', '-b:a', '96k', '-ac', '2', f'{OUT}/video/{rid}.mp4'])
    run(['-ss', str(pt), '-i', src, '-frames:v', '1', '-vf', V916, '-q:v', '4', f'{OUT}/img/{rid}.jpg'])

for bid, raw, rin, pre, hlg, ed, ein, dur in BA:
    if only and bid not in only:
        continue
    run(['-ss', f'{rin:.3f}', '-t', f'{dur:.3f}', '-i', raw, '-vf', f"{HLG if hlg else ''}{pre}fps=30,{V916}",
         '-an', *ENC, '-crf', '26', f'{OUT}/ba/{bid}-before.mp4'])
    run(['-ss', f'{ein:.3f}', '-t', f'{dur:.3f}', '-i', ed, '-vf', f'fps=30,{V916}',
         '-an', *ENC, '-crf', '26', f'{OUT}/ba/{bid}-after.mp4'])
    for side in ('before', 'after'):
        run(['-ss', f'{dur/2:.2f}', '-i', f'{OUT}/ba/{bid}-{side}.mp4', '-frames:v', '1', '-q:v', '4',
             f'{OUT}/ba/{bid}-{side}.jpg'])
