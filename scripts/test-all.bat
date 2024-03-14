@echo off

set "SCRIPT_DIR=%~dp0"

for /d %%G in (%SCRIPT_DIR%/../src/*) do @(
    if exist "%SCRIPT_DIR%\..\src\%%~nxG\test" (
        (cd "%SCRIPT_DIR%\..\src\%%~nxG" && npm i -D && npm t) || (@echo ERRORS in %%~nxG && exit /b !ERRORLEVEL!)
        cd ..
    ) else (
        @echo %%~nxG doesn't have any test, skipping
    )
)
