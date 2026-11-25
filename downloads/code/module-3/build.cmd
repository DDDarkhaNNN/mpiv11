@echo off
setlocal
pushd "%~dp0" || exit /b 1
if not defined MSMPI_INC goto missing
if not defined MSMPI_LIB64 goto missing
for %%N in (48 51 54 57 59 62 64 67 69) do (
    g++ -std=c++17 -Wall -Wextra -pedantic -O2 -static -s -DMSMPI_NO_SAL -I"%MSMPI_INC%." MPIBegin%%N.cpp "%MSMPI_LIB64%msmpi.lib" -o MPIBegin%%N.exe
    if errorlevel 1 exit /b 1
)
popd
exit /b 0
:missing
echo MPI SDK is required to compile these programs.
exit /b 1

