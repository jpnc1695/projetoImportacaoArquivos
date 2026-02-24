const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const app = express();

app.use(fileUpload());
app.use(express.static('public'));

// Endpoint para upload
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.pdf) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const pdf = req.files.pdf;
  const uploadPath = path.join(__dirname, 'uploads', pdf.name);

  pdf.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      success: true, 
      message: 'Arquivo salvo com sucesso',
      path: `/uploads/${pdf.name}`
    });
  });
});

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});