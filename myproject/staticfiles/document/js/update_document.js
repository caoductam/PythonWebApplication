const docId = window.location.pathname.match(/update\/(\d+)/) ? window.location.pathname.match(/update\/(\d+)/)[1] : null;
if (docId) document.getElementById('doc_id').value = docId;

// 1. Load danh mục và user
fetch('http://localhost:3003/api/categories')
  .then(res => res.json())
  .then(categories => {
      const select = document.getElementById('category_id');
      categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.id;
          option.textContent = cat.id + ' - ' + cat.name;
          select.appendChild(option);
      });
  });

fetch('http://localhost:3003/api/users')
  .then(res => res.json())
  .then(users => {
      const select = document.getElementById('created_by_id');
      users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = user.id + ' - ' + user.username + ' - ' + user.role;
          select.appendChild(option);
      });
  });

// 2. Load dữ liệu document cần sửa
if (docId) {
    fetch(`http://localhost:3003/api/documents/${docId}`)
      .then(res => res.json())
      .then(doc => {
          document.getElementById('title').value = doc.title || '';
          document.getElementById('description').value = doc.description || '';
          document.getElementById('file_path').value = doc.file_path || '';
          document.getElementById('file_name').value = doc.file_name || '';
          document.getElementById('file_type').value = doc.file_type || '';
          document.getElementById('file_size').value = doc.file_size || '';
          document.getElementById('category_id').value = doc.category_id_id || doc.category_id || '';
          document.getElementById('created_by_id').value = doc.created_by_id || '';
      });
}

// 3. Xử lý upload file mới (nếu chọn)
let uploadedFileInfo = null;
document.getElementById('file_upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('file_name').value = file.name;
        document.getElementById('file_type').value = file.type;
        document.getElementById('file_size').value = file.size + ' bytes';
        document.getElementById('file_path').value = '';

        const formData = new FormData();
        formData.append('file', file);
        fetch('http://localhost:3003/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.file_url) {
                document.getElementById('file_path').value = data.file_url;
                uploadedFileInfo = data;
            } else {
                alert('Upload lỗi!');
                uploadedFileInfo = null;
            }
        })
        .catch(err => {
            alert('Upload lỗi!');
            uploadedFileInfo = null;
        });
    } else {
        document.getElementById('file_name').value = '';
        document.getElementById('file_type').value = '';
        document.getElementById('file_size').value = '';
        document.getElementById('file_path').value = '';
        uploadedFileInfo = null;
    }
});

// 4. Submit form cập nhật
document.getElementById('updateForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (!docId) {
        alert('Không xác định được tài liệu cần sửa!');
        return;
    }

    // Nếu có upload file mới thì lấy thông tin mới, không thì giữ thông tin cũ
    const file_path = uploadedFileInfo && uploadedFileInfo.file_url ? uploadedFileInfo.file_url : document.getElementById('file_path').value;
    const file_name = uploadedFileInfo && uploadedFileInfo.file_name ? uploadedFileInfo.file_name : document.getElementById('file_name').value;
    const file_type = uploadedFileInfo && uploadedFileInfo.file_type ? uploadedFileInfo.file_type : document.getElementById('file_type').value;
    const file_size = uploadedFileInfo && uploadedFileInfo.file_size ? uploadedFileInfo.file_size : document.getElementById('file_size').value;

    const data = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        file_path: file_path,
        file_name: file_name,
        file_type: file_type,
        file_size: file_size,
        category_id: document.getElementById('category_id').value,
        created_by_id: document.getElementById('created_by_id').value
    };

    fetch(`http://localhost:3003/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Cập nhật thành công!');
            window.location.href = '/document';
        } else {
            alert('Lỗi: ' + (data.error || 'Không xác định'));
        }
    })
    .catch(err => alert('Lỗi gửi dữ liệu!'));
});
