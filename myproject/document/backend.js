const express   = require('express');
const multer    = require('multer');
const path      = require('path');
const bodyParser= require('body-parser');
const fs        = require('fs');
const con       = require('../connection');

const app  = express();
const PORT = 3003;

app.use(require('cors')());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use(express.json());

// Tạo folder upload nếu chưa có
const uploadDir = path.join(__dirname, '..', 'media', 'documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Tải trang HTML cho /document
app.get('/document', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'document.html'));
});

// API: Lấy documents (có phân trang & tìm kiếm)
app.get('/api/documents', (req, res) => {
  let page     = parseInt(req.query.page)      || 1;
  let pageSize = parseInt(req.query.page_size) || 10;
  let search   = req.query.search?.trim()      || '';
  let offset   = (page - 1) * pageSize;

  // SQL base và params
  let baseSql  = `
    FROM document d
    LEFT JOIN category c ON d.category_id = c.id
    LEFT JOIN user     u ON d.created_by_id = u.id
  `;
  let where    = '';
  let params   = [];

  if (search) {
    where = 'WHERE d.title LIKE ?';
    params.push(`%${search}%`);
  }

  // 1) Đếm tổng
  const countSql = `SELECT COUNT(*) AS total ${baseSql} ${where}`;
  con.query(countSql, params, (err, cnt) => {
    if (err) {
      console.error('Count error:', err);
      return res.status(500).json({ error: err.message });
    }
    const total = cnt[0].total;

    // 2) Lấy dữ liệu
    const dataSql = `
      SELECT 
        d.*, 
        c.name AS category_name, 
        u.username AS created_by_username
      ${baseSql} ${where}
      ORDER BY d.id ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = params.concat([pageSize, offset]);
    con.query(dataSql, dataParams, (err, docs) => {
      if (err) {
        console.error('Data error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({
        results:      docs,
        total,
        page,
        page_size:    pageSize,
        total_pages:  Math.ceil(total / pageSize)
      });
    });
  });
});

// API: Lấy danh sách category
app.get('/api/categories', (req, res) => {
  con.query('SELECT id, name FROM category', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Lấy danh sách user
app.get('/api/users', (req, res) => {
  con.query('SELECT id, username, role FROM user', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// API upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    file_url:  '/media/documents/' + req.file.filename,
    file_name: req.file.originalname,
    file_type: req.file.mimetype,
    file_size: req.file.size
  });
});

// API thêm document mới
app.post('/api/add_document', (req, res) => {
  const {
    title,
    description,
    file_path,
    file_name,
    file_type,
    file_size,
    category_id,     // <-- dùng category_id
    created_by_id
  } = req.body;

  const sql = `
    INSERT INTO document 
      (title, description, file_path, file_name, file_type, file_size, category_id, created_by_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const vals = [title, description, file_path, file_name, file_type, file_size, category_id, created_by_id];

  con.query(sql, vals, (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, document_id: result.insertId });
  });
});

// API lấy chi tiết 1 document
app.get('/api/documents/:id', (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT 
      d.*, 
      c.name      AS category_name, 
      u.username  AS created_by_username
    FROM document d
    LEFT JOIN category c ON d.category_id = c.id
    LEFT JOIN user     u ON d.created_by_id = u.id
    WHERE d.id = ?
  `;
  con.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  });
});

// API cập nhật document
app.put('/api/documents/:id', (req, res) => {
  const id = req.params.id;
  const {
    title,
    description,
    file_path,
    file_name,
    file_type,
    file_size,
    category_id,     // <-- dùng category_id
    created_by_id
  } = req.body;

  const sql = `
    UPDATE document SET
      title=?, description=?, file_path=?, file_name=?, file_type=?, file_size=?,
      category_id=?, created_by_id=?
    WHERE id=?
  `;
  const vals = [title, description, file_path, file_name, file_type, file_size, category_id, created_by_id, id];

  con.query(sql, vals, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// API xoá document
app.delete('/api/documents/:id', (req, res) => {
  const id = req.params.id;
  con.query('DELETE FROM document WHERE id=?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});