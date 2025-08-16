document.addEventListener('DOMContentLoaded', async () => {
  // MIME → dạng ngắn
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
      case 'image/png': return 'PNG';
      case 'image/gif': return 'GIF';
      case 'text/plain': return 'Text';
      case 'application/zip':
      case 'application/x-zip-compressed': return 'ZIP';
      case 'application/x-rar-compressed': return 'RAR';
      case 'audio/mpeg': return 'MP3';
      case 'video/mp4': return 'MP4';
      default: return mime.split('/').pop().toUpperCase();
    }
  }

  const API_BASE_URL = 'http://127.0.0.1:3004/api';

  function getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('loggedInUser'));
      return user && user.id ? user.id : null;
    } catch {
      return null;
    }
  }

  function apiFetch(url, options = {}) {
    options.credentials = 'include';
    if (!options.headers) options.headers = {};
    if (options.body && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }
    return fetch(url, options)
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || `Lỗi HTTP ${response.status}`);
          }).catch(() => {
            throw new Error(`Lỗi HTTP ${response.status}`);
          });
        }
        if (response.status === 204) return { success: true };
        return response.json();
      });
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Lấy userId từ URL
  const match = window.location.search.match(/(?:\?id=|&id=)(\d+)/);
  const userId = match ? match[1] : null;
  const userSpan = document.getElementById('userId');
  const loginBtn = document.getElementById('login-btn');

  if (!userId) {
    if (userSpan) userSpan.textContent = 'Thiếu ID trên URL!';
    return;
  }

  // Fetch info user
  let user;
  try {
    const r = await fetch(`http://localhost:3004/api/users/${userId}`);
    if (!r.ok) throw new Error(r.status);
    const res = await r.json();
    if (!res.success || !res.data) throw new Error('Không tìm thấy user!');
    user = res.data;
    if (userSpan) {
      userSpan.textContent = `Xin chào, ${user.username} (ID: ${user.id})`;
    }
    if (loginBtn) loginBtn.style.display = 'none';
  } catch (err) {
    console.error('Lỗi lấy user:', err);
    if (userSpan) userSpan.textContent = 'Không thể lấy thông tin user!';
    return;
  }

  function fetchDocuments(userId) {
    const url = `${API_BASE_URL}/my-documents/${userId}`;
    const tbody = document.querySelector('#documentTable tbody');
    tbody.innerHTML = `<tr><td colspan="10" class="text-center">Đang tải dữ liệu...</td></tr>`;

    fetch(url)
      .then(res => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return res.json();
        }
        throw new Error('API không trả về dữ liệu dạng JSON.');
      })
      .then(response => {
        console.log('Dữ liệu thực tế nhận được từ API /my-documents:', response);

        if (!response || !response.success || !Array.isArray(response.data)) {
          throw new Error('Cấu trúc dữ liệu API trả về không như mong đợi.');
        }

        const documents = response.data;
        // document.getElementById('documentCount').textContent = documents.length;
        tbody.innerHTML = '';

        if (documents.length === 0) {
          tbody.innerHTML = `<tr><td colspan="10" class="text-center">Không có tài liệu nào phù hợp.</td></tr>`;
        } else {
          documents.forEach(doc => {
            const tr = document.createElement('tr');
            const fileUrl = `http://127.0.0.1:3004${doc.file_path}`;
            tr.innerHTML = `
                        <td>${doc.id}</td>
                        <td>${doc.title}</td>
                        <td>${doc.description || ''}</td>
                        <td><a href="${fileUrl}" target="_blank">Xem file</a></td>
                        <td>${doc.file_name}</td>
                        <td>${doc.file_type}</td>
                        <td>${formatBytes(doc.file_size)}</td>
                        <td>${doc.category_name || ''}</td>
                        <td>
                            <button class="btn edit-doc-btn" data-id="${doc.id}">Sửa</button>
                            <button class="btn delete-doc-btn" data-id="${doc.id}">Xoá</button>
                        </td>
                    `;
            tbody.appendChild(tr);
          });
        }
        // KHÔNG renderPagination ở đây vì không có phân trang
      })
      .catch(err => {
        console.error('Lỗi chi tiết trong fetchDocuments:', err);
        tbody.innerHTML = `<tr><td colspan="10" class="text-center-error"><b>Lỗi tải tài liệu:</b> ${err.message}</td></tr>`;
      });
  }

  const docTable = document.getElementById('documentTable');
  if (docTable) {
    // Sử dụng một addEventListener duy nhất cho toàn bộ bảng tài liệu
    docTable.addEventListener('click', (e) => {
      const target = e.target; // Lưu lại phần tử được click để dễ sử dụng

      // --- XỬ LÝ NÚT SỬA ---
      // Kiểm tra xem phần tử được click có phải là nút "Sửa" không
      if (target.classList.contains('edit-doc-btn')) {
        const docId = target.dataset.id;
        console.log(`Yêu cầu sửa tài liệu ID: ${docId}`); // Thêm log để gỡ lỗi

        // Gọi hàm mở modal sửa (hàm này phải được định nghĩa trong setupEditDocModal)
        // Giả sử bạn đã có hàm openEditDocModal như đã hướng dẫn ở lần trước.
        openEditDocModal(docId);
        return; // Dừng lại sau khi đã xử lý, tránh chạy các kiểm tra không cần thiết bên dưới
      }

      // --- XỬ LÝ NÚT XÓA ---
      // Kiểm tra xem phần tử được click có phải là nút "Xóa" không
      if (target.classList.contains('delete-doc-btn')) {
        const docId = target.dataset.id;
        if (confirm(`Bạn chắc chắn muốn xóa tài liệu ID ${docId}?`)) {
          fetch(`${API_BASE_URL}/documents/${docId}`, { method: 'DELETE' })
            .then(res => res.json().then(data => {
              // Luôn kiểm tra res.ok để bắt lỗi HTTP (4xx, 5xx)
              if (!res.ok) {
                // Ném lỗi với thông báo từ server để khối .catch() bắt được
                throw new Error(data.error || 'Lỗi không xác định từ server.');
              }
              return data;
            }))
            .then(() => { // Không cần dùng biến `data` ở đây
              alert('Xóa thành công!');
              // Tải lại bảng tài liệu ở trang hiện tại để giữ nguyên vị trí
              fetchDocuments(docCurrentPage, docCurrentSearch);
            })
            .catch(err => {
              // Hiển thị thông báo lỗi một cách thân thiện
              alert(`Lỗi khi xóa tài liệu: ${err.message}`);
            });
        }
        return; // Dừng lại sau khi đã xử lý
      }
    });
  }

  // Khởi tạo modules
  initDropdown();
  initProfileModal(user);
  initPasswordModal(user);
  initDocumentManager(user);
  setupEditDocModal();

  // =========== helper ===========
  function initDropdown() {
    const btn = document.getElementById('userDropdownBtn');
    const menu = document.getElementById('userDropdownMenu');
    const log = document.getElementById('logoutBtn');
    if (!btn || !menu || !log) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      btn.classList.toggle('active');
    });
    document.addEventListener('click', e => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
        btn.classList.remove('active');
      }
    });
    log.addEventListener('click', e => {
      e.preventDefault();
      window.location.href = '/frontend/login/';
    });
  }

  function initProfileModal(user) {
    const modal = document.getElementById('profileModal');
    const openBtn = document.getElementById('profileBtn');
    const closeBtn = document.getElementById('closeProfileModal');
    const form = document.getElementById('profileForm');
    const msg = document.getElementById('profileMsg');
    if (!modal || !openBtn || !closeBtn || !form) return;

    openBtn.addEventListener('click', async e => {
      e.preventDefault();
      modal.style.display = 'flex';
      try {
        const r = await fetch(`http://localhost:3004/api/users/${user.id}`);
        if (!r.ok) throw 0;
        const d = await r.json();
        const u = d.data || {};
        form.profileUsername.value = u.username || '';
        form.profileEmail.value = u.email || '';
        form.profileFullname.value = u.full_name || '';
        msg.textContent = '';
      } catch {
        msg.textContent = 'Không thể lấy thông tin user!';
      }
    });
    closeBtn.addEventListener('click', () => modal.style.display = 'none');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const username = form.profileUsername.value.trim();
      const email = form.profileEmail.value.trim();
      const fullName = form.profileFullname.value.trim();

      const payload = {};
      if (username) payload.username = username;
      if (email) payload.email = email;
      if (fullName) payload.full_name = fullName;

      if (Object.keys(payload).length === 0) {
        msg.textContent = 'Vui lòng nhập thông tin cần cập nhật!';
        msg.style.color = '#e03a3a';
        return;
      }

      try {
        const r = await fetch(`http://localhost:3004/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const d = await r.json();
        msg.style.color = d.success ? '#1bb934' : '#e03a3a';
        msg.textContent = d.success ? 'Cập nhật thành công!' : (d.error || 'Lỗi cập nhật!');
        if (d.success) setTimeout(() => modal.style.display = 'none', 800);
      } catch {
        msg.style.color = '#e03a3a';
        msg.textContent = 'Lỗi khi cập nhật!';
      }
    });
  }

  function initPasswordModal(user) {
    const modal = document.getElementById('changePasswordModal');
    const openBtn = document.getElementById('changePasswordBtn');
    const closeBtn = document.getElementById('closeChangePasswordModal');
    const form = document.getElementById('changePasswordForm');
    const msg = document.getElementById('changePasswordMsg');
    if (!modal || !openBtn || !closeBtn || !form) return;

    openBtn.addEventListener('click', e => {
      e.preventDefault();
      form.reset(); msg.textContent = '';
      modal.style.display = 'flex';
    });
    closeBtn.addEventListener('click', () => modal.style.display = 'none');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const cur = form.currentPassword.value.trim();
      const nxt = form.newPassword.value.trim();
      const cf = form.confirmPassword.value.trim();
      if (!cur || !nxt || !cf) {
        msg.textContent = 'Vui lòng nhập đầy đủ!'; msg.style.color = '#e03a3a'; return;
      }
      if (nxt !== cf) {
        msg.textContent = 'Mật khẩu mới không khớp!'; msg.style.color = '#e03a3a'; return;
      }
      try {
        const r = await fetch('http://localhost:3004/api/me/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            currentPassword: cur,
            newPassword: nxt
          })
        });
        const d = await r.json();
        msg.style.color = d.success ? '#1bb934' : '#e03a3a';
        msg.textContent = d.success ? 'Đổi mật khẩu thành công!' : (d.error || 'Đổi mật khẩu thất bại');
        if (d.success) setTimeout(() => modal.style.display = 'none', 800);
      } catch {
        msg.style.color = '#e03a3a';
        msg.textContent = 'Lỗi server!';
      }
    });
  }

  function loadCategories(selectId) {
    fetch('http://localhost:3004/api/categories')
      .then(r => r.json())
      .then(res => {
        const list = res && res.success && Array.isArray(res.data) ? res.data : [];
        const sel = document.getElementById(selectId);
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Danh mục --</option>';
        list.forEach(c => {
          const o = document.createElement('option');
          o.value = c.id;
          o.textContent = c.name;
          sel.appendChild(o);
        });
      });
  }

  function fetchDocs(userId) {
    const url = `${API_BASE_URL}/my-documents/${userId}`;
    const tbody = document.querySelector('#documentTable tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="10" class="text-center">Đang tải dữ liệu...</td></tr>`;

    fetch(url)
      .then(res => res.json())
      .then(response => {
        if (!response || !response.success || !Array.isArray(response.data)) {
          throw new Error('Cấu trúc dữ liệu API trả về không như mong đợi.');
        }
        const documents = response.data;
        tbody.innerHTML = '';
        if (documents.length === 0) {
          tbody.innerHTML = `<tr><td colspan="10" class="text-center">Không có tài liệu nào phù hợp.</td></tr>`;
        } else {
          documents.forEach(doc => {
            const tr = document.createElement('tr');
            const fileUrl = `http://127.0.0.1:3004${doc.file_path}`;
            tr.innerHTML = `
                        <td>${doc.id}</td>
                        <td>${doc.title}</td>
                        <td>${doc.description || ''}</td>
                        <td><a href="${fileUrl}" target="_blank">${doc.file_name}</a></td>
                        <td>${doc.file_name}</td>
                        <td>${doc.file_type}</td>
                        <td>${formatBytes(doc.file_size)}</td>
                        <td>${doc.category_name || ''}</td>
                        <td>
                            <button class="btn edit-doc-btn" data-id="${doc.id}">Sửa</button>
                            <button class="btn delete-doc-btn" data-id="${doc.id}">Xoá</button>
                        </td>
                    `;
            tbody.appendChild(tr);
          });
        }
      })
      .catch(err => {
        console.error('Lỗi chi tiết trong fetchDocuments:', err);
        tbody.innerHTML = `<tr><td colspan="10" class="text-center-error"><b>Lỗi tải tài liệu:</b> ${err.message}</td></tr>`;
      });
  }

  function initDocumentManager(user) {
    const openBtn = document.getElementById('manageDocumentBtn');
    const modal = document.getElementById('manageDocumentModal');
    const closeBtn = document.getElementById('closeManageDocumentModal');
    const t1 = document.getElementById('tabListBtn');
    const t2 = document.getElementById('tabUploadBtn');
    if (!openBtn || !modal || !closeBtn || !t1 || !t2) return;

    openBtn.addEventListener('click', e => {
      e.preventDefault();
      modal.style.display = 'flex';
      setActiveTab('tabListBtn', 'docListPane');
      loadCategories('category_id');
      fetchDocs(user.id);
    });
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    t1.addEventListener('click', () => setActiveTab('tabListBtn', 'docListPane'));
    t2.addEventListener('click', () => setActiveTab('tabUploadBtn', 'docUploadPane'));

    const fInp = document.getElementById('file_upload');
    const msgUp = document.getElementById('uploadDocMsg');
    const fForm = document.getElementById('uploadDocForm');
    let lastFileData = null;

    if (fInp) {
      fInp.addEventListener('change', () => {
        const file = fInp.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        fetch('http://localhost:3004/api/upload', { method: 'POST', body: fd })
          .then(r => r.json())
          .then(res => {
            if (!res.success || !res.data || !res.data.file_path) throw '';
            lastFileData = res.data;
            document.getElementById('file_path').value = res.data.file_path;
            document.getElementById('file_name').value = res.data.file_name;
            document.getElementById('file_size').value = res.data.file_size;
            document.getElementById('file_type').value = res.data.file_type;
            msgUp.textContent = 'Tải file thành công!';
            msgUp.style.color = '#1bb934';
          })
          .catch(() => {
            lastFileData = null;
            msgUp.textContent = 'Lỗi tải file!';
            msgUp.style.color = '#e03a3a';
          });
      });
    }

    if (fForm) {
      fForm.addEventListener('submit', e => {
        e.preventDefault();
        const fileData = lastFileData || {
          file_path: fForm.file_path.value,
          file_name: fForm.file_name.value,
          file_type: fForm.file_type.value,
          file_size: fForm.file_size.value
        };
        const data = {
          title: fForm.title.value.trim(),
          description: fForm.description.value.trim(),
          ...fileData,
          category_id: fForm.category_id.value,
          created_by_id: user.id
        };
        if (!data.title || !data.file_path || !data.file_name || !data.category_id || !data.created_by_id) {
          msgUp.textContent = 'Vui lòng điền đầy đủ!';
          msgUp.style.color = '#e03a3a';
          return;
        }
        fetch('http://localhost:3004/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
          .then(r => r.json())
          .then(res => {
            msgUp.textContent = res.success ? 'Đăng thành công!' : (res.error || 'Lỗi đăng!');
            msgUp.style.color = res.success ? '#1bb934' : '#e03a3a';
            if (res.success) {
              fForm.reset();
              lastFileData = null;
              fetchDocs(user.id);
            }
          })
          .catch(() => {
            msgUp.textContent = 'Lỗi server!';
            msgUp.style.color = '#e03a3a';
          });
      });
    }
  }

  function setActiveTab(btnId, paneId) {
    ['tabListBtn', 'tabUploadBtn'].forEach(i => {
      document.getElementById(i)?.classList.remove('active');
    });
    ['docListPane', 'docUploadPane'].forEach(i => {
      document.getElementById(i)?.classList.remove('active');
    });
    document.getElementById(btnId)?.classList.add('active');
    document.getElementById(paneId)?.classList.add('active');
  }

  function setupEditDocModal() {
    const modal = document.getElementById('editDocModal');
    const closeBtn = document.getElementById('closeEditDocModal');
    const form = document.getElementById('editDocForm');
    const msg = document.getElementById('editDocMsg');
    const fileInput = document.getElementById('editDocFile');

    if (!modal || !closeBtn || !form || !msg || !fileInput) {
      console.error("Lỗi: Không tìm thấy một hoặc nhiều phần tử của modal 'Sửa tài liệu'.");
      return;
    }

    let originalDocData = {};

    openEditDocModal = (docId) => {
      form.reset();
      msg.textContent = 'Đang tải dữ liệu...';
      msg.style.color = '#333';
      modal.style.display = 'flex';
      form.setAttribute('data-doc-id', docId);

      Promise.all([
        fetch(`${API_BASE_URL}/categories`).then(res => res.json()),
        fetch(`${API_BASE_URL}/documents/${docId}`).then(res => res.json())
      ])
        .then(([catRes, docRes]) => {
          if (!catRes.success) throw new Error('Lỗi tải danh mục.');
          if (!docRes.success) throw new Error('Lỗi tải chi tiết tài liệu.');

          const doc = docRes.data;
          originalDocData = doc;


          const catSelect = form.editDocCategory;
          catSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
          catRes.data.forEach(c => catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);

          form.editDocTitle.value = doc.title;
          form.editDocDescription.value = doc.description || '';
          form.editDocPath.value = doc.file_path;
          form.editDocFileName.value = doc.file_name;
          form.editDocType.value = doc.file_type;
          form.editDocSize.value = formatBytes(doc.file_size);
          catSelect.value = doc.category_id;

          msg.textContent = '';
        })
        .catch(err => {
          console.error("Lỗi trong openEditDocModal:", err);
          msg.textContent = err.message;
          msg.style.color = '#e03a3a';
        });
    };

    const submitHandler = (e) => {
      e.preventDefault();
      const docId = form.getAttribute('data-doc-id');
      const file = fileInput.files[0];

      const processUpdate = (fileInfo) => {
        const payload = {
          title: form.editDocTitle.value.trim(),
          description: form.editDocDescription.value.trim(),
          category_id: form.editDocCategory.value,
          created_by_id: getCurrentUserId(), // Lấy user hiện tại
          ...fileInfo
        };

        msg.textContent = 'Đang cập nhật...';
        msg.style.color = '#333';

        fetch(`${API_BASE_URL}/documents/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(res => res.json().then(data => {
            if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật.');
            return data;
          }))
          .then(() => {
            msg.textContent = 'Cập nhật thành công!';
            msg.style.color = '#1bb934';
            // Gọi lại hàm load danh sách tài liệu nếu cần
            // const totalPages = docRes.data.total_pages;
            fetchDocuments(getCurrentUserId());
            setTimeout(() => modal.style.display = 'none', 1000);
          })
          .catch(err => {
            msg.textContent = err.message;
            msg.style.color = '#e03a3a';
          });
      };

      if (file) {
        msg.textContent = 'Đang upload file mới...';
        const formData = new FormData();
        formData.append('file', file);

        fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: formData })
          .then(res => res.json().then(data => {
            if (!res.ok) throw new Error(data.error || 'Lỗi upload.');
            if (!data.success) throw new Error(data.error);
            return data;
          }))
          .then(uploadRes => {
            processUpdate(uploadRes.data);
          })
          .catch(err => {
            msg.textContent = err.message;
            msg.style.color = '#e03a3a';
          });
      } else {
        const oldFileInfo = {
          file_path: originalDocData.file_path,
          file_name: originalDocData.file_name,
          file_type: originalDocData.file_type,
          file_size: originalDocData.file_size,
        };
        processUpdate(oldFileInfo);
      }
    };

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    form.addEventListener('submit', submitHandler);
  }
});