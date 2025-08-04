const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const con = require('../connection');

const app = express();
const PORT = 3002;

const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Route trả về file HTML tĩnh cho danh sách category
app.get('/category', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'category.html'));
});

// API trả về dữ liệu category dạng JSON (cho JS phía client fetch)
app.get('/api/category', (req, res) => {
    con.query('SELECT * FROM category', (err, categories) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(categories);
    });
});

app.get('/add_category', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_category.html'));
});

//API thêm mới category
app.post('/add_category', (req, res) => {
    const { name, description, parent_id } = req.body;
    const now = new Date();
    const sql = `
        INSERT INTO category (name, description, created_at, updated_at, parent_id)
        VALUES (?, ?, ?, ?, ?)
    `;
    con.query(sql, [name, description, now, now, parent_id || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

// app.get('/update_category', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'update_category.html'));
// });

app.get('/api/category/:id', (req, res) => {
    const id = req.params.id;
    con.query('SELECT * FROM category WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

app.get('/category/update/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'update_category.html'));
});

//API sửa category
app.put('/api/category/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, parent_id } = req.body;
    const now = new Date();
    // Xử lý parent_id rỗng
    const parentIdValue = parent_id && parent_id !== '' ? parent_id : null;
    const sql = `
        UPDATE category SET name=?, description=?, updated_at=?, parent_id=?
        WHERE id=?
    `;
    con.query(sql, [name, description, now, parentIdValue, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

//API xoá category
app.delete('/api/category/:id/delete', (req, res) => {
    const id = req.params.id;
    // Set parent_id = null cho các con trước
    con.query('UPDATE category SET parent_id = NULL WHERE parent_id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        // Xóa node cha
        con.query('DELETE FROM category WHERE id = ?', [id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
        });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

