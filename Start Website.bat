@echo off
cd /d "%~dp0"
echo Website aur Admin panel start ho raha hai...
python tools\server.py 5500 --open
pause
