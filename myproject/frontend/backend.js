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
app.use('/media', express.static(path.join(__dirname, 'media')));
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

// API lấy thông tin user theo id
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'SELECT id, username, full_name, role, email, is_active FROM user WHERE id = ? LIMIT 1';
    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('User info error:', err);
            return res.status(500).json({ error: 'Lỗi server.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy user.' });
        }
        res.json(results[0]);
    });
});

app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, email, full_name } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!username) {
        return res.status(400).json({ success: false, error: 'Thiếu username!' });
    }

    // Nếu bảng user không có trường full_name, hãy sửa lại cho đúng tên trường
    const sql = 'UPDATE user SET username = ?, email = ?, full_name = ? WHERE id = ?';
    con.query(sql, [username, email, full_name, userId], (err, result) => {
        if (err) {
            console.error('Update user error:', err);
            return res.status(500).json({ success: false, error: 'Lỗi server.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy user.' });
        }
        res.json({ success: true });
    });
});

const bcrypt = require('bcrypt'); // Nếu bạn dùng hash password, nên dùng bcrypt

app.put('/api/users/:id/password', (req, res) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin!' });
    }

    // Lấy password hiện tại từ DB
    const sql = 'SELECT password FROM user WHERE id = ? LIMIT 1';
    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn:', err);
            return res.status(500).json({ success: false, error: 'Lỗi server.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy user.' });
        }

        const dbPassword = results[0].password;
        // Nếu bạn dùng plain text (KHÔNG KHUYẾN KHÍCH, chỉ demo)
        if (dbPassword !== currentPassword) {
            return res.status(401).json({ success: false, error: 'Mật khẩu hiện tại không đúng!' });
        }
        con.query('UPDATE user SET password = ? WHERE id = ?', [newPassword, userId], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Lỗi server.' });
            res.json({ success: true });
        });
    });
});

// ... các route khác ...

// API lấy số lượng tài liệu, danh mục, người dùng
app.get('/api/stats', (req, res) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM document) AS document_count,
            (SELECT COUNT(*) FROM category) AS category_count,
            (SELECT COUNT(*) FROM user) AS user_count
    `;
    con.query(sql, (err, results) => {
        if (err) {
            console.error('Stats error:', err);
            return res.status(500).json({ error: 'Lỗi server.' });
        }
        res.json(results[0]);
    });
});

// API lấy danh sách category
app.get('/api/categories', (req, res) => {
    con.query('SELECT id, name FROM category', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// API lấy danh sách định dạng
app.get('/api/filetypes', (req, res) => {
    con.query('SELECT DISTINCT file_type FROM document', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Trả về mảng các file_type (nếu muốn)
        const types = results.map(row => row.file_type);
        res.json(types);
    });
});

// API tìm kiếm tài liệu với filter: search, category_id, file_type
app.get('/api/search_documents', (req, res) => {
    let { search, category_id, file_type } = req.query;
    let sql = `
        SELECT d.*, c.name AS category_name
        FROM document d
        LEFT JOIN category c ON d.category_id = c.id
        WHERE 1=1
    `;
    let params = [];

    if (search) {
        sql += " AND (d.title LIKE ? OR d.description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
        sql += " AND d.category_id = ?";
        params.push(category_id);
    }
    if (file_type) {
        sql += " AND d.file_type = ?";
        params.push(file_type);
    }

    sql += " ORDER BY d.id DESC";

    con.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// API lấy danh sách tài liệu có phân trang và filter
app.get('/api/documents', (req, res) => {
    let { page = 1, page_size = 12, search, category_id, file_type } = req.query;
    page = parseInt(page);
    page_size = parseInt(page_size);

    let sql = `
     SELECT d.*, c.name AS category_name, u.username AS created_by_username
FROM document d
LEFT JOIN category c ON d.category_id_id = c.id
LEFT JOIN user u ON d.created_by_id = u.id
WHERE 1=1
    `;
    let params = [];

    if (search) {
        sql += " AND (d.title LIKE ? OR d.description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
        sql += " AND d.category_id = ?";
        params.push(category_id);
    }
    if (file_type) {
        sql += " AND d.file_type = ?";
        params.push(file_type);
    }

    // Đếm tổng số tài liệu phù hợp
    let countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    con.query(countSql, params, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        let total = countResult[0].total;

        // Lấy dữ liệu phân trang
        sql += " ORDER BY d.id DESC LIMIT ? OFFSET ?";
        let dataParams = params.slice();
        dataParams.push(page_size, (page - 1) * page_size);

        con.query(sql, dataParams, (err, docs) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                results: docs,
                total: total,
                page: page,
                page_size: page_size,
                total_pages: Math.ceil(total / page_size)
            });
        });
    });
});

app.get('/api/categories_grid', (req, res) => {
    const sql = `
        SELECT c.id, c.name, c.description, COUNT(d.id) AS document_count
        FROM category c
        LEFT JOIN document d ON d.category_id_id = c.id
        GROUP BY c.id, c.name, c.description
        ORDER BY c.id
    `;
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// app.get('/api/users/:id', (req, res) => {
//     const userId = req.params.id;
//     const sql = 'SELECT id, username, role, email, created_at FROM user WHERE id = ? LIMIT 1';
//     con.query(sql, [userId], (err, results) => {
//         if (err) {
//             console.error('User info error:', err);
//             return res.status(500).json({ error: 'Lỗi server.' });
//         }
//         if (results.length === 0) {
//             return res.status(404).json({ error: 'Không tìm thấy user.' });
//         }
//         res.json(results[0]);
//     });
// });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));