// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const con = require('../connection'); // connection.js phải thiết lập charset utf8mb4

const app = express();
const PORT = 3004;

// ===== CORS, Body-Parser, Static Files =====
app.use(require('cors')());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media')));

// ===== Tạo folder upload nếu chưa có =====
const uploadDir = path.join(__dirname, '..', 'media', 'documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ===========================
// 1) Upload file (Unicode)
// ===========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // Đọc originalname dưới binary và giải mã về UTF-8
        let orig = file.originalname;
        try {
            orig = Buffer.from(orig, 'binary').toString('utf8');
        } catch (e) { /* ignore */ }

        // Sinh tên lưu: timestamp + tên gốc Unicode
        const safeName = `${Date.now()}-${orig}`;
        cb(null, safeName);
    }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Chưa chọn file.' });
    }

    // Encode filename để URL không lỗi ký tự
    const encoded = encodeURIComponent(req.file.filename);
    const file_path = `/media/documents/${encoded}`;

    // Decode lại originalname để trả về cho client
    let original = req.file.originalname;
    try {
        original = Buffer.from(original, 'binary').toString('utf8');
    } catch (e) { /* ignore */ }

    res.json({
        success: true,
        file_path,
        file_name: original,
        file_type: path.extname(original).substring(1).toUpperCase(),
        file_size: req.file.size
    });
});

// ===========================
// 2) Authentication & Users
// ===========================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ success: false, message: 'Thiếu user hoặc pass.' });

    con.query(
        'SELECT * FROM user WHERE username=? AND password=? LIMIT 1',
        [username, password],
        (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi server.' });
            if (!rows.length) return res.status(401).json({ success: false, message: 'Sai thông tin.' });
            const u = rows[0];
            if (!u.is_active) return res.status(403).json({ success: false, message: 'Chưa kích hoạt.' });
            res.json({ success: true, user: { id: u.id, username: u.username, role: u.role } });
        }
    );
});

app.get('/api/users/:id', (req, res) => {
    con.query(
        'SELECT id, username, full_name, role, email, is_active FROM user WHERE id=? LIMIT 1',
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Lỗi server.' });
            if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy user.' });
            res.json(rows[0]);
        }
    );
});

app.put('/api/users/:id', (req, res) => {
    const { username, email, full_name } = req.body;
    if (!username)
        return res.status(400).json({ success: false, error: 'Thiếu username.' });

    con.query(
        'UPDATE user SET username=?, email=?, full_name=? WHERE id=?',
        [username, email, full_name, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Lỗi server.' });
            if (!result.affectedRows)
                return res.status(404).json({ success: false, error: 'Không tìm thấy user.' });
            res.json({ success: true });
        }
    );
});

app.put('/api/users/:id/password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
        return res.status(400).json({ success: false, error: 'Thiếu thông tin.' });

    con.query('SELECT password FROM user WHERE id=? LIMIT 1', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: 'Lỗi server.' });
        if (!rows.length)
            return res.status(404).json({ success: false, error: 'Không tìm thấy user.' });
        if (rows[0].password !== currentPassword)
            return res.status(401).json({ success: false, error: 'Mật khẩu hiện tại sai.' });

        con.query('UPDATE user SET password=? WHERE id=?', [newPassword, req.params.id], err2 => {
            if (err2) return res.status(500).json({ success: false, error: 'Lỗi server.' });
            res.json({ success: true });
        });
    });
});

// ===========================
// 3) Categories & Filetypes
// ===========================
app.get('/api/categories', (req, res) => {
    con.query('SELECT id, name FROM category', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/categories_grid', (req, res) => {
    const sql = `
    SELECT c.id, c.name, c.description, COUNT(d.id) AS document_count
      FROM category c
      LEFT JOIN document d ON d.category_id = c.id
    GROUP BY c.id, c.name, c.description
    ORDER BY c.id
  `;
    con.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/filetypes', (req, res) => {
    con.query('SELECT DISTINCT file_type FROM document', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.file_type));
    });
});

// ===========================
// 4) Stats (overview + file stats)
// ===========================
app.get('/api/stats', (req, res) => {
    const sql = `
    SELECT
      (SELECT COUNT(*) FROM document) AS document_count,
      (SELECT COUNT(*) FROM category) AS category_count,
      (SELECT COUNT(*) FROM user) AS user_count
  `;
    con.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi server.' });
        res.json(rows[0]);
    });
});

