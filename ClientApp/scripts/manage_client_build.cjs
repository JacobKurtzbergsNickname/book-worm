// Cross-platform client build manager (refactored for readability)
// Usage: node manage_client_build.cjs [projectDir]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync, execSync } = require('child_process');

function log(...args) { console.log(...args); }
function err(...args) { console.error(...args); }

function hashFile(filePath) {
  try {
    const bytes = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(bytes).digest('hex');
  } catch (e) {
    return '';
  }
}

function runCommand(argv, cwd) {
  const opts = { cwd, stdio: 'inherit', shell: process.platform === 'win32' };
  if (!Array.isArray(argv) || argv.length === 0) throw new Error('runCommand expects a non-empty array');
  const res = spawnSync(argv[0], argv.slice(1), opts);
  return typeof res.status === 'number' ? res.status : 1;
}

function removeDirRecursive(target) {
  try {
    if (!fs.existsSync(target)) return true;
    if (typeof fs.rmSync === 'function') {
      fs.rmSync(target, { recursive: true, force: true });
    } else {
      const rimraf = require('rimraf');
      rimraf.sync(target);
    }
    return true;
  } catch (e) {
    err('Initial removal failed:', e && e.message ? e.message : e);
    return false;
  }
}

function attemptWindowsOwnership(target) {
  try {
    log('Attempting Windows takeown/icacls on', target);
    execSync(`takeown /f "${target}" /r /d Y`, { stdio: 'inherit' });
    const user = process.env.USERNAME || 'Everyone';
    execSync(`icacls "${target}" /grant ${user}:(F) /T`, { stdio: 'inherit' });
    return true;
  } catch (e) {
    err('takeown/icacls failed:', e && e.message ? e.message : e);
    return false;
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyDirRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
  return true;
}

function moveDistToWwwroot(projectDir) {
  const dist = path.join(projectDir, 'dist');
  const wwwroot = path.join(path.dirname(projectDir), 'wwwroot');

  if (!fs.existsSync(dist)) {
    log('No dist folder produced by build; skipping move.');
    return;
  }

  log('Updating wwwroot from dist...');
  removeDirRecursive(wwwroot);

  try {
    fs.renameSync(dist, wwwroot);
    log('Moved dist to wwwroot');
  } catch (e) {
    log('Rename failed, copying instead:', e && e.message ? e.message : e);
    copyDirRecursive(dist, wwwroot);
    removeDirRecursive(dist);
  }
}

function main() {
  try {
    const argv = process.argv.slice(2);
    const projectDir = argv[0] ? path.resolve(argv[0]) : path.resolve(__dirname, '..');
    log('Client project dir:', projectDir);

    if (!fs.existsSync(projectDir)) {
      log('Client project directory not found:', projectDir, '\nSkipping client build (no ClientApp).');
      return 0;
    }

    const lockPath = path.join(projectDir, 'package-lock.json');
    const pkgPath = path.join(projectDir, 'package.json');
    const sourcePath = fs.existsSync(lockPath) ? lockPath : (fs.existsSync(pkgPath) ? pkgPath : null);

    const nodeModules = path.join(projectDir, 'node_modules');
    const marker = path.join(nodeModules, '.install_hash');

    const currentHash = sourcePath ? hashFile(sourcePath) : '';
    const markerHash = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8').trim() : '';

    let needInstall = false;
    if (!fs.existsSync(nodeModules)) {
      log('node_modules missing -> will install');
      needInstall = true;
    } else if (currentHash && currentHash !== markerHash) {
      log('Package file changed -> will reinstall (lock/hash mismatch)');
      needInstall = true;
    } else {
      log('node_modules up-to-date, skipping install');
    }

    if (needInstall) {
      log('Preparing to (re)install node modules...');
      if (fs.existsSync(nodeModules)) {
        log('Attempting to remove node_modules...');
        if (!removeDirRecursive(nodeModules)) {
          if (process.platform === 'win32') {
            attemptWindowsOwnership(nodeModules);
            if (!removeDirRecursive(nodeModules)) {
              err('Failed to remove node_modules after takeown/icacls.');
              return 1;
            }
          } else {
            err('Failed to remove node_modules. Ensure no processes are locking files and try again.');
            return 1;
          }
        }
      }

      const useCi = fs.existsSync(lockPath);
      const installCmd = useCi ? ['npm', 'ci'] : ['npm', 'install'];
      log('Running', installCmd.join(' '));
      const installStatus = runCommand(installCmd, projectDir);
      if (installStatus !== 0) {
        err('npm install failed with code', installStatus);
        return installStatus || 1;
      }

      try {
        fs.mkdirSync(nodeModules, { recursive: true });
        if (currentHash) fs.writeFileSync(marker, currentHash, 'utf8');
        else if (fs.existsSync(marker)) fs.unlinkSync(marker);
      } catch (e) {
        log('Warning: failed to write marker:', e && e.message ? e.message : e);
      }
    }

    log('Running npm run build');
    const buildStatus = runCommand(['npm', 'run', 'build'], projectDir);
    if (buildStatus !== 0) {
      err('npm run build failed with code', buildStatus);
      return buildStatus || 1;
    }

    moveDistToWwwroot(projectDir);

    log('Client build steps completed successfully.');
    return 0;
  } catch (e) {
    err('Unexpected error:', e && e.message ? e.message : e);
    return 1;
  }
}

process.exit(main());
