const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure the public folder is served correctly for all static files
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('./attendance.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      }
    });

    // Add a new column to the attendance table for status
    const addStatusColumn = `ALTER TABLE attendance ADD COLUMN status TEXT DEFAULT 'Absent';`;
    db.run(addStatusColumn, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding status column:', err);
      }
    });
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Handle form submission
app.post('/submit', (req, res) => {
  const { studentName } = req.body;
  if (!studentName) {
    return res.status(400).send('Student name is required.');
  }

  db.run('INSERT INTO attendance (student_name) VALUES (?)', [studentName], function(err) {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Failed to save attendance.');
    }
    res.send('Attendance saved successfully!');
  });
});

// Route to update attendance status
app.post('/update-status', (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).send('ID and status are required.');
  }

  db.run('UPDATE attendance SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      console.error('Error updating status:', err);
      return res.status(500).send('Failed to update status.');
    }
    res.send('Status updated successfully!');
  });
});

// Route to display attendance data in a table with enhanced design
app.get('/attendance', (req, res) => {
  db.all('SELECT * FROM attendance', [], (err, rows) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Failed to fetch attendance data.');
    }

    let tableRows = rows.map(row => {
      const date = new Date(row.timestamp).toLocaleDateString();
      const time = new Date(row.timestamp).toLocaleTimeString();
      return `
        <tr>
          <td>${row.id}</td>
          <td>${row.student_name}</td>
          <td>${date}</td>
          <td>${time}</td>
          <td>
            <select onchange="updateStatus(${row.id}, this.value)">
              <option value="Present" ${row.status === 'Present' ? 'selected' : ''}>Present</option>
              <option value="Absent" ${row.status === 'Absent' ? 'selected' : ''}>Absent</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Attendance Records</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-image: url('https://example.com/school-image.jpg'); /* Replace with a real school image URL */
            background-size: cover;
            color: #333;
          }
          h1 {
            text-align: center;
            color: #4CAF50;
            margin-top: 20px;
          }
          table {
            width: 80%;
            margin: 20px auto;
            border-collapse: collapse;
            background-color: rgba(255, 255, 255, 0.9);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #4CAF50;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          tr:hover {
            background-color: #ddd;
          }
        </style>
        <script>
          async function updateStatus(id, status) {
            try {
              const response = await fetch('/update-status', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, status })
              });
              const message = await response.text();
              alert(message);
            } catch (error) {
              console.error('Error updating status:', error);
              alert('Failed to update status.');
            }
          }
        </script>
      </head>
      <body>
        <h1>Attendance Records</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.send(html);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});