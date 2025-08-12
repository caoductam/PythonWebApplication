// editor_add.js
document.addEventListener('DOMContentLoaded', () => {
  // — 1. Hàm chuyển MIME → định dạng ngắn
  function mimeToShort(mime) {
    switch (mime) {
      case 'application/pdf': return 'PDF';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'Word';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'Excel';
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return 'PowerPoint';
      case 'image/jpeg':
      case 'image/jpg': return 'JPEG';
      case 'image/png':    return 'PNG';
      case 'image/gif':    return 'GIF';
      case 'text/plain':   return 'Text';
      case 'application/zip':
      case 'application/x-zip-compressed': return 'ZIP';
      case 'application/x-rar-compressed': return 'RAR';
      case 'audio/mpeg':   return 'MP3';
      case 'video/mp4':    return 'MP4';
      default: return mime;
    }
  }

  // — 2. Load danh mục lên <select id="category_id">
  fetch('http://localhost:3003/api/categories')
    .then(r => r.json())
    .then(list => {
      const sel = document.getElementById('category_id');
      if (!sel) return;
      sel.innerHTML = '<option value="">-- Chọn danh mục --</option>';
      list.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = `${c.id} – ${c.name}`;
        sel.appendChild(o);
      });
    })
    .catch(err => console.error('Lỗi tải categories:', err));

  // — 3. Load user lên <select id="created_by">
  fetch('http://localhost:3003/api/users')
    .then(r => r.json())
    .then(list => {
      const sel = document.getElementById('created_by');
      if (!sel) return;
      sel.innerHTML = '<option value="">-- Người tạo --</option>';
      list.forEach(u => {
        const o = document.createElement('option');
        o.value = u.id;
        o.textContent = `${u.id} – ${u.username} (${u.role})`;
        sel.appendChild(o);
      });
    })
    .catch(err => console.error('Lỗi tải users:', err));

  // — 4. Xử lý chọn file & tự động upload
  let uploadedFileInfo = null;
  const fileInput = document.getElementById('file_upload');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      // Hiển thị tạm file info
      document.getElementById('file_name').value = file.name;
      document.getElementById('file_type').value = mimeToShort(file.type);
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
          if (!res.file_url) throw new Error('Upload không trả file_url');
          // Ghi lại
          uploadedFileInfo = res;
          document.getElementById('file_path').value = res.file_url;
          document.getElementById('file_type').value = mimeToShort(res.file_type);
        })
        .catch(err => {
          console.error('Lỗi upload:', err);
          alert('Upload file thất bại!');
          uploadedFileInfo = null;
        });
    });
  }

  // — 5. Submit form thêm tài liệu
  const form = document.getElementById('uploadForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      // Bắt buộc phải upload thành công để có file_path
      if (!uploadedFileInfo || !uploadedFileInfo.file_url) {
        return alert('Bạn phải chọn và upload file trước!');
      }

      // Thu thập data
      const data = {
        title:         form.title.value.trim(),
        description:   form.description.value.trim(),
        file_path:     uploadedFileInfo.file_url,
        file_name:     uploadedFileInfo.file_name,
        file_type:     mimeToShort(uploadedFileInfo.file_type),
        file_size:     uploadedFileInfo.file_size,
        category_id:   form.category_id.value,
        created_by_id: form.created_by.value
      };

      // Kiểm tra bắt buộc
      if (!data.title || !data.category_id || !data.created_by_id) {
        return alert('Vui lòng nhập tiêu đề, chọn danh mục và người tạo!');
      }

      // Gửi API thêm mới
      fetch('http://localhost:3003/api/add_document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            alert('Đã thêm tài liệu thành công!');
            // Redirect về trang danh sách
            window.location.href = '/document';
          } else {
            alert('Lỗi thêm: ' + (res.error || 'Không xác định'));
          }
        })
        .catch(err => {
          console.error('Lỗi add_document:', err);
          alert('Lỗi khi thêm tài liệu!');
        });
    });
  }

  // — 6. Thêm hiệu ứng focus/blur cho input, select, textarea
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(el => {
    el.addEventListener('focus', () => (el.style.background = '#eaf0ff'));
    el.addEventListener('blur',  () => (el.style.background = '#f8faff'));
  });

  // Hiệu ứng button submit
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.addEventListener('mousedown', () => (submitBtn.style.transform = 'scale(0.97)'));
    submitBtn.addEventListener('mouseup',   () => (submitBtn.style.transform = ''));
    submitBtn.addEventListener('mouseleave',() => (submitBtn.style.transform = ''));
  }
});