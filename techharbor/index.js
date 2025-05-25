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

// Helper: get admin by email
function getAdminId(email, cb) {
  db.query('SELECT id FROM admins WHERE email = ?', [email], (err, results) => {
    if (err || results.length === 0) return cb('Admin not found');
    cb(null, results[0].id);
  });
}

// Create or get election for admin
app.post('/create-election', (req, res) => {
  const { email, name } = req.body;
  getAdminId(email, (err, adminId) => {
    if (err) return res.status(400).send(err);
    db.query('INSERT INTO elections (admin_id, name) VALUES (?, ?)', [adminId, name], (err2, result) => {
      if (err2) return res.status(500).send('Error creating election');
      res.json({ election_id: result.insertId });
    });
  });
});

// Add voter (now requires election_id)
app.post('/add-voter', (req, res) => {
  const { voter_id, password, election_id } = req.body;
  db.query('INSERT INTO voters (voter_id, password, election_id) VALUES (?, ?, ?)', [voter_id, password, election_id], (err) => {
    if (err) return res.status(500).send('Error adding voter');
    res.send('Voter registered');
  });
});

// Add candidate (now requires election_id)
app.post('/add-candidate', (req, res) => {
  const { name, election_id } = req.body;
  db.query('INSERT INTO candidates (name, election_id) VALUES (?, ?)', [name, election_id], (err) => {
    if (err) return res.status(500).send('Error adding candidate');
    res.send('Candidate registered');
  });
});

// Get candidates for election
app.get('/candidates/:election_id', (req, res) => {
  db.query('SELECT * FROM candidates WHERE election_id = ?', [req.params.election_id], (err, results) => {
    if (err) return res.status(500).send('Error');
    res.json(results);
  });
});

// Voter login (now requires election_id)
app.post('/voter-login', (req, res) => {
  const { voter_id, password, election_id } = req.body;
  db.query('SELECT * FROM voters WHERE voter_id = ? AND password = ? AND voted = FALSE AND election_id = ?', [voter_id, password, election_id], (err, results) => {
    if (err) return res.status(500).send('Error');
    if (results.length > 0) return res.send('success');
    res.status(401).send('Invalid credentials or already voted');
  });
});

// Cast vote (now requires election_id)
app.post('/vote', (req, res) => {
  const { voter_id, candidate_id, election_id } = req.body;
  db.query('UPDATE candidates SET votes = votes + 1 WHERE id = ? AND election_id = ?', [candidate_id, election_id], (err) => {
    if (err) return res.status(500).send('Error voting');
    db.query('UPDATE voters SET voted = TRUE WHERE voter_id = ? AND election_id = ?', [voter_id, election_id], (err2) => {
      if (err2) return res.status(500).send('Error updating voter');
      res.send('Vote cast');
    });
  });
});

// Get results for election
app.get('/results/:election_id', (req, res) => {
  db.query('SELECT name, votes FROM candidates WHERE election_id = ?', [req.params.election_id], (err, results) => {
    if (err) return res.status(500).send('Error');
    res.json(results);
  });
});

// Reset election (by election_id)
app.post('/reset-election', (req, res) => {
  const { election_id } = req.body;
  db.query('UPDATE voters SET voted = FALSE WHERE election_id = ?', [election_id], err => {
    if (err) return res.status(500).send('Error resetting voters');
    db.query('UPDATE candidates SET votes = 0 WHERE election_id = ?', [election_id], err2 => {
      if (err2) return res.status(500).send('Error resetting candidates');
      res.send('Election reset');
    });
  });
});

// Delete a specific admin account by email
app.delete('/delete-admin', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send('Email is required');

  db.query('DELETE FROM admins WHERE email = ?', [email], (err, result) => {
    if (err) return res.status(500).send('Error deleting admin');
    if (result.affectedRows === 0) return res.status(404).send('Admin not found');
    res.send('Admin account deleted');
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server running on port', PORT));
