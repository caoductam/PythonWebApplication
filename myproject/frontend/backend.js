const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const con = require('../connection');

const app = express();
const PORT = 3004;

const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/media', express.static(path.join(__dirname, 'media')));
app.use(express.json());

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin.' });
    }

    // Kiểm tra username và password
    const sql = 'SELECT * FROM user WHERE username = ? AND password = ? LIMIT 1';
    con.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ success: false, message: 'Lỗi server.' });
        }
        if (results.length === 0) {
            // Không tồn tại tài khoản
            return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' });
        }
        const user = results[0];
        if (user.is_active === 1) {
            // Đăng nhập thành công
            return res.json({ success: true, message: 'Đăng nhập thành công!', user: { id: user.id, username: user.username, role: user.role } });
        } else {
            // Tài khoản chưa active
            return res.status(403).json({ success: false, message: 'Tài khoản chưa được kích hoạt.' });
        }
    });
});

// ... các route khác ...

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));