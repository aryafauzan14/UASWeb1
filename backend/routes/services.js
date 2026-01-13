const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all services
router.get('/', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM services');
    res.json(rows);
});

// CREATE new service (TAMBAHKAN INI)
router.post('/', async (req, res) => {
    const { title, description } = req.body;
    
    try {
        const [result] = await db.query(
            'INSERT INTO services (title, description) VALUES (?, ?)',
            [title, description]
        );
        
        res.json({ 
            success: true, 
            id: result.insertId,
            message: 'Data berhasil ditambahkan'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Gagal menambah data' 
        });
    }
});

// UPDATE service
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    
    await db.query(
        'UPDATE services SET title = ?, description = ? WHERE id = ?',
        [title, description, id]
    );
    
    res.json({ success: true });
});

// DELETE service
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    await db.query('DELETE FROM services WHERE id = ?', [id]);
    
    res.json({ success: true });
});

module.exports = router;