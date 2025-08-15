// editor_update.js

document.addEventListener('DOMContentLoaded', () => {
  // 0. Lấy docId từ URL: /document/update/123/
  const match = window.location.pathname.match(/update\/(\d+)/);
  const docId = match ? match[1] : null;
  if (!docId) {
    return alert('Không xác định được tài liệu cần sửa!');
  }

  // 1. Tải danh mục và user để fill select
  fetch('http://localhost:3003/api/categories')
    .then(r => r.json())
    .then(cats => {
      const sel = document.getElementById('category_id');
      sel.innerHTML = '<option value="">-- Danh mục --</option>';
      cats.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = `${c.id} – ${c.name}`;
        sel.appendChild(o);
      });
    })
    .catch(e => console.error('Lỗi fetch categories:', e));

  fetch('http://localhost:3003/api/users')
    .then(r => r.json())
    .then(us => {
      const sel = document.getElementById('created_by_id');
      sel.innerHTML = '<option value="">-- Người tạo --</option>';
      us.forEach(u => {
        const o = document.createElement('option');
        o.value = u.id;
        o.textContent = `${u.id} – ${u.username} (${u.role})`;
        sel.appendChild(o);
      });
    })
    .catch(e => console.error('Lỗi fetch users:', e));

  // 2. Load dữ liệu document cần sửa
  fetch(`http://localhost:3003/api/documents/${docId}`)
    .then(r => r.json())
    .then(doc => {
      document.getElementById('title').value        = doc.title        || '';
      document.getElementById('description').value  = doc.description  || '';
      document.getElementById('file_path').value    = doc.file_path    || '';
      document.getElementById('file_name').value    = doc.file_name    || '';
      document.getElementById('file_type').value    = doc.file_type    || '';
      document.getElementById('file_size').value    = doc.file_size    || '';
      // CHỈ DÙNG category_id (không còn category_id_id)
      document.getElementById('category_id').value  = doc.category_id  || '';
      document.getElementById('created_by_id').value= doc.created_by_id|| '';
    })
    .catch(e => {
      console.error('Lỗi fetch document detail:', e);
      alert('Không thể tải thông tin tài liệu!');
    });

  // 3. Xử lý upload file mới
  let uploadedFileInfo = null;
  const inpFile = document.getElementById('file_upload');
  if (inpFile) {
    inpFile.addEventListener('change', () => {
      const file = inpFile.files[0];
      if (!file) return;

      // Hiển thị tạm
      document.getElementById('file_name').value = file.name;
      document.getElementById('file_type').value = file.type;
      document.getElementById('file_size').value = file.size;

      // Upload ngay
      const fd = new FormData();
      fd.append('file', file);
      fetch('http://localhost:3003/api/upload', {
        method: 'POST',
        body: fd
      })
        .then(r => r.json())
        .then(res => {
          if (!res.file_url) throw new Error('Upload fail');
          uploadedFileInfo = res;
          document.getElementById('file_path').value = res.file_url;
        })
        .catch(err => {
          console.error('Lỗi upload:', err);
          alert('Upload file thất bại!');
          uploadedFileInfo = null;
        });
    });
  }

  // 4. Submit form cập nhật
  const form = document.getElementById('updateForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      // Dùng thông tin file mới nếu đã upload, ngược lại giữ nguyên
      const file_path = uploadedFileInfo?.file_url
        ? uploadedFileInfo.file_url
        : document.getElementById('file_path').value;
      const file_name = uploadedFileInfo?.file_name
        ? uploadedFileInfo.file_name
        : document.getElementById('file_name').value;
      const file_type = uploadedFileInfo?.file_type
        ? uploadedFileInfo.file_type
        : document.getElementById('file_type').value;
      const file_size = uploadedFileInfo?.file_size
        ? uploadedFileInfo.file_size
        : document.getElementById('file_size').value;

      const payload = {
        title:         form.title.value.trim(),
        description:   form.description.value.trim(),
        file_path,
        file_name,
        file_type,
        file_size,
        category_id:   form.category_id.value,   // dùng category_id
        created_by_id: form.created_by_id.value
      };

      // Gọi API PUT /api/documents/:id
      fetch(`http://localhost:3003/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            alert('Cập nhật thành công!');
            window.location.href = '/document';
           
          } else {
            alert('Lỗi: ' + (res.error || 'Không xác định'));
          }
        })
        .catch(err => {
          console.error('Lỗi gửi update:', err);
          alert('Lỗi khi gửi dữ liệu!');
        });
    });
  }
});