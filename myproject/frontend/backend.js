const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const con = require('../connection'); // Đảm bảo connection.js đã thiết lập charset utf8mb4
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // Import cors để dùng

const app = express();
const PORT = 3004;


// =================================================================
// ===== BƯỚC 1: CẤU HÌNH MIDDLEWARES THEO ĐÚNG THỨ TỰ ==========
// =================================================================

// 1. Cấu hình CORS (PHẢI ĐẶT ĐẦU TIÊN)
// Cho phép frontend ở địa chỉ 'http://127.0.0.1:8000' được gửi yêu cầu
// và quan trọng nhất là cho phép gửi cookie (credentials: true )
app.use(cors({
    origin: 'http://127.0.0.1:8000', // <-- Thay bằng địa chỉ frontend của bạn nếu khác
    credentials: true
}));

// 2. Middleware để xử lý body của request (JSON, form data)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 3. Middleware để đọc cookie (BẮT BUỘC phải có trước session)
app.use(cookieParser());

// 4. Cấu hình Express Session (BẮT BUỘC)
// Middleware này sẽ tạo ra đối tượng req.session
app.use(session({
    secret: 'cao-duc-tam', // <-- THAY bằng chuỗi bí mật của bạn
    resave: false,
    saveUninitialized: false, // Chỉ tạo session khi đăng nhập thành công
    cookie: {
        secure: false, // Đặt là `true` nếu bạn dùng HTTPS
        httpOnly: true, // Tăng bảo mật, ngăn JS phía client đọc cookie
        maxAge: 24 * 60 * 60 * 1000 // Thời gian sống của cookie: 1 ngày
    }
}));

// 5. Middleware để phục vụ các file tĩnh (ảnh, tài liệu...)
// Đặt sau các middleware xử lý để tối ưu
app.use('/media', express.static(path.join(__dirname, 'media')));

// ===== Hàm trợ giúp (Helpers) =====
const sendSuccess = (res, data, statusCode = 200) => res.status(statusCode).json({ success: true, data });
const sendError = (res, message, statusCode = 500) => {
    console.error("API Error:", message); // Log lỗi ra console của server để debug
    res.status(statusCode).json({ success: false, error: message });
};

// ===== Cấu hình Multer cho Upload =====
const uploadDir = path.join(__dirname, 'media', 'documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeName = `${Date.now()}-${Buffer.from(file.originalname, 'binary').toString('utf8')}`;
        cb(null, safeName);
    }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 50MB, bạn có thể tăng lên nếu cần
});

// ==================================================
// ===== API ROUTES =================================
// ==================================================

// 1. API UPLOAD
// --------------------------------------------------
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return sendError(res, 'Chưa chọn file để upload.', 400);

    const fileData = {
        file_path: `/media/documents/${encodeURIComponent(req.file.filename)}`,
        file_name: req.file.filename, // Trả về tên đã có timestamp để đảm bảo duy nhất
        file_type: path.extname(req.file.filename).substring(1).toUpperCase(),
        file_size: req.file.size
    };
    sendSuccess(res, fileData);
});


// 2. API USERS (CRUD đầy đủ cho Admin)
// --------------------------------------------------

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!username || !password) {
        return sendError(res, 'Vui lòng nhập tên người dùng và mật khẩu.', 400);
    }

    // 2. Truy vấn CSDL để tìm người dùng
    const sql = 'SELECT id, username, password, role, is_active FROM user WHERE username = ?';
    con.query(sql, [username], (err, users) => {
        if (err) return sendError(res, 'Lỗi truy vấn CSDL khi đăng nhập.');

        // 3. Kiểm tra xem người dùng có tồn tại không
        if (users.length === 0) {
            return sendError(res, 'Tên người dùng hoặc mật khẩu không chính xác.', 401); // Unauthorized
        }

        const user = users[0];

        // 4. So sánh mật khẩu (hiện tại là so sánh trực tiếp)
        if (user.password !== password) {
            return sendError(res, 'Tên người dùng hoặc mật khẩu không chính xác.', 401); // Unauthorized
        }

        // 5. Kiểm tra xem tài khoản có bị vô hiệu hóa không
        if (!user.is_active) {
            return sendError(res, 'Tài khoản của bạn đã bị vô hiệu hóa.', 403); // Forbidden
        }

        // 6. Đăng nhập thành công: Trả về thông tin cần thiết cho client
        const userPayload = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        req.session.user = userPayload; // <-- THÊM DÒNG NÀY
        sendSuccess(res, userPayload);
    });
});


