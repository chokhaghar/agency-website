@echo off
REM Video ko is file par drag-and-drop karo. Website ke liye chhota (540p, ~3-8 MB) MP4 + poster JPG bana dega.
if "%~1"=="" (
  echo Video file ko is .bat file ke upar drag karke chhodo.
  pause
  exit /b
)
:loop
if "%~1"=="" goto done
echo.
echo Processing: %~nx1
ffmpeg -y -v error -stats -i "%~1" -vf "fps=30,scale='if(gte(ih,iw),540,-2)':'if(gte(ih,iw),-2,540)':flags=lanczos" -c:v libx264 -preset slow -crf 27 -maxrate 1400k -bufsize 2800k -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k -ac 2 "%~dpn1_web.mp4"
ffmpeg -y -v error -ss 1 -i "%~dpn1_web.mp4" -frames:v 1 -q:v 4 "%~dpn1_poster.jpg"
echo Ban gaya: %~n1_web.mp4  aur  %~n1_poster.jpg
shift
goto loop
:done
echo.
echo Sab ho gaya! Ab admin panel mein _web.mp4 file upload karo.
pause
