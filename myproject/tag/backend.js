const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const con = require('../connection');

const app = express();
const PORT = 3001;

const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Route trả về file HTML tĩnh cho danh sách user
app.get('/tag', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tag.html'));
});

// API trả về dữ liệu user dạng JSON (cho JS phía client fetch)
app.get('/api/tag', (req, res) => {
    con.query('SELECT * FROM tag', (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(users);
    });
});

app.get('/add_tag', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_tag.html'));
});

app.post('/add_tag', (req, res) => {
    const { name } = req.body;
    const now = new Date();

    const sql = `
        INSERT INTO tag 
        (name, created_at, updated_at)
        VALUES (?, ?, ?)
    `;
    const params = [
        name,
        now,
        now
    ];

    con.query(sql, params, (err, result) => {
        if (err) {
            let msg = 'Có lỗi xảy ra: ' + err.message;
            if (err.code === 'ER_DUP_ENTRY') {
                msg = 'Thẻ đã tồn tại!';
            }
            // Đường dẫn đúng về form thêm user
            return res.send(`<p>${msg}</p><a href="/add_tag">Thêm thẻ mới</a>`);
        }
        // Đường dẫn đúng về danh sách user
        res.redirect('/tag');
    });
});

app.get('/update_tag', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'update_tag.html'));
});

app.post('/update_tag', (req, res) => {
    const id = req.params.id;
    const { name } = req.body;
    const now = new Date();

    let sql, params;
    if (password && password.trim() !== '') {
        sql = `
            UPDATE tag SET 
                name = ?, updated_at = ?
            WHERE id = ?
        `;
        params = [name, now, id];
    } else {
        sql = `
            UPDATE tag SET 
                name = ?, updated_at = ?
            WHERE id = ?
        `;
        params = [name, now, id];
    }

    con.query(sql, params, (err, result) => {
        if (err) {
            let msg = 'Có lỗi xảy ra: ' + err.message;
            if (err.code === 'ER_DUP_ENTRY') {
                msg = 'Thẻ đã tồn tại!';
            }
            return res.send(`<p>${msg}</p><a href="/update_tag/${id}">Quay lại sửa</a>`);
        }
        res.redirect('/tag');
    });
});

app.delete('/api/tag/:id/delete', (req, res) => {
    const id = req.params.id;
    con.query('DELETE FROM tag WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Thẻ không tồn tại' });
        }
        res.json({ success: true });
    });
});

app.get('/', (req, res) => {
    res.redirect('/tag');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));