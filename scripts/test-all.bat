@echo off
for /d %%G in (../src/*) do @(
    if exist "..\src\%%~nxG\test" (
        (cd "..\src\%%~nxG" && npm i -D && npm t) || (@echo ERRORS in %%~nxG && exit /b !ERRORLEVEL!)
        cd ..
    ) else (
        @echo %%~nxG doesn't have any test, skipping
    )
)
