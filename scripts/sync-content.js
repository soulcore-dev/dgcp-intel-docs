// scripts/sync-content.js
// Run: node scripts/sync-content.js
// Sincroniza JANUS_CORE/CORTEX/PROYECTOS/DGCP_INTEL -> content/dgcp-intel

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', '..', 'CORTEX', 'PROYECTOS', 'DGCP_INTEL')
const DST = path.join(__dirname, '..', 'content', 'dgcp-intel')

function syncDir(srcDir, dstDir) {
  if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.join(srcDir, file)
    const dstFile = path.join(dstDir, file)
    const stat = fs.statSync(srcFile)
    if (stat.isDirectory()) {
      syncDir(srcFile, dstFile)
    } else if (file.endsWith('.md')) {
      fs.copyFileSync(srcFile, dstFile)
      console.log(`  synced: ${path.relative(SRC, srcFile)}`)
    }
  }
}

console.log('Syncing DGCP INTEL content...')
syncDir(SRC, DST)
console.log('Done.')
