const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const con = require('../connection');

const app = express();
const PORT = 3000;

const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Route trả về file HTML tĩnh cho danh sách user
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

// API trả về dữ liệu user dạng JSON (cho JS phía client fetch)
app.get('/api/user', (req, res) => {
    con.query('SELECT * FROM user', (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(users);
    });
});

app.get('/add_user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_user.html'));
});

app.post('/add_user', (req, res) => {
    const { username, password, full_name, email, role, active } = req.body;
    const is_active = (active === 'yes' || active === 'on') ? 1 : 0;
    const now = new Date();

    const sql = `
        INSERT INTO user 
        (username, password, full_name, email, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        username,
        password,
        full_name,
        email,
        role,
        is_active,
        now,
        now
    ];

    con.query(sql, params, (err, result) => {
        if (err) {
            let msg = 'Có lỗi xảy ra: ' + err.message;
            if (err.code === 'ER_DUP_ENTRY') {
                msg = 'Username hoặc email đã tồn tại!';
            }
            // Đường dẫn đúng về form thêm user
            return res.send(`<p>${msg}</p><a href="/add_user">Thêm user mới</a>`);
        }
        // Đường dẫn đúng về danh sách user
        res.redirect('/user');
    });
});

app.get('/update_user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'update_user.html'));
});

app.post('/update_user', (req, res) => {
    const id = req.params.id;
    const { username, password, full_name, email, role, active } = req.body;
    const is_active = (active === 'yes' || active === 'on') ? 1 : 0;
    const now = new Date();

    let sql, params;
    if (password && password.trim() !== '') {
        sql = `
            UPDATE user SET 
                username = ?, password = ?, full_name = ?, email = ?, role = ?, is_active = ?, updated_at = ?
            WHERE id = ?
        `;
        params = [username, password, full_name, email, role, is_active, now, id];
    } else {
        sql = `
            UPDATE user SET 
                username = ?, full_name = ?, email = ?, role = ?, is_active = ?, updated_at = ?
            WHERE id = ?
        `;
        params = [username, full_name, email, role, is_active, now, id];
    }

    con.query(sql, params, (err, result) => {
        if (err) {
            let msg = 'Có lỗi xảy ra: ' + err.message;
            if (err.code === 'ER_DUP_ENTRY') {
                msg = 'Username hoặc email đã tồn tại!';
            }
            return res.send(`<p>${msg}</p><a href="/update_user/${id}">Quay lại sửa</a>`);
        }
        res.redirect('/user');
    });
});

app.delete('/api/user/:id/delete', (req, res) => {
    const id = req.params.id;
    con.query('DELETE FROM user WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'User không tồn tại' });
        }
        res.json({ success: true });
    });
});

// API lấy user theo id
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    con.query('SELECT * FROM user WHERE id = ?', [userId], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!users.length) return res.status(404).json({ error: 'User not found' });
        res.json(users[0]);
    });
});

app.get('/', (req, res) => {
    res.redirect('/user');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));