// GET: Lấy danh sách tất cả người dùng
app.get('/api/users', (req, res) => {
    con.query('SELECT id, username, password, full_name, email, role, is_active FROM user', (err, users) => {
        if (err) return sendError(res, 'Lỗi truy vấn CSDL khi lấy danh sách người dùng.');
        sendSuccess(res, users);
    });
});

// GET: Lấy thông tin chi tiết một người dùng
app.get('/api/users/:id', (req, res) => {
    con.query('SELECT id, username, password, full_name, email, role, is_active FROM user WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return sendError(res, 'Lỗi truy vấn CSDL.');
        if (rows.length === 0) return sendError(res, 'Không tìm thấy người dùng.', 404);
        sendSuccess(res, rows[0]);
    });
});

// POST: Tạo một người dùng mới
app.post('/api/users', (req, res) => {
    const { username, password, full_name, email, role, is_active } = req.body;
    if (!username || !password || !email || !role) return sendError(res, 'Thiếu các thông tin bắt buộc.', 400);

    const sql = 'INSERT INTO user (username, password, full_name, email, role, is_active) VALUES (?, ?, ?, ?, ?, ?)';
    con.query(sql, [username, password, full_name, email, role, is_active ? 1 : 0], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Tên người dùng hoặc email đã tồn tại.', 409);
            return sendError(res, 'Lỗi CSDL khi tạo người dùng.');
        }
        sendSuccess(res, { id: result.insertId, ...req.body }, 201);
    });
});

// PUT: Cập nhật thông tin một người dùng
app.put('/api/users/:id', (req, res) => {
    // Giả sử đã có middleware kiểm tra quyền Admin chạy trước
    const { username, password, full_name, email, role, is_active } = req.body;
    const userIdToUpdate = req.params.id;

    if (!username || !email || !role) {
        return sendError(res, 'Tên người dùng, email và vai trò là bắt buộc.', 400);
    }

    // ... (toàn bộ logic kiểm tra trùng lặp và cập nhật của bạn ở đây) ...
    // Logic này đã đúng, không cần sửa.
    const checkUsernameSql = 'SELECT id FROM user WHERE username = ? AND id != ?';
    con.query(checkUsernameSql, [username, userIdToUpdate], (err, usernameUsers) => {
        if (err) return sendError(res, 'Lỗi CSDL khi kiểm tra username.');
        if (usernameUsers.length > 0) {
            return sendError(res, 'Tên người dùng đã được sử dụng bởi tài khoản khác.', 409);
        }

        const checkEmailSql = 'SELECT id FROM user WHERE email = ? AND id != ?';
        con.query(checkEmailSql, [email, userIdToUpdate], (err, emailUsers) => {
            if (err) return sendError(res, 'Lỗi CSDL khi kiểm tra email.');
            if (emailUsers.length > 0) {
                return sendError(res, 'Email đã được sử dụng bởi tài khoản khác.', 409);
            }

            let updateSql;
            let params;
            if (password && password.trim() !== '') {
                updateSql = 'UPDATE user SET username = ?, password = ?, full_name = ?, email = ?, role = ?, is_active = ? WHERE id = ?';
                params = [username, password, full_name, email, role, is_active ? 1 : 0, userIdToUpdate];
            } else {
                updateSql = 'UPDATE user SET username = ?, full_name = ?, email = ?, role = ?, is_active = ? WHERE id = ?';
                params = [username, full_name, email, role, is_active ? 1 : 0, userIdToUpdate];
            }

            con.query(updateSql, params, (updateErr, result) => {
                if (updateErr) return sendError(res, 'Lỗi CSDL khi cập nhật người dùng.');
                if (result.affectedRows === 0) return sendError(res, 'Không tìm thấy người dùng để cập nhật.', 404);
                sendSuccess(res, { message: 'Cập nhật thành công.' });
            });
        });
    });
});

