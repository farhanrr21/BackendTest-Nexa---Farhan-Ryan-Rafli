const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Fungsi untuk generate NIP dengan format YYYYxxxx
function generateNIP() {
    const year = new Date().getFullYear();  // Mendapatkan tahun saat ini
    return new Promise((resolve, reject) => {
        pool.execute('SELECT COUNT(*) AS total FROM karyawan WHERE nip LIKE ?', [`${year}%`])
            .then(([rows]) => {
                const total = rows[0].total + 1;
                const nip = `${year}${total.toString().padStart(4, '0')}`;  // Format NIP: YYYYxxxx
                resolve(nip);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

const escapeSpecialChars = (keyword) => {
    // Replace special characters used in SQL LIKE patterns
    return keyword
        .replace(/[%_\\]/g, '\\$&');  // Escape '%', '_', and '\'
};

// Menambahkan karyawan baru
// Add Karyawan function
exports.addKaryawan = async (req, res) => {
    const { nama, alamat, gend, tgl_lahir, photo } = req.body;
    const token = req.headers['x-auth-token'];

    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    try {
        // Decode and verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { username } = decoded;

        // Generate NIP based on current year and counter
        const nip = await generateNIP();

        // Escape special characters
        const escapedNama = escapeSpecialChars(nama);
        const escapedAlamat = escapeSpecialChars(alamat);

        // Validasi foto
        if (!photo || !/^data:image\/[a-zA-Z]+;base64,/.test(photo)) {
            return res.status(400).json({ message: 'Photo must be in base64 format' });
        }

        // Validate that required fields are provided
        if (!nama || !alamat || !gend || !tgl_lahir) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Get the current timestamp for insert and update fields
        const timestamp = new Date();

        // Insert karyawan ke database
        await pool.execute(
            'INSERT INTO karyawan (nip, nama, alamat, gend, tgl_lahir, status, photo, insert_at, insert_by, update_at, update_by, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nip, escapedNama, escapedAlamat, gend, tgl_lahir, 1, photo, timestamp, username, timestamp, username, 1]
        );

        return res.status(201).json({ message: 'Karyawan successfully added', nip });

    } catch (err) {
        console.error('Error adding karyawan:', err);
        return res.status(500).json({ message: 'Server error', error: err.message || err });
    }
};

// List Karyawan
exports.getKaryawanList = async (req, res) => {
    const { keyword, start = 0, count = 10 } = req.query;
    const token = req.headers['x-auth-token'];

    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    try {
        // Decode and verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Escape special characters 
        let escapedKeyword = '';
        if (keyword && keyword.trim() !== '') {
            escapedKeyword = escapeSpecialChars(keyword);
        }

        let query = 'SELECT * FROM karyawan WHERE 1=1';  

        // If a keyword is provided, search by name (nama)
        if (escapedKeyword) {
            query += ' AND nama LIKE ? LIMIT ? OFFSET ?';
            [rows] = await pool.execute(query, [`%${escapedKeyword}%`, parseInt(count), parseInt(start)]);
        }
        else {
            query += ' LIMIT ? OFFSET ?'; // If no keyword, use pagination
            [rows] = await pool.execute(query, [parseInt(count), parseInt(start)]);
        }

        // Ambil total karyawan
        let countQuery = 'SELECT COUNT(*) AS total FROM karyawan WHERE 1=1';
        if (escapedKeyword) {
            countQuery += ' AND nama LIKE ?';
        }
        const [[totalCountRow]] = await pool.execute(countQuery, [`%${escapedKeyword}%`]);

        return res.status(200).json({
            total: totalCountRow.total,  // Total karyawan
            data: rows,  // List karyawan berdasarkan search atau pagination
        });

    } catch (err) {
        console.error('Error fetching karyawan:', err);
        return res.status(500).json({ message: 'Server error', error: err.message || err });
    }
};

// Update Karyawan
exports.updateKaryawan = async (req, res) => {
    const { nip } = req.params; 
    const { nama, alamat, gend, tgl_lahir, photo } = req.body;  
    const token = req.headers['x-auth-token'];

    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    try {
        // Decode and verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { username } = decoded;  

        // Check NIP
        const [existingEmployee] = await pool.execute('SELECT * FROM karyawan WHERE nip = ?', [nip]);
        if (existingEmployee.length === 0) {
            return res.status(404).json({ message: 'Karyawan not found' });
        }

        // Escape special characters
        const escapedNama = escapeSpecialChars(nama);
        const escapedAlamat = escapeSpecialChars(alamat);

        // Validasi foto
        let base64Photo = photo;
        if (photo && !/^data:image\/[a-zA-Z]+;base64,/.test(photo)) {
            return res.status(400).json({ message: 'Photo must be a valid base64-encoded image' });
        }

        // Construct SQL query untuk update Karyawan
        const query = `
            UPDATE karyawan 
            SET 
                nama = ?, 
                alamat = ?, 
                gend = ?, 
                tgl_lahir = ?, 
                photo = ?, 
                update_at = ?, 
                update_by = ?
            WHERE nip = ?;
        `;

        // Execute the update query
        await pool.execute(query, [
            escapedNama,
            escapedAlamat,
            gend,
            tgl_lahir,
            base64Photo,
            new Date(),  
            username,  
            nip  
        ]);

        // Return updated data
        return res.status(200).json({
            message: 'Karyawan updated successfully',
            updatedData: {
                nip,
                nama,
                alamat,
                gend,
                tgl_lahir,
                photo,
            }
        });

    } catch (err) {
        console.error('Error updating karyawan:', err);
        return res.status(500).json({ message: 'Server error', error: err.message || err });
    }
};

// Nonaktifkan Karyawan
exports.deactivateKaryawan = async (req, res) => {
    const { nip } = req.params;  // Get NIP from the route parameter
    const token = req.headers['x-auth-token'];

    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    try {
        //Decode and verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { username } = decoded;  

        // Check NIP exists
        const [existingEmployee] = await pool.execute('SELECT * FROM karyawan WHERE nip = ?', [nip]);
        if (existingEmployee.length === 0) {
            return res.status(404).json({ message: 'Karyawan not found' });
        }

        // Construct SQL query untuk Nontaktifkan Karyawan
        const query = `
            UPDATE karyawan
            SET status = ?, update_at = ?, update_by = ?
            WHERE nip = ?;
        `;

        // Execute Nonaktifkan Karyawan dengan status 9
        await pool.execute(query, [
            9,  
            new Date(),  
            username,  
            nip  
        ]);

        return res.status(200).json({
            message: 'Karyawan deactivated successfully',
            nip
        });

    } catch (err) {
        console.error('Error deactivating karyawan:', err);
        return res.status(500).json({ message: 'Server error', error: err.message || err });
    }
};
