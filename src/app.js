const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3306;

// Middleware
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth.routes');
const karyawanRoutes = require('./routes/karyawan.routes');

app.use('/api', authRoutes);
app.use('/api', karyawanRoutes);

app.get('/', (req, res) => {
    res.send('Backend Nexa is running...');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
