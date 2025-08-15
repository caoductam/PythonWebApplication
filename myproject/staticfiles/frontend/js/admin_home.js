// =================================================================
// ===== ĐIỂM KHỞI ĐỘNG CHÍNH (MAIN ENTRY POINT) ====================
// =================================================================
function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user && user.id ? user.id : null;
  } catch {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Định nghĩa URL gốc của API ở một nơi duy nhất để dễ dàng thay đổi
  const API_BASE_URL = 'http://127.0.0.1:3004/api';


  // --- BƯỚC 1: KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP ---
  const loggedInUserString = localStorage.getItem('loggedInUser');
  if (!loggedInUserString) {
    alert('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.');
    // Giả sử trang login nằm ở thư mục gốc
    window.location.href = '/frontend/login'; // Đảm bảo đường dẫn này chính xác
    return; // Dừng thực thi ngay lập tức
  }

  let loggedInUser;
  try {
    loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // Kiểm tra cấu trúc tối thiểu của object user
    if (!loggedInUser || typeof loggedInUser.id === 'undefined' || !loggedInUser.username || !loggedInUser.role) {
      throw new Error('Dữ liệu người dùng trong localStorage không hợp lệ hoặc thiếu thông tin.');
    }
  } catch (error) {
    console.error('Lỗi khi parse dữ liệu người dùng:', error);
    localStorage.removeItem('loggedInUser'); // Xóa dữ liệu hỏng
    alert('Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại.');
    window.location.href = '/frontend/login'; // Đảm bảo đường dẫn này chính xác
    return;
  }



  // --- BƯỚC 2: NẾU ĐĂNG NHẬP HỢP LỆ, HIỂN THỊ THÔNG TIN VÀ KHỞI TẠO CÁC THÀNH PHẦN ---

  // Hiển thị lời chào
  const userInfoSpan = document.getElementById('userId'); // Đảm bảo ID này đúng với HTML
  if (userInfoSpan) {
    userInfoSpan.textContent = `Xin chào, ${loggedInUser.username}`;

  }



  // Gọi tất cả các hàm thiết lập và truyền vào các đối số cần thiết
  setupUserDropdown(API_BASE_URL);
  setupProfileModal(loggedInUser, API_BASE_URL);
  setupPasswordModal(loggedInUser, API_BASE_URL);
  setupMyDocumentsModal(loggedInUser, API_BASE_URL);
  setupAdminButton(loggedInUser);
});


// =================================================================
// ===== PHẦN 1: CÁC HÀM TIỆN ÍCH VÀ THIẾT LẬP CHUNG ===============
// =================================================================

/**
 * Hàm trợ giúp để xử lý fetch, bao gồm cả xử lý lỗi mạng và lỗi logic từ API.
 * Mạnh mẽ hơn, xử lý cả lỗi mạng và lỗi logic từ API.
 * @param {string} url - URL để fetch.
 * @param {object} options - Tùy chọn cho fetch (method, headers, body...).
 * @returns {Promise<object>} - Promise sẽ resolve với dữ liệu từ API, hoặc reject với một Error chứa thông báo lỗi.
 */
function apiFetch(url, options = {}) {
  options.credentials = 'include';

  if (!options.headers) {
    options.headers = {};
  }

  // CHỈ set Content-Type là JSON nếu body KHÔNG phải là FormData
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
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    });
}
/**
 * Thiết lập menu dropdown của người dùng và nút đăng xuất.
 */
function setupUserDropdown() {
  const btn = document.getElementById('userDropdownBtn');
  const menu = document.getElementById('userDropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!btn || !menu || !logoutBtn) {
    console.warn("Cảnh báo: Không tìm thấy các phần tử của dropdown người dùng.");
    return;
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra document
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  // Đóng dropdown khi click ra ngoài
  document.addEventListener('click', () => {
    if (menu.style.display === 'block') {
      menu.style.display = 'none';
    }
  });

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('loggedInUser');
    // localStorage.removeItem('authToken'); // Xóa cả token nếu có
    window.location.href = '/frontend/login'; // Đảm bảo đường dẫn này chính xác
  });
}

