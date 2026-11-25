@echo off
setlocal
pushd "%~dp0" || exit /b 1
if "%~1"=="" goto usage
for %%N in (30 34 37 40 43 45 71 75 77 79 80) do if "%~1"=="%%N" goto run
:usage
echo Usage: run 30
echo Tasks: 30 34 37 40 43 45 71 75 77 79 80
exit /b 1
:run
"%~dp0MPIBegin%~1.exe"
set "rc=%errorlevel%"
popd
exit /b %rc%