app.get('/api/file-stats', (req, res) => {
    const sql = `
    SELECT file_type, COUNT(*) AS count
      FROM document
    GROUP BY file_type
    ORDER BY count DESC
  `;
    con.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi server.' });
        res.json(rows);
    });
});

// ===========================
// 5) Search & List Documents
// ===========================
app.get('/api/search_documents', (req, res) => {
    let { search, category_id, file_type } = req.query;
    let sql = `
    SELECT d.*, c.name AS category_name
      FROM document d
      LEFT JOIN category c ON d.category_id = c.id
     WHERE 1=1
  `;
    const params = [];
    if (search) {
        sql += ` AND (d.title LIKE ? OR d.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
        sql += ` AND d.category_id = ?`;
        params.push(category_id);
    }
    if (file_type) {
        sql += ` AND d.file_type = ?`;
        params.push(file_type);
    }
    sql += ` ORDER BY d.id DESC`;
    con.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Paginated documents
app.get('/api/documents', (req, res) => {
    let { page = 1, page_size = 12, search, category_id, file_type } = req.query;
    page = parseInt(page);
    page_size = parseInt(page_size);
    const offset = (page - 1) * page_size;

    let baseSql = `
    FROM document d
    LEFT JOIN category c ON d.category_id = c.id
    LEFT JOIN user     u ON d.created_by_id = u.id
    WHERE 1=1
  `;
    const params = [];
    if (search) {
        baseSql += ` AND (d.title LIKE ? OR d.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
        baseSql += ` AND d.category_id = ?`;
        params.push(category_id);
    }
    if (file_type) {
        baseSql += ` AND d.file_type = ?`;
        params.push(file_type);
    }

    // Count
    const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
    con.query(countSql, params, (err, cnt) => {
        if (err) return res.status(500).json({ error: err.message });
        const total = cnt[0].total;

        // Data
        const dataSql = `
      SELECT d.*, c.name AS category_name, u.username AS created_by_username
      ${baseSql}
      ORDER BY d.id DESC
      LIMIT ? OFFSET ?
    `;
        con.query(dataSql, [...params, page_size, offset], (err, docs) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                results: docs,
                total,
                page,
                page_size,
                total_pages: Math.ceil(total / page_size)
            });
        });
    });
});

// ===========================
// 6) My Documents CRUD
// ===========================
app.get('/api/my-documents/:userId', (req, res) => {
    const sql = `
    SELECT d.*, c.name AS category_name
      FROM document d
      LEFT JOIN category c ON d.category_id = c.id
     WHERE d.created_by_id = ?
     ORDER BY d.created_at DESC
  `;
    con.query(sql, [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi server.' });
        res.json(rows);
    });
});

app.post('/api/my-documents', (req, res) => {
    const { title, description, file_path, file_name, file_type, file_size, category_id, created_by_id } = req.body;
    if (!title || !file_path || !file_name || !file_type || !file_size || !category_id || !created_by_id) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin!' });
    }
    const sql = `
    INSERT INTO document
      (title, description, file_path, file_name, file_type, file_size, category_id, created_by_id, created_at, updated_at)
    VALUES(?,?,?,?,?,?,?,? ,NOW(),NOW())
  `;
    con.query(sql, [title, description, file_path, file_name, file_type, file_size, category_id, created_by_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: 'Lỗi server.' });
        res.json({ success: true, document_id: result.insertId });
    });
});

app.put('/api/my-documents/:docId', (req, res) => {
    const { title, description, file_path, file_name, file_type, file_size, category_id } = req.body;
    const sql = `
    UPDATE document SET
      title=?, description=?, file_path=?, file_name=?, file_type=?, file_size=?, category_id=?, updated_at=NOW()
    WHERE id=?
  `;
    con.query(sql, [title, description, file_path, file_name, file_type, file_size, category_id, req.params.docId], (err) => {
        if (err) return res.status(500).json({ success: false, error: 'Lỗi server.' });
        res.json({ success: true });
    });
});

app.delete('/api/my-documents/:docId', (req, res) => {
    con.query('DELETE FROM document WHERE id=?', [req.params.docId], (err) => {
        if (err) return res.status(500).json({ success: false, error: 'Lỗi server.' });
        res.json({ success: true });
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'API không tồn tại!' });
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));