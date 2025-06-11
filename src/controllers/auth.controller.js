const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

// Fungsi untuk mendekripsi password menggunakan AES (bagian sedikit mumet :P)
function encryptPassword(password) {
    const key = Buffer.from('nexatest', 'utf8'); // 8 bytes
    const keyPadded = Buffer.alloc(16); // pad to 16 bytes (AES-128)
    key.copy(keyPadded); // copy 'nexatest' into keyPadded

    const iv = Buffer.alloc(16, 0); // 16-byte IV, semua nol

    const cipher = crypto.createCipheriv('aes-128-cbc', keyPadded, iv);
    let encrypted = cipher.update(password, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;
}

// Login Controller
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Ambil data admin berdasarkan username
        const [rows] = await pool.execute('SELECT * FROM admin WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = rows[0];

        const encryptedPassword = encryptPassword(password);

        // Verifikasi password
        if (!encryptedPassword.equals(user.password)) {

            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const payload = {
            username: username,
            password: encryptedPassword,  // Store the encrypted password inside the payload
            timestamp: new Date().getTime()
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        const expiredAt = new Date(Date.now() + 60 * 60 * 1000);

        // Simpan token di table admin_token
        await pool.execute(
            'INSERT INTO admin_token (id_admin, token, expired_at) VALUES (?, ?, ?)',
            [user.id, token, expiredAt]
        );

        // Kirim response token
        return res.json({ token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};
