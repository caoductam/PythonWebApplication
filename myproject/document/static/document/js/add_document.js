// 1. Load danh mục và user
fetch('http://localhost:3003/api/category_id')
  .then(res => res.json())
  .then(categories => {
      const select = document.getElementById('category_id_id');
      categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.id;
          option.textContent = cat.id + ' - ' + cat.name;
          select.appendChild(option);
      });
  })
  .catch(err => {
      console.error('Lỗi fetch category:', err);
  });

fetch('http://localhost:3003/api/user_id')
  .then(res => res.json())
  .then(users => {
      const select = document.getElementById('created_by_id');
      users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = user.id + ' - ' + user.username + ' - ' + user.role;
          select.appendChild(option);
      });
  })
  .catch(err => {
      console.error('Lỗi fetch user:', err);
  });

// 2. Xử lý chọn file
let uploadedFileInfo = null; // Lưu thông tin file sau khi upload

document.getElementById('file_upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('file_name').value = file.name;
        document.getElementById('file_type').value = file.type;
        document.getElementById('file_size').value = file.size + ' bytes';
        document.getElementById('file_path').value = '';

        // Tự động upload file khi chọn
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
                uploadedFileInfo = data; // Lưu lại để dùng khi submit
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

// 3. Submit form thêm tài liệu
document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Kiểm tra đã upload file chưa
    if (!uploadedFileInfo || !uploadedFileInfo.file_url) {
        alert('Bạn phải chọn và upload file trước!');
        return;
    }

    // Lấy dữ liệu từ form
    const data = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        file_path: uploadedFileInfo.file_url,
        file_name: uploadedFileInfo.file_name,
        file_type: uploadedFileInfo.file_type,
        file_size: uploadedFileInfo.file_size,
        category_id_id: document.getElementById('category_id_id').value,
        created_by_id: document.getElementById('created_by_id').value
    };

    fetch('http://localhost:3003/api/add_document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirect_url || '/'; // hoặc trang index
        } else {
            alert('Lỗi: ' + (data.error || 'Không xác định'));
        }
    })
    .catch(err => alert('Lỗi gửi dữ liệu!'));
});

// 4. Hiệu ứng focus cho input/select (giữ nguyên như bạn đã làm)
document.addEventListener('DOMContentLoaded', function () {
  const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], select');
  inputs.forEach(input => {
    input.addEventListener('focus', function () {
      this.style.background = '#eaf0ff';
    });
    input.addEventListener('blur', function () {
      this.style.background = '#f8faff';
    });
  });

  // Hiệu ứng nút bấm
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.addEventListener('mousedown', function () {
      this.style.transform = 'scale(0.97)';
    });
    submitBtn.addEventListener('mouseup', function () {
      this.style.transform = '';
    });
    submitBtn.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  }

  // Hiệu ứng hover cho checkbox label
  const checkboxLabel = document.querySelector('label input[type="checkbox"]');
  if (checkboxLabel) {
    const label = checkboxLabel.parentElement;
    label.addEventListener('mouseenter', function () {
      label.style.background = '#eaf0ff';
      label.style.borderRadius = '6px';
      label.style.padding = '2px 6px';
    });
    label.addEventListener('mouseleave', function () {
      label.style.background = '';
      label.style.padding = '';
    });
  }
});