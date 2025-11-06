@echo off
setlocal

REM run-dev.cmd - prefer this modern .cmd script for Windows developers
REM It runs the client build then starts the backend.

pushd "%~dp0\ClientApp"
node scripts\manage_client_build.cjs "%CD%"
if %ERRORLEVEL% NEQ 0 (
  echo Client build failed. Inspect the output above. Exiting.
  popd
  endlocal
  exit /b %ERRORLEVEL%
)
popd

echo Starting dotnet run...
dotnet run --project "%~dp0\KirbysBooks.csproj"

endlocal

