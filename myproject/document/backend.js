const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const con = require('../connection');

const app = express();
const PORT = 3003;

const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use(express.json());

// Route trả về file HTML tĩnh cho danh sách user
app.get('/document', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'document.html'));
});

// API trả về dữ liệu user dạng JSON (cho JS phía client fetch)
app.get('/api/document', (req, res) => {
    con.query('SELECT * FROM document', (err, documents) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(documents);
    });
});

// Category
app.get('/api/category_id', (req, res) => {
    con.query('SELECT id, name FROM category', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results); // Trả về mảng object
    });
});

// User
app.get('/api/user_id', (req, res) => {
    con.query('SELECT id, username, role FROM user', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results); // Trả về mảng object
    });
});

// Cấu hình lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'media/documents/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // hoặc thêm timestamp cho unique
    }
});
const upload = multer({ storage: storage });

// Cho phép truy cập file tĩnh
app.use('/media', express.static(path.join(__dirname, 'media')));

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
        category_id_id,
        created_by_id
    } = req.body;

    const sql = `INSERT INTO document (title, description, file_path, file_name, file_type, file_size, category_id_id, created_by_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    con.query(sql, [title, description, file_path, file_name, file_type, file_size, category_id_id, created_by_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, document_id: result.insertId });
    });
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
