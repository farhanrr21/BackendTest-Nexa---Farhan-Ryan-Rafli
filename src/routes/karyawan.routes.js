const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

const {
    addKaryawan,
    getKaryawanList,
    updateKaryawan,
    deactivateKaryawan,
} = require('../controllers/karyawan.controller');

// Semua route butuh token
router.post('/karyawan', authMiddleware, addKaryawan);
router.get('/karyawan', authMiddleware, getKaryawanList);
router.put('/karyawan/:nip', authMiddleware, updateKaryawan);
router.put('/karyawan/deactivate/:nip', authMiddleware, deactivateKaryawan);

module.exports = router;