/**
 * Thiết lập nút chuyển hướng đến trang Admin dựa trên vai trò của người dùng.
 */
function setupAdminButton(user) {
  const adminBtn = document.getElementById('adminPageBtn');
  if (!adminBtn) return;

  // Hiển thị nút chỉ khi người dùng có vai trò là 'Admin'
  if (user && user.role === 'Admin') {
    adminBtn.style.display = 'block';
    adminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Đảm bảo đường dẫn này chính xác
      window.location.href = 'admin_page';
    });
  } else {
    adminBtn.style.display = 'none';
  }
}


// =================================================================
// ===== PHẦN 2: CÁC HÀM THIẾT LẬP MODAL ===========================
// =================================================================

/**
 * Thiết lập modal "Thông tin cá nhân".
 */
function setupProfileModal(user, apiBaseUrl) {
  const modal = document.getElementById('profileModal');
  const openBtn = document.getElementById('profileBtn');
  const closeBtn = document.getElementById('closeProfileModal');
  const form = document.getElementById('profileForm');
  const msg = document.getElementById('profileMsg');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!modal || !openBtn || !closeBtn || !form || !msg || !submitBtn) return;

  let originalData = {};

  // ... trong hàm setupProfileModal ...
  const openModal = () => {
    form.reset();
    msg.textContent = 'Đang tải...';
    modal.style.display = 'flex';
    submitBtn.disabled = true;

    // --- SỬA LẠI DÒNG NÀY ---
    // Quay lại sử dụng URL có ID của người dùng, vì backend của bạn đang cần nó
    apiFetch(`${apiBaseUrl}/users/${user.id}`)
      .then(response => {
        const userData = response.data;
        originalData = {
          username: userData.username || '',
          email: userData.email || '',
          full_name: userData.full_name || ''
        };

        form.profileUsername.value = originalData.username;
        form.profileEmail.value = originalData.email;
        form.profileFullname.value = originalData.full_name;

        msg.textContent = '';
      })
      .catch(error => {
        msg.textContent = `Lỗi tải thông tin: ${error.message}`;
        msg.style.color = '#e03a3a';
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  };

  // ... trong hàm setupProfileModal ...
  const submitHandler = (e) => {
    e.preventDefault();
    const payload = {};
    const currentUsername = form.profileUsername.value.trim();
    const currentEmail = form.profileEmail.value.trim();
    const currentFullname = form.profileFullname.value.trim();

    if (currentUsername !== originalData.username) payload.username = currentUsername;
    if (currentEmail !== originalData.email) payload.email = currentEmail;
    if (currentFullname !== originalData.full_name) payload.full_name = currentFullname;

    if (Object.keys(payload).length === 0) {
      msg.textContent = 'Không có thông tin nào thay đổi.';
      msg.style.color = '#333';
      return;
    }

    msg.textContent = 'Đang cập nhật...';
    msg.style.color = '#333';
    submitBtn.disabled = true;

    // --- SỬA LẠI DÒNG NÀY ---
    // Sử dụng URL có ID của người dùng để cập nhật, khớp với backend
    apiFetch(`${apiBaseUrl}/users/${user.id}`, {
      method: 'PATCH', // Hoặc 'PUT' nếu backend của bạn dùng PUT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(() => {
        msg.textContent = 'Cập nhật thành công!';
        msg.style.color = '#1bb934';

        // Cập nhật lại localStorage nếu username thay đổi
        if (payload.username) {
          const updatedUser = { ...user, username: payload.username };
          localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
          // Cập nhật lại lời chào ngay lập tức
          const userInfoSpan = document.getElementById('user-info-span');
          if (userInfoSpan) {
            userInfoSpan.textContent = `Xin chào, ${payload.username}`;
          }
        }

        setTimeout(() => modal.style.display = 'none', 1200);
      })
      .catch(error => {
        msg.textContent = `Lỗi cập nhật: ${error.message}`;
        msg.style.color = '#e03a3a';
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  };


  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  form.addEventListener('submit', submitHandler);
}

/**
 * Thiết lập modal "Đổi mật khẩu".
 */
function setupPasswordModal(user, apiBaseUrl) {
  const modal = document.getElementById('changePasswordModal');
  const openBtn = document.getElementById('changePasswordBtn');
  const closeBtn = document.getElementById('closeChangePasswordModal');
  const form = document.getElementById('changePasswordForm');
  const msg = document.getElementById('changePasswordMsg');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!modal || !openBtn || !closeBtn || !form || !msg || !submitBtn) return;

  const openModal = () => {
    form.reset();
    msg.textContent = '';
    modal.style.display = 'flex';
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;

    // 1. Kiểm tra dữ liệu phía client
    if (!currentPassword || !newPassword) {
      msg.textContent = 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.';
      return;
    }
    if (newPassword.length < 6) {
      msg.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
      return;
    }
    if (newPassword !== confirmPassword) {
      msg.textContent = 'Mật khẩu mới không khớp.';
      return;
    }

    // 2. Cung cấp phản hồi cho người dùng và vô hiệu hóa nút
    msg.textContent = 'Đang xử lý...';
    msg.style.color = '#333';
    submitBtn.disabled = true;

    // 3. Gửi yêu cầu đến server
    apiFetch(`${apiBaseUrl}/me/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    })
      .then(() => {
        // 4. Xử lý khi thành công
        msg.textContent = 'Đổi mật khẩu thành công!';
        msg.style.color = '#1bb934';
        setTimeout(() => modal.style.display = 'none', 1200);
      })
      .catch(error => {
        // 5. Xử lý khi thất bại
        msg.textContent = `Lỗi: ${error.message}`;
        msg.style.color = '#e03a3a';
      })
      .finally(() => {
        // 6. Luôn kích hoạt lại nút sau khi hoàn tất
        submitBtn.disabled = false;
      });
  };

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  form.addEventListener('submit', submitHandler);
}

/**
 * Thiết lập modal "Quản lý tài liệu của tôi".
 */
function setupMyDocumentsModal(user, apiBaseUrl) {
  const modal = document.getElementById('manageDocumentModal');
  const openBtn = document.getElementById('manageDocumentBtn');
  const closeBtn = document.getElementById('closeManageDocumentModal');
  const uploadForm = document.getElementById('uploadDocForm');
  const fileInput = document.getElementById('file_upload');
  const docListBody = document.getElementById('myDocList');
  const uploadMsg = document.getElementById('uploadDocMsg');

  if (!modal || !openBtn || !closeBtn || !uploadForm || !fileInput || !docListBody || !uploadMsg) return;

  const setActiveTab = (activeTab) => {
    document.getElementById('tabListBtn').classList.toggle('active', activeTab === 'list');
    document.getElementById('tabUploadBtn').classList.toggle('active', activeTab === 'upload');
    document.getElementById('docListPane').classList.toggle('active', activeTab === 'list');
    document.getElementById('docUploadPane').classList.toggle('active', activeTab === 'upload');
  };

  const fetchMyDocs = () => {
    docListBody.innerHTML = '<tr><td colspan="9" style="text-align:center">Đang tải...</td></tr>';
    const userid = getCurrentUserId(); // Lấy ID người dùng hiện tại
    apiFetch(`${apiBaseUrl}/my-documents/${userid}`) // API nhất quán
      .then(response => {
        const docs = response.data;
        docListBody.innerHTML = '';
        if (!docs || docs.length === 0) {
          docListBody.innerHTML = '<tr><td colspan="7" style="text-align:center">Bạn chưa có tài liệu nào.</td></tr>';
          return;
        }
        docs.forEach(doc => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
                        <td>${doc.id}</td>
                        <td>${doc.title}</td>
                        <td>${doc.description || 'N/A'}</td>
                        <td><a href="${doc.file_path}" target="_blank">${doc.file_name}</a></td>
                        <td>${doc.file_name}</td>
                        <td>${doc.file_type}</td>
                        <td>${(doc.file_size / 1024).toFixed(2)} KB</td>
                        <td>${doc.category_name || 'N/A'}</td>
                        <td><button class="btn delete-btn delete-doc-btn" data-id="${doc.id}">Xoá</button></td>
                    `;
          docListBody.appendChild(tr);
        });
      })
      .catch(error => {
        docListBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">${error.message}</td></tr>`;
      });
  };

  const deleteMyDoc = (docId) => {
    if (!confirm(`Bạn chắc chắn muốn xoá tài liệu ID ${docId}?`)) return;
    apiFetch(`${apiBaseUrl}/documents/${docId}`, { method: 'DELETE' })
      .then(() => {
        alert('Xóa thành công!');
        fetchMyDocs(); // Tải lại danh sách
      })
      .catch(error => alert(`Lỗi khi xóa: ${error.message}`));
  };

  // *** TỐI ƯU HÓA: SỬ DỤNG EVENT DELEGATION ***
  docListBody.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('delete-doc-btn')) {
      const docId = e.target.dataset.id;
      deleteMyDoc(docId);
    }
  });

  const handleFileUpload = () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadMsg.textContent = 'Đang tải file lên...';
    uploadMsg.style.color = '#333';
    const uploadSubmitBtn = uploadForm.querySelector('button[type="submit"]');
    uploadSubmitBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', file);

    apiFetch(`${apiBaseUrl}/upload`, { method: 'POST', body: formData })
      .then(response => {
        const fileData = response.data;
        uploadForm.file_path.value = fileData.file_path;
        uploadForm.file_name.value = fileData.file_name;
        uploadForm.file_size.value = fileData.file_size;
        uploadForm.file_type.value = fileData.file_type;
        uploadMsg.textContent = 'Tải file thành công! Vui lòng điền các thông tin còn lại.';
        uploadMsg.style.color = '#1bb934';
      })
      .catch(error => {
        uploadMsg.textContent = `Lỗi tải file: ${error.message}`;
        uploadMsg.style.color = '#e03a3a';
      })
      .finally(() => {
        uploadSubmitBtn.disabled = false;
      });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const uploadSubmitBtn = uploadForm.querySelector('button[type="submit"]');
    const payload = {
      title: uploadForm.title.value.trim(),
      description: uploadForm.description.value.trim(),
      file_path: uploadForm.file_path.value,
      file_name: uploadForm.file_name.value,
      file_type: uploadForm.file_type.value,
      file_size: uploadForm.file_size.value,
      category_id: uploadForm.category_id.value,
      created_by_id: getCurrentUserId()
    };

    if (!payload.title || !payload.file_path || !payload.category_id) {
      uploadMsg.textContent = 'Vui lòng điền tiêu đề, chọn file và danh mục.';
      uploadMsg.style.color = '#e03a3a';
      return;
    }

    uploadMsg.textContent = 'Đang đăng tài liệu...';
    uploadMsg.style.color = '#333';
    uploadSubmitBtn.disabled = true;

    apiFetch(`${apiBaseUrl}/documents`, { // API để tạo tài liệu mới
      method: 'POST',
      // headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(() => {
        uploadMsg.textContent = 'Đăng tài liệu thành công!';
        uploadMsg.style.color = '#1bb934';
        uploadForm.reset();
        setTimeout(() => {
          fetchMyDocs();
          setActiveTab('list');
        }, 1200);
      })
      .catch(error => {
        uploadMsg.textContent = `Lỗi: ${error.message}`;
        uploadMsg.style.color = '#e03a3a';
      })
      .finally(() => {
        uploadSubmitBtn.disabled = false;
      });
  };

  const loadCategoriesForUpload = () => {
    const select = document.getElementById('category_id');
    apiFetch(`${apiBaseUrl}/categories`)
      .then(response => {
        select.innerHTML = '<option value="">-- Chọn danh mục --</option>';
        response.data.forEach(cat => {
          select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
      })
      .catch(() => {
        select.innerHTML = `<option value="">Lỗi tải danh mục</option>`;
      });
  };

  openBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    setActiveTab('list');
    fetchMyDocs();
    loadCategoriesForUpload();
  });

  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  document.getElementById('tabListBtn').addEventListener('click', () => setActiveTab('list'));
  document.getElementById('tabUploadBtn').addEventListener('click', () => setActiveTab('upload'));
  fileInput.addEventListener('change', handleFileUpload);
  uploadForm.addEventListener('submit', handleFormSubmit);
}
