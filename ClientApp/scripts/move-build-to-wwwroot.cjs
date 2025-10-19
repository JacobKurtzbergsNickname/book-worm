const path = require('path');
const fse = require('fs-extra');

const buildDir = path.resolve(__dirname, '../dist');
const targetDir = path.resolve(__dirname, '../../wwwroot');

async function moveBuild() {
    try {
        await fse.emptyDir(targetDir);
        console.log('✅ Emptied wwwroot');
        await fse.copy(buildDir, targetDir);
        console.log('✅ React build moved to wwwroot');
        await fse.remove(buildDir);
        console.log('✅ Cleaned up dist folder');
    } catch (err) {
        console.error('❌ Failed to move build to wwwroot:', err);
        process.exit(1);
    }
}

moveBuild();
