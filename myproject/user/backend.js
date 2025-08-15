const express = require('express');
const path = require('path');
const cors = require('cors');
const con = require('../connection'); // Giữ nguyên kết nối DB của bạn

const app = express();
const PORT = 3000; // Sử dụng cổng 3003 cho nhất quán

// --- MIDDLEWARE - PHẢI ĐẶT TRƯỚC CÁC ROUTE ---
app.use(cors()); // Cho phép truy cập từ domain khác (frontend)
app.use(express.json()); // **QUAN TRỌNG: Middleware để xử lý JSON body**
app.use(express.urlencoded({ extended: true })); // Hỗ trợ cả form truyền thống nếu cần

// --- API ENDPOINTS ---

// API: Lấy danh sách tất cả người dùng
// Trả về các trường cần thiết, không bao gồm mật khẩu
app.get('/api/users', (req, res) => {
    con.query('SELECT id, username, password, full_name, email, role, is_active FROM user', (err, users) => {
        if (err) {
            console.error("SQL Error [GET /api/users]:", err);
            return res.status(500).json({ success: false, error: 'Lỗi truy vấn cơ sở dữ liệu.' });
        }
        res.json({ success: true, data: users });
    });
});

// API: Lấy thông tin chi tiết một người dùng (không bao gồm mật khẩu)
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    con.query('SELECT id, username, full_name, email, role, is_active FROM user WHERE id = ?', [userId], (err, users) => {
        if (err) {
            console.error(`SQL Error [GET /api/users/${userId}]:`, err);
            return res.status(500).json({ success: false, error: 'Lỗi truy vấn cơ sở dữ liệu.' });
        }
        if (!users.length) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng.' });
        }
        res.json({ success: true, data: users[0] });
    });
});

// API: Thêm một người dùng mới
app.post('/api/users', (req, res) => {
    // Lấy dữ liệu từ JSON body
    const { username, password, full_name, email, role, is_active } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!username || !password || !email || !role) {
        return res.status(400).json({ success: false, error: 'Tên người dùng, mật khẩu, email và vai trò là bắt buộc.' });
    }

    const sql = `
        INSERT INTO user (username, password, full_name, email, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    // Mật khẩu được lưu trực tiếp dưới dạng văn bản thuần
    const params = [username, password, full_name, email, role, is_active];

    con.query(sql, params, (err, result) => {
        if (err) {
            console.error("SQL Error [POST /api/users]:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, error: 'Tên người dùng hoặc email đã tồn tại.' });
            }
            return res.status(500).json({ success: false, error: 'Lỗi khi thêm người dùng vào cơ sở dữ liệu.' });
        }
        // Trả về mã 201 Created khi tạo mới thành công
        res.status(201).json({ success: true, message: 'Tạo người dùng thành công!', userId: result.insertId });
    });
});

// API: Cập nhật thông tin người dùng
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, full_name, email, role, is_active } = req.body;

    const sql = `
        UPDATE user SET username = ?, full_name = ?, email = ?, role = ?, is_active = ?
        WHERE id = ?
    `;
    const params = [username, full_name, email, role, is_active, userId];

    con.query(sql, params, (err, result) => {
        if (err) {
            console.error(`SQL Error [PUT /api/users/${userId}]:`, err);
            return res.status(500).json({ success: false, error: 'Lỗi khi cập nhật người dùng.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng để cập nhật.' });
        }
        res.json({ success: true, message: 'Cập nhật thành công!' });
    });
});

// API: Xóa một người dùng
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    con.query('DELETE FROM user WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error(`SQL Error [DELETE /api/users/${userId}]:`, err);
            return res.status(500).json({ success: false, error: 'Lỗi khi xóa người dùng.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng để xóa.' });
        }
        res.json({ success: true, message: 'Xóa người dùng thành công!' });
    });
});


app.listen(PORT, () => {
    console.log(`✅ API Server đang chạy tại http://127.0.0.1:${PORT}` );
});