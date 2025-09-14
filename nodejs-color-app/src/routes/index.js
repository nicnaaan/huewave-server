function setRoutes(app) {
  const multer = require('multer');
  const ColorThief = require('colorthief');

  const upload = multer({ dest: 'uploads/' });

  app.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const colorThief = new ColorThief();
    const img = new Image();
    img.src = req.file.path;

    img.onload = () => {
      const dominantColor = colorThief.getColor(img);
      const palette = colorThief.getPalette(img, 6);
      res.json({
        rgb: [dominantColor, ...palette],
        hex: palette.map(color => `#${color.map(c => c.toString(16).padStart(2, '0')).join('')}`)
      });
    };

    img.onerror = () => {
      res.status(500).json({ error: 'Error processing image' });
    };
}

module.exports = setRoutes;