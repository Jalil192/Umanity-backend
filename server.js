const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/illumine', async (req, res) => {
  const { nom, prenom, email, instagram, pays, cause } = req.body;
  const timestamp = new Date().toISOString();
  const { error } = await supabase.from('participants').insert([{ nom, prenom, email, instagram, pays, cause, timestamp }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Participation enregistrée ✅" });
});

app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  const timestamp = new Date().toISOString();
  const { error } = await supabase.from('newsletter').insert([{ email, timestamp }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Email newsletter enregistré ✅" });
});

app.post('/api/stats', async (req, res) => {
  const { causeCount, countryMap } = req.body;
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from('stats').upsert([{ id: 1, causeCount: JSON.stringify(causeCount), countryMap: JSON.stringify(countryMap), updatedAt }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Stats sauvegardées ✅" });
});

app.get('/admin/data', async (req, res) => {
  try {
    const { data: participants, error: err1 } = await supabase.from('participants').select('*');
    const { data: newsletter, error: err2 } = await supabase.from('newsletter').select('*');
    const { data: stats, error: err3 } = await supabase.from('stats').select('*').eq('id', 1).single();
    if (err1 || err2 || err3) throw new Error(err1?.message || err2?.message || err3?.message);
    res.json({
      participants: participants || [],
      newsletter: newsletter || [],
      stats: stats ? {
        updatedAt: stats.updatedAt,
        causeCount: stats.causeCount ? JSON.parse(stats.causeCount) : {},
        countryMap: stats.countryMap ? JSON.parse(stats.countryMap) : {}
      } : {}
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur de récupération admin" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