// DELETE: Xóa một người dùng
app.delete('/api/users/:id', (req, res) => {
    con.query('DELETE FROM user WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return sendError(res, 'Lỗi CSDL khi xóa người dùng.');
        if (result.affectedRows === 0) return sendError(res, 'Không tìm thấy người dùng để xóa.', 404);
        sendSuccess(res, { message: 'Xóa người dùng thành công.' });
    });
});


// 3. API CATEGORIES
// --------------------------------------------------
app.get('/api/categories', (req, res) => {
    con.query(
        'SELECT id, name, description, parent_id FROM category',
        (err, categories) => {
            if (err) return sendError(res, 'Lỗi truy vấn danh mục.');
            sendSuccess(res, categories);
        }
    );
});

app.get('/api/categories/:id', (req, res) => {
    con.query(
        'SELECT id, name, description, parent_id FROM category WHERE id = ?',
        [req.params.id],
        (err, rows) => {
            if (err) return sendError(res, 'Lỗi truy vấn danh mục.');
            if (rows.length === 0) return sendError(res, 'Không tìm thấy danh mục.', 404);
            sendSuccess(res, rows[0]);
        }
    );
});

app.post('/api/categories', (req, res) => {
    const { name, description, parent_id } = req.body;
    if (!name) return sendError(res, 'Tên danh mục là bắt buộc.', 400);
    const sql = 'INSERT INTO category (name, description, parent_id) VALUES (?, ?, ?)';
    con.query(sql, [name, description, parent_id || null], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Tên danh mục đã tồn tại.', 409);
            return sendError(res, 'Lỗi CSDL khi tạo danh mục.');
        }
        sendSuccess(res, { id: result.insertId, name, description, parent_id }, 201);
    });
});

app.put('/api/categories/:id', (req, res) => {
    const { name, description, parent_id } = req.body;
    if (!name) return sendError(res, 'Tên danh mục là bắt buộc.',400);
    const sql = 'UPDATE category SET name = ?, description = ?, parent_id = ? WHERE id = ?';
    con.query(sql, [name, description, parent_id || null, req.params.id],
        (err, result) => {
            if (err) return sendError(res, 'Lỗi CSDL khi cập nhật danh mục.');
            if (result.affectedRows === 0) return sendError(res, 'Không tìm thấy danh mục để cập nhật.', 404);
            sendSuccess(res, { message: 'Cập nhật thành công.' });
        }
    );
}); 

app.delete('/api/categories/:id', (req, res) => {
    con.query('DELETE FROM category WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return sendError(res, 'Lỗi CSDL khi xóa danh mục.');
        if (result.affectedRows === 0) return sendError(res, 'Không tìm thấy danh mục để xóa.', 404);
        sendSuccess(res, { message: 'Xóa danh mục thành công.' });
    });
});


// 4. API DOCUMENTS (CRUD đầy đủ cho Admin)
// --------------------------------------------------

// GET: Lấy danh sách tài liệu (có phân trang và tìm kiếm)

