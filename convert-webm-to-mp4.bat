@echo off
REM ====================================================================
REM WebM to MP4 Converter
REM ====================================================================
REM Usage: convert-webm-to-mp4.bat input.webm [fps] [width] [height]
REM
REM Examples:
REM   convert-webm-to-mp4.bat video.webm
REM   convert-webm-to-mp4.bat video.webm 50
REM   convert-webm-to-mp4.bat video.webm 50 1920 1080
REM ====================================================================

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: convert-webm-to-mp4.bat input.webm [fps] [width] [height]
    echo Examples:
    echo   convert-webm-to-mp4.bat video.webm
    echo   convert-webm-to-mp4.bat video.webm 50 1920 1080
    exit /b 1
)

set INPUT=%~1
set FPS=%~2
set WIDTH=%~3
set HEIGHT=%~4

if not exist "%INPUT%" (
    echo [ERROR] File not found: %INPUT%
    exit /b 1
)

if "%FPS%"=="" set FPS=50

REM Output = input.mp4
set OUTPUT=%~dpn1.mp4

echo Converting: %INPUT%
echo Target: %FPS% FPS

REM Get source dimensions
for /f "tokens=*" %%i in ('ffprobe -v error -select_streams v:0 -show_entries stream^=width -of default^=noprint_wrappers^=1:nokey^=1 "%INPUT%"') do set SRC_WIDTH=%%i
for /f "tokens=*" %%i in ('ffprobe -v error -select_streams v:0 -show_entries stream^=height -of default^=noprint_wrappers^=1:nokey^=1 "%INPUT%"') do set SRC_HEIGHT=%%i

if "%WIDTH%"=="" set WIDTH=%SRC_WIDTH%
if "%HEIGHT%"=="" set HEIGHT=%SRC_HEIGHT%

echo Resolution: %WIDTH%x%HEIGHT%
echo.

REM Build filter chain
set FILTERS=

REM Scale if needed
if not "%WIDTH%"=="%SRC_WIDTH%" (
    set FILTERS=!FILTERS!scale=%WIDTH%:%HEIGHT%:flags=lanczos,
)

REM Motion interpolation for smoothness
set FILTERS=!FILTERS!minterpolate=fps=%FPS%:mi_mode=mci:mc_mode=aobmc:me_mode=bidir,

REM Exact FPS
set FILTERS=!FILTERS!fps=%FPS%,

REM Light sharpening + denoising
set FILTERS=!FILTERS!unsharp=3:3:0.5:3:3:0.3,hqdn3d=1:1:4:4

echo Converting...
echo.

ffmpeg -i "%INPUT%" ^
    -vf "%FILTERS%" ^
    -c:v libx264 ^
    -preset medium ^
    -crf 18 ^
    -profile:v high ^
    -pix_fmt yuv420p ^
    -movflags +faststart ^
    -y ^
    "%OUTPUT%"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Done: %OUTPUT%
    echo.
    ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 "%OUTPUT%"
    echo.
    for %%F in ("%OUTPUT%") do echo Size: %%~zF bytes
) else (
    echo [ERROR] Conversion failed
    exit /b 1
)

endlocal
