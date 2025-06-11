const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

// Controllers (belum kita buat, kita buat struktur dulu)
const {
    addKaryawan,
    getKaryawanList,
    updateKaryawan,
    deactivateKaryawan,
} = require('../controllers/karyawan.controller');

// Semua route butuh token
router.post('/karyawan', authMiddleware, addKaryawan);
router.get('/karyawan', authMiddleware, getKaryawanList);
router.put('/karyawan', authMiddleware, updateKaryawan);
router.delete('/karyawan', authMiddleware, deactivateKaryawan);

module.exports = router;
