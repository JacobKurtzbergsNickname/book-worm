#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/ClientApp"
node scripts/manage_client_build.cjs "$(pwd)"
cd "$(dirname "$0")"
echo "Starting dotnet run..."
dotnet run --project "BookWorm.csproj"
