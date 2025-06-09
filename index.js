require('dotenv').config(); // 🔐 Charge les variables d’environnement

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔐 Middleware de protection avec token
function checkAuth(req, res, next) {
  const token = req.query.token;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).send('🔐 Accès refusé');
  }

  next();
}

// 📤 Fonction export Excel
function exportToExcel(jsonPath, sheetName, excelPath) {
  if (!fs.existsSync(jsonPath)) return;
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const ws = XLSX.utils.json_to_sheet(jsonData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, excelPath);
}

// 📝 Formulaire principal
app.post('/api/formulaire', (req, res) => {
  const { nom, prenom, email, instagram, pays, cause } = req.body;

  if (!nom || !prenom || !email || !pays || !cause) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  const newEntry = {
    nom,
    prenom,
    email,
    instagram,
    pays,
    cause,
    date: new Date().toISOString()
  };

  const filePath = path.join(__dirname, 'data', 'participations.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let participations = [];
  if (fs.existsSync(filePath)) {
    participations = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
  }

  participations.push(newEntry);
  fs.writeFileSync(filePath, JSON.stringify(participations, null, 2));

  exportToExcel(filePath, 'Participations', path.join(__dirname, 'data', 'formulaire.xlsx'));

  console.log('✅ Participation enregistrée :', newEntry);
  res.status(200).json({ success: true });
});

// 📩 Newsletter
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  const filePath = path.join(__dirname, 'data', 'newsletter.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let emails = [];
  if (fs.existsSync(filePath)) {
    emails = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
  }

  const alreadyExists = emails.some(entry => entry.email === email);
  if (alreadyExists) {
    return res.status(409).json({ error: 'Déjà inscrit' });
  }

  emails.push({ email, date: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(emails, null, 2));

  exportToExcel(filePath, 'Newsletter', path.join(__dirname, 'data', 'newsletter.xlsx'));

  console.log('📬 Newsletter enregistrée :', email);
  res.status(200).json({ success: true });
});

// 📁 Export Excel sécurisé
app.get('/api/export/formulaire', checkAuth, (req, res) => {
  const exportPath = path.join(__dirname, 'data', 'formulaire.xlsx');
  if (!fs.existsSync(exportPath)) {
    return res.status(404).send('Aucun fichier Excel généré.');
  }
  res.download(exportPath, 'formulaire.xlsx');
});

app.get('/api/export/newsletter', checkAuth, (req, res) => {
  const exportPath = path.join(__dirname, 'data', 'newsletter.xlsx');
  if (!fs.existsSync(exportPath)) {
    return res.status(404).send('Aucun fichier Excel généré.');
  }
  res.download(exportPath, 'newsletter.xlsx');
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌍 Serveur en ligne sur http://localhost:${PORT}`);
});

