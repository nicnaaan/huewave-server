// index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ColorThief = require('color-thief-node');

const app = express();
// Railway 會指定 PORT，若本地測試則用 3000
const PORT = process.env.PORT || 3000;

// ================== 靜態檔案 ==================
app.use(express.static(path.join(__dirname, 'public')));

// ================== 上傳設定 ==================
// ⚠️ Railway 的檔案系統是暫時的，部署後重啟就會清空 uploads
// 這裡仍可用於分析圖片，但不要依賴檔案永久存在
const upload = multer({
  dest: path.join(__dirname, 'uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只接受圖片檔'), false);
  }
});

// ================== 工具函式 ==================
function rgbToHex([r, g, b]) {
  return (
    '#' +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

// ================== API: 上傳並分析 ==================
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '沒有收到檔案' });

    const filePath = req.file.path;
    const palette = await ColorThief.getPalette(filePath, 5);
    const hexes = palette.map(rgbToHex);

    // 上傳後就刪掉檔案，避免佔空間
    fs.unlink(filePath, () => {});

    res.json({ rgb: palette, hex: hexes });
  } catch (err) {
    console.error('❌ 錯誤：', err);
    res.status(500).json({ error: err.message || '分析失敗' });
  }
});

// ================== 預設首頁 ==================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================== 啟動伺服器 ==================
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});