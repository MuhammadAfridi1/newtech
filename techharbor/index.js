const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// MySQL connection
const db = mysql.createConnection({
  host: 'db-mysql-nyc3-76708-do-user-22755415-0.k.db.ondigitalocean.com',
  user: 'doadmin',
  password: 'AVNS_fS2tRxdBF74SIeeweFt',
  database: 'defaultdb',
  port: 25060,
  ssl: { rejectUnauthorized: false }
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Admin registration
app.post('/register-admin', (req, res) => {
  const { email, password } = req.body;
  db.query('INSERT INTO admins (email, password) VALUES (?, ?)', [email, password], (err) => {
    if (err) return res.status(500).send('Error registering admin');
    res.send('Admin registered');
  });
});

// Admin login
app.post('/login-admin', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM admins WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) return res.status(500).send('Error');
    if (results.length > 0) return res.send('success');
    res.status(401).send('Invalid credentials');
  });
});

// Add voter
app.post('/add-voter', (req, res) => {
  const { voter_id, password } = req.body;
  db.query('INSERT INTO voters (voter_id, password) VALUES (?, ?)', [voter_id, password], (err) => {
    if (err) return res.status(500).send('Error adding voter');
    res.send('Voter registered');
  });
});

// Add candidate
app.post('/add-candidate', (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO candidates (name) VALUES (?)', [name], (err) => {
    if (err) return res.status(500).send('Error adding candidate');
    res.send('Candidate registered');
  });
});

// Get candidates
app.get('/candidates', (req, res) => {
  db.query('SELECT * FROM candidates', (err, results) => {
    if (err) return res.status(500).send('Error');
    res.json(results);
  });
});

// Voter login
app.post('/voter-login', (req, res) => {
  const { voter_id, password } = req.body;
  db.query('SELECT * FROM voters WHERE voter_id = ? AND password = ? AND voted = FALSE', [voter_id, password], (err, results) => {
    if (err) return res.status(500).send('Error');
    if (results.length > 0) return res.send('success');
    res.status(401).send('Invalid credentials or already voted');
  });
});

// Cast vote
app.post('/vote', (req, res) => {
  const { voter_id, candidate_id } = req.body;
  db.query('UPDATE candidates SET votes = votes + 1 WHERE id = ?', [candidate_id], (err) => {
    if (err) return res.status(500).send('Error voting');
    db.query('UPDATE voters SET voted = TRUE WHERE voter_id = ?', [voter_id], (err2) => {
      if (err2) return res.status(500).send('Error updating voter');
      res.send('Vote cast');
    });
  });
});

// Get results
app.get('/results', (req, res) => {
  db.query('SELECT name, votes FROM candidates', (err, results) => {
    if (err) return res.status(500).send('Error');
    res.json(results);
  });
});

// reset elections
app.post('/reset-election', (req, res) => {
  db.query('UPDATE voters SET voted = FALSE', err => {
    if (err) return res.status(500).send('Error resetting voters');
    db.query('UPDATE candidates SET votes = 0', err2 => {
      if (err2) return res.status(500).send('Error resetting candidates');
      res.send('Election reset');
    });
  });
});

// Delete admin account
app.delete('/delete-admin', (req, res) => {
  db.query('DELETE FROM admins', err => {
    if (err) return res.status(500).send('Error deleting admin');
    res.send('Admin account(s) deleted');
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server running on port', PORT));
