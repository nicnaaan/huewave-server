// index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ColorThief = require('color-thief-node');

const app = express();
// 在雲端要用 process.env.PORT，否則本地用 3000
const PORT = process.env.PORT || 3000;

// 靜態資源
app.use(express.static(path.join(__dirname, 'public')));

// 上傳設定（注意：Railway 的檔案系統是 ephemeral）
const upload = multer({
  dest: path.join(__dirname, 'uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只接受圖片檔'), false);
  }
});

function rgbToHex([r,g,b]) {
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '沒有收到檔案' });
    const filePath = req.file.path;
    const palette = await ColorThief.getPalette(filePath, 5);
    const hexes = palette.map(rgbToHex);
    fs.unlink(filePath, () => {});
    res.json({ rgb: palette, hex: hexes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || '分析失敗' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});