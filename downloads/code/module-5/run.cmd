@echo off
setlocal
pushd "%~dp0" || exit /b 1
if "%~1"=="" goto usage
for %%N in (83 85 92 94 96 100) do if "%~1"=="%%N" goto run
:usage
echo Usage: run 83
echo Tasks: 83 85 92 94 96 100
exit /b 1
:run
"%~dp0MPIBegin%~1.exe"
set "rc=%errorlevel%"
popd
exit /b %rc%
