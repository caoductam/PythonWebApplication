const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const con = require('../connection');

const app = express();
const PORT = 3003;

const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use(express.json());

// Đảm bảo thư mục upload tồn tại
const uploadDir = path.join(__dirname, 'media', 'documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Route trả về file HTML tĩnh cho danh sách document
app.get('/document', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'document.html'));
});

// API trả về dữ liệu document dạng JSON (đã join với category và user, có phân trang và tìm kiếm)
app.get('/api/documents', (req, res) => {
    let page = parseInt(req.query.page) || 1;
    let pageSize = parseInt(req.query.page_size) || 10;
    let search = req.query.search ? req.query.search.trim() : '';

    let offset = (page - 1) * pageSize;

    let baseSql = `
        FROM document d
        LEFT JOIN category c ON d.category_id = c.id
        LEFT JOIN user u ON d.created_by_id = u.id
    `;
    let whereSql = '';
    let params = [];

    if (search) {
        whereSql = "WHERE d.title LIKE ?";
        params.push(`%${search}%`);
    }

    // Đếm tổng số bản ghi
    let countSql = `SELECT COUNT(*) as total ${baseSql} ${whereSql}`;
    con.query(countSql, params, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        let total = countResult[0].total;

        // Lấy dữ liệu phân trang
        let dataSql = `
            SELECT d.*, c.name AS category_name, u.username AS created_by_username
            ${baseSql} ${whereSql}
            ORDER BY d.id DESC
            LIMIT ? OFFSET ?
        `;
        // Tạo mảng params mới để tránh ảnh hưởng đến params của countSql
        let dataParams = params.slice();
        dataParams.push(pageSize, offset);

        con.query(dataSql, dataParams, (err, documents) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                results: documents,
                total: total,
                page: page,
                page_size: pageSize,
                total_pages: Math.ceil(total / pageSize)
            });
        });
    });
});

// API lấy danh sách category
app.get('/api/categories', (req, res) => {
    con.query('SELECT id, name FROM category', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// API lấy danh sách user
app.get('/api/users', (req, res) => {
    con.query('SELECT id, username, role FROM user', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Cấu hình lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Có thể thêm timestamp nếu muốn unique
    }
});
const upload = multer({ storage: storage });

// API upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({
        file_url: '/media/documents/' + req.file.filename,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size
    });
});

// API thêm tài liệu mới
app.post('/api/add_document', (req, res) => {
    const {
        title,
        description,
        file_path,
        file_name,
        file_type,
        file_size,
        category_id,
        created_by_id
    } = req.body;

    const sql = `INSERT INTO document (title, description, file_path, file_name, file_type, file_size, category_id, created_by_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    con.query(sql, [title, description, file_path, file_name, file_type, file_size, category_id, created_by_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, document_id: result.insertId });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));