app.get('/api/documents', (req, res) => {
    const { page = 1, search = '', category_id = '', file_type = '' } = req.query;
    const pageSize = 12;
    const offset = (parseInt(page) - 1) * pageSize;

    let whereClauses = [];
    let params = [];

    if (search) {
        whereClauses.push('(d.title LIKE ? OR d.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
        whereClauses.push('d.category_id = ?');
        params.push(category_id);
    }
    if (file_type) {
        whereClauses.push('d.file_type = ?');
        params.push(file_type);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM document d ${whereSql}`;
    con.query(countSql, params, (err, countResult) => {
        if (err) return sendError(res, 'Lỗi đếm số lượng tài liệu.');
        const total = (countResult && countResult.length > 0) ? countResult[0].total : 0;

        const dataSql = `
            SELECT d.*, c.name AS category_name, u.username AS created_by_username
            FROM document d
            LEFT JOIN category c ON d.category_id = c.id
            LEFT JOIN user u ON d.created_by_id = u.id
            ${whereSql}
            ORDER BY d.id DESC LIMIT ? OFFSET ?
        `;
        con.query(dataSql, [...params, pageSize, offset], (err, documents) => {
            if (err) return sendError(res, 'Lỗi lấy danh sách tài liệu.');
            // Luôn trả về cấu trúc nhất quán
            res.status(200).json({
                success: true,
                data: {
                    results: documents || [],
                    total: total,
                    page: parseInt(page),
                    total_pages: Math.ceil(total / pageSize)
                }
            });
        });
    });
});


// GET: Lấy thông tin chi tiết một tài liệu
app.get('/api/documents/:id', (req, res) => {
    const sql = `
        SELECT d.*, c.name AS category_name, u.username AS created_by_username
        FROM document d
        LEFT JOIN category c ON d.category_id = c.id
        LEFT JOIN user u ON d.created_by_id = u.id
        WHERE d.id = ?
    `;
    con.query(sql, [req.params.id], (err, rows) => {
        if (err) return sendError(res, 'Lỗi truy vấn chi tiết tài liệu.');
        if (rows.length === 0) return sendError(res, 'Không tìm thấy tài liệu.', 404);
        sendSuccess(res, rows[0]);
    });
});

// POST: Tạo một tài liệu mới
app.post('/api/documents', (req, res) => {
    const { title, description, file_path, file_name, file_type, file_size, category_id, created_by_id } = req.body;
    if (!title || !file_path || !file_name || !category_id || !created_by_id) {
        return sendError(res, 'Thiếu các thông tin bắt buộc.', 400);
    }

    // SỬA LỖI: Không cần truyền created_at, updated_at. Để CSDL tự xử lý.
    const sql = 'INSERT INTO document (title, description, file_path, file_name, file_type, file_size, category_id, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [title, description, file_path, file_name, file_type, file_size, category_id, created_by_id];

    con.query(sql, params, (err, result) => {
        if (err) return sendError(res, 'Lỗi CSDL khi tạo tài liệu.');
        sendSuccess(res, { id: result.insertId, ...req.body }, 201);
    });
});

// PUT: Cập nhật một tài liệu
app.put('/api/documents/:id', (req, res) => {
    const { title, description, file_path, file_name, file_type, file_size, category_id, created_by_id } = req.body;
    if (!title || !category_id || !created_by_id) {
        return sendError(res, 'Thiếu các thông tin bắt buộc.', 400);
    }

    const sql = 'UPDATE document SET title=?, description=?, file_path=?, file_name=?, file_type=?, file_size=?, category_id=?, created_by_id=? WHERE id=?';
    const params = [title, description, file_path, file_name, file_type, file_size, category_id, created_by_id, req.params.id];

    con.query(sql, params, (err, result) => {
        if (err) return sendError(res, 'Lỗi CSDL khi cập nhật tài liệu.');
        if (result.affectedRows === 0) return sendError(res, 'Không tìm thấy tài liệu để cập nhật.', 404);
        sendSuccess(res, { message: 'Cập nhật thành công.' });
    });
});

// DELETE: Xóa một tài liệu
app.delete('/api/documents/:id', (req, res) => {
    con.query('DELETE FROM document WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return sendError(res, 'Lỗi CSDL khi xóa tài liệu.');
        if (result.affectedRows === 0) return sendError(res, 'Không tìm thấy tài liệu để xóa.', 404);
        sendSuccess(res, { message: 'Xóa tài liệu thành công.' });
    });
});

// API: Lấy các loại file duy nhất
app.get('/api/filetypes', (req, res) => {
    // --- SỬA LẠI CÂU LỆNH SQL TẠI ĐÂY ---
    // Thêm điều kiện WHERE để loại bỏ các giá trị NULL và chuỗi rỗng
    const sql = "SELECT DISTINCT file_type FROM document WHERE file_type IS NOT NULL AND file_type != '' ORDER BY file_type ASC";

    con.query(sql, (err, rows) => {
        if (err) return sendError(res, 'Lỗi CSDL khi lấy loại file.');

        // Vẫn trả về dữ liệu đã được đóng gói
        sendSuccess(res, rows);
    });
});

// API: Lấy các số liệu thống kê cơ bản
app.get('/api/stats', (req, res) => {
    const sql = `
        SELECT
          (SELECT COUNT(*) FROM document) AS document_count,
          (SELECT COUNT(*) FROM category) AS category_count,
          (SELECT COUNT(*) FROM user) AS user_count
    `;
    con.query(sql, (err, rows) => {
        if (err || rows.length === 0) {
            // Nếu có lỗi, trả về một đối tượng với các giá trị mặc định là 0
            console.error("Lỗi khi lấy stats:", err);
            return res.status(500).json({
                document_count: 0,
                category_count: 0,
                user_count: 0
            });
        }
        // Trả về dữ liệu nếu thành công
        res.json(rows[0]);
    });
});

// API: Lấy danh sách category kèm số lượng tài liệu
app.get('/api/categories_grid', (req, res) => {
    const sql = `
        SELECT c.id, c.name, c.description, COUNT(d.id) AS document_count
        FROM category c
        LEFT JOIN document d ON c.id = d.category_id
        GROUP BY c.id, c.name, c.description
        ORDER BY c.id;
    `;
    con.query(sql, (err, results) => {
        if (err) return sendError(res, 'Lỗi CSDL khi lấy grid danh mục.');
        sendSuccess(res, results);
    });
});

app.patch('/api/users/:id', (req, res) => {
    const userIdToUpdate = req.params.id;
    const { username, email, full_name } = req.body;

    // --- BƯỚC 1: XÁC ĐỊNH CÁC TRƯỜNG CẦN CẬP NHẬT ---
    const fieldsToUpdate = {};
    if (username !== undefined) fieldsToUpdate.username = username.trim();
    if (email !== undefined) fieldsToUpdate.email = email.trim();
    if (full_name !== undefined) fieldsToUpdate.full_name = full_name.trim();

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ success: false, error: 'Không có thông tin nào được cung cấp để cập nhật.' });
    }

    // --- BƯỚC 2: KIỂM TRA TRÙNG LẶP (QUAY LẠI DÙNG CALLBACK) ---
    const checkDuplicates = (callback) => {
        // Kiểm tra username nếu có
        if (fieldsToUpdate.username) {
            const sql = 'SELECT id FROM user WHERE username = ? AND id != ?';
            con.query(sql, [fieldsToUpdate.username, userIdToUpdate], (err, users) => {
                if (err) return callback('Lỗi CSDL khi kiểm tra username.');
                if (users.length > 0) return callback('Tên người dùng đã được sử dụng.');

                // Nếu username ổn, kiểm tra email
                checkEmail(callback);
            });
        } else {
            // Nếu không có username, kiểm tra email luôn
            checkEmail(callback);
        }
    };

    const checkEmail = (callback) => {
        if (fieldsToUpdate.email) {
            const sql = 'SELECT id FROM user WHERE email = ? AND id != ?';
            con.query(sql, [fieldsToUpdate.email, userIdToUpdate], (err, users) => {
                if (err) return callback('Lỗi CSDL khi kiểm tra email.');
                if (users.length > 0) return callback('Email đã được sử dụng.');

                // Nếu email cũng ổn, gọi callback không có lỗi
                callback(null);
            });
        } else {
            // Nếu không có email, gọi callback không có lỗi
            callback(null);
        }
    };

    // --- BƯỚC 3: THỰC THI CẬP NHẬT ---
    checkDuplicates((error) => {
        // Nếu có lỗi từ việc kiểm tra trùng lặp
        if (error) {
            return res.status(409).json({ success: false, error: error }); // 409 Conflict
        }

        // Nếu không có lỗi, tiến hành cập nhật
        const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const params = [...Object.values(fieldsToUpdate), userIdToUpdate];
        const updateSql = `UPDATE user SET ${setClauses} WHERE id = ?`;

        con.query(updateSql, params, (err, result) => {
            if (err) {
                console.error("Lỗi CSDL khi cập nhật:", err);
                return res.status(500).json({ success: false, error: 'Lỗi máy chủ khi cập nhật thông tin.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng để cập nhật.' });
            }
            res.status(200).json({ success: true, message: 'Cập nhật thông tin thành công.' });
        });
    });
});

app.put('/api/me/password', (req, res) => {
    // BỎ QUA kiểm tra xác thực
    // Lấy userId từ body (hoặc hardcode để test)
    const userId = req.body.userId || 1; // hoặc truyền userId từ frontend

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return sendError(res, 'Vui lòng cung cấp đầy đủ và hợp lệ mật khẩu.', 400);
    }

    const sqlGetUser = 'SELECT password FROM user WHERE id = ?';
    con.query(sqlGetUser, [userId], (err, users) => {
        if (err) return sendError(res, 'Lỗi máy chủ khi truy vấn người dùng.');
        if (users.length === 0) return sendError(res, 'Không tìm thấy tài khoản người dùng.', 404);

        const savedPassword = users[0].password;
        if (currentPassword.trim() !== savedPassword.trim()) {
            return sendError(res, 'Mật khẩu hiện tại không chính xác.', 400);
        }

        const sqlUpdatePass = 'UPDATE user SET password = ? WHERE id = ?';
        con.query(sqlUpdatePass, [newPassword, userId], (updateErr) => {
            if (updateErr) return sendError(res, 'Lỗi máy chủ khi cập nhật mật khẩu.');
            sendSuccess(res, { message: 'Đổi mật khẩu thành công.' });
        });
    });
});
// GET: Lấy tất cả tài liệu do một người dùng cụ thể tạo
app.get('/api/my-documents/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT 
            d.*, 
            c.name AS category_name 
        FROM document d
        LEFT JOIN category c ON d.category_id = c.id
        WHERE d.created_by_id = ?
        ORDER BY d.created_at DESC
    `;

    con.query(sql, [userId], (err, documents) => {
        if (err) return sendError(res, 'Lỗi CSDL khi lấy tài liệu của bạn.');
        // Trả về mảng tài liệu, dù là rỗng hay có dữ liệu
        sendSuccess(res, documents);
    });
});

// POST: User tự đăng một tài liệu mới
app.post('/api/my-documents', (req, res) => {
    const { title, description, file_path, file_name, file_type, file_size, category_id, created_by_id } = req.body;
    if (!title || !file_path || !category_id || !created_by_id) {
        return sendError(res, 'Thiếu các thông tin bắt buộc.', 400);
    }
    const sql = 'INSERT INTO document (title, description, file_path, file_name, file_type, file_size, category_id, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    con.query(sql, [title, description, file_path, file_name, file_type, file_size, category_id, created_by_id], (err, result) => {
        if (err) return sendError(res, 'Lỗi CSDL khi đăng tài liệu.');
        sendSuccess(res, { id: result.insertId }, 201);
    });
});

// DELETE: User tự xóa tài liệu của mình
app.delete('/api/my-documents/:docId', (req, res) => {
    const docId = req.params.docId;
    con.query('DELETE FROM document WHERE id = ?', [docId], (err, result) => {
        if (err) return sendError(res, 'Lỗi CSDL khi xóa tài liệu.');
        if (result.affectedRows === 0) return sendError(res, 'Không tìm thấy tài liệu để xóa.', 404);
        sendSuccess(res, { message: 'Xóa tài liệu thành công.' });
    });
});



// ===== 404 Handler (luôn đặt ở cuối) =====
app.use((req, res, next) => {
    sendError(res, `API không tồn tại: ${req.method} ${req.originalUrl}`, 404);
});

// ===== Khởi động Server =====
app.listen(PORT, () => {
    console.log(`✅ API Server đang chạy tại http://127.0.0.1:${PORT}`);
});
