const fsSync = require('fs')

try {
fsSync.rmSync('dist', { recursive: true })
} catch (err) {}
fsSync.mkdirSync('dist', { recursive: true })
fsSync.cpSync('js', 'dist/js', { recursive: true })
fsSync.cpSync('assets', 'dist/assets', { recursive: true })
fsSync.cpSync('index.css', 'dist/index.css')
fsSync.cpSync('index.html', 'dist/index.html')
