@echo off
setlocal
pushd "%~dp0" || exit /b 1
if "%~1"=="" goto usage
for %%N in (48 51 54 57 59 62 64 67 69) do if "%~1"=="%%N" goto run
:usage
echo Usage: run 48
echo Tasks: 48 51 54 57 59 62 64 67 69
exit /b 1
:run
"%~dp0MPIBegin%~1.exe"
set "rc=%errorlevel%"
popd
exit /b %rc%
