// admin_page.js - PHIÊN BẢN HOÀN CHỈNH

// ==================================================
// ===== KHAI BÁO BIẾN TOÀN CỤC VÀ HÀM TRỢ GIÚP =====
// ==================================================

const API_BASE_URL = 'http://127.0.0.1:3004/api';
let docCurrentPage = 1;
let docCurrentSearch = '';

/**
 * Hàm chuyển đổi số byte thành chuỗi dễ đọc (KB, MB, GB ).
 * @param {number} bytes - Kích thước tính bằng byte.
 * @returns {string} - Chuỗi đã được định dạng.
 */
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}



// ==================================================
// ===== CÁC HÀM FETCH VÀ RENDER DỮ LIỆU =========
// ==================================================

/**
 * Lấy và hiển thị danh sách người dùng.
 */
function fetchUsers() {
    fetch(`${API_BASE_URL}/users`)
        .then(res => res.json())
        .then(res => {
            if (!res.success) throw new Error(res.error);
            const users = res.data;
            const tbody = document.querySelector('#userTable tbody');
            tbody.innerHTML = '';
            document.getElementById('userCount').textContent = users.length;

            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center">Không có người dùng nào.</td></tr>`;
            } else {
                users.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.password}</td>
                        <td>${user.full_name || ''}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td><span class="status ${user.is_active ? 'active' : ''}">${user.is_active ? 'Hoạt động' : 'Vô hiệu'}</span></td>
                        <td>
                            <button class="btn edit-user-btn" data-id="${user.id}">Sửa</button>
                            <button class="btn delete-user-btn" data-id="${user.id}">Xoá</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        })
        .catch(err => {
            console.error('Lỗi khi tải danh sách người dùng:', err);
            document.querySelector('#userTable tbody').innerHTML = `<tr><td colspan="8" class="text-center-error">Không thể tải dữ liệu người dùng!</td></tr>`;
        });
}

/**
 * Lấy và hiển thị danh sách tài liệu (có phân trang và tìm kiếm).
 */

function fetchDocuments(page = 1, search = '') {
    docCurrentPage = page;
    docCurrentSearch = search;

    const params = new URLSearchParams({ page, search });
    const url = `${API_BASE_URL}/documents?${params.toString()}`;

    const tbody = document.querySelector('#documentTable tbody');
    tbody.innerHTML = `<tr><td colspan="10" class="text-center">Đang tải dữ liệu...</td></tr>`;

    fetch(url)
        .then(res => {
            // Kiểm tra xem response có phải là JSON hợp lệ không trước khi parse
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return res.json();
            }
            // Nếu không phải JSON, có thể là lỗi server (trả về HTML)
            throw new Error('API không trả về dữ liệu dạng JSON.');
        })
        .then(response => {
            // --- BƯỚC GỠ LỖI: IN DỮ LIỆU THÔ TỪ API RA CONSOLE ---
            console.log('Dữ liệu thực tế nhận được từ API /documents:', response);

            // --- KIỂM TRA CẤU TRÚC DỮ LIỆU ---
            if (!response.success || typeof response.data !== 'object' || !Array.isArray(response.data.results)) {
                // Ném lỗi với thông báo cụ thể hơn
                throw new Error('Cấu trúc dữ liệu API trả về không như mong đợi.');
            }

            const documents = response.data.results;
            const totalDocuments = response.data.total;
            const totalPages = response.data.total_pages;
            const currentPage = response.data.page;

            document.getElementById('documentCount').textContent = totalDocuments;
            tbody.innerHTML = '';

            if (documents.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" class="text-center">Không có tài liệu nào phù hợp.</td></tr>`;
            } else {
                documents.forEach(doc => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${doc.id}</td>
                        <td>${doc.title}</td>
                        <td>${doc.description || ''}</td>
                        <td><a href="${doc.file_path}" target="_blank">Xem file</a></td>
                        <td>${doc.file_name}</td>
                        <td>${doc.file_type}</td>
                        <td>${formatBytes(doc.file_size)}</td>
                        <td>${doc.category_name || ''}</td>
                        <td>${doc.created_by_username || ''}</td>
                        <td>
                            <button class="btn edit-doc-btn" data-id="${doc.id}">Sửa</button>
                            <button class="btn delete-doc-btn" data-id="${doc.id}">Xoá</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            renderPagination(currentPage, totalPages);
        })
        .catch(err => {
            console.error('Lỗi chi tiết trong fetchDocuments:', err);
            tbody.innerHTML = `<tr><td colspan="10" class="text-center-error"><b>Lỗi tải tài liệu:</b> ${err.message}</td></tr>`;
        });
}


/**
 * Vẽ các nút phân trang cho bảng tài liệu.
 */
function renderPagination(current, total) {
    const pager = document.getElementById('pagination');
    if (!pager) return;
    pager.innerHTML = '';
    if (total > 1) {
        for (let i = 1; i <= total; i++) {
            pager.innerHTML += `<button class="page-btn" data-page="${i}" ${i === current ? 'disabled' : ''}>${i}</button>`;
        }
    }
}

// ==================================================
// ===== CÁC HÀM THIẾT LẬP MODAL (SETUP) =========
// ==================================================

/**
 * Thiết lập cho modal "Thêm người dùng".
 */
function setupAddUserModal() {
    const modal = document.getElementById('addUserModal');
    const openBtn = document.getElementById('openAddUserModalBtn');
    const closeBtn = document.getElementById('closeAddUserModal');
    const form = document.getElementById('addUserForm');
    const msg = document.getElementById('addUserMsg');

    if (!modal || !openBtn || !closeBtn || !form) return;

    const openModal = () => {
        form.reset();
        msg.textContent = '';
        modal.style.display = 'flex';
    };

    const closeModal = () => modal.style.display = 'none';

    const submitHandler = (e) => {
        e.preventDefault();
        const payload = {
            username: form.addUsername.value.trim(),
            password: form.addPassword.value,
            full_name: form.addFullname.value.trim(),
            email: form.addEmail.value.trim(),
            role: form.addRole.value,
            is_active: form.addStatus.checked,
        };
        if (!payload.username || !payload.password) {
            msg.textContent = 'Tên người dùng và mật khẩu là bắt buộc.';
            return;
        }
        msg.textContent = 'Đang tạo...';
        fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json().then(data => {
                if (!res.ok) throw new Error(data.error || 'Lỗi không xác định.');
                return data;
            }))
            .then(data => {
                msg.textContent = 'Tạo người dùng thành công!';
                fetchUsers();
                setTimeout(closeModal, 1000);
            })
            .catch(err => msg.textContent = err.message);
    };

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    form.addEventListener('submit', submitHandler);
}

/**
 * Thiết lập cho modal "Sửa người dùng".
 */
function setupEditUserModal() {
    const modal = document.getElementById('editUserModal');
    const closeBtn = document.getElementById('closeEditUserModal');
    const form = document.getElementById('editUserForm');
    const msg = document.getElementById('editUserMsg');
    const userTable = document.getElementById('userTable');

    if (!modal || !closeBtn || !form || !userTable) return;

    const openModalWithData = (userId) => {
        form.reset();
        msg.textContent = 'Đang tải...';
        modal.style.display = 'flex';
        form.setAttribute('data-user-id', userId);

        fetch(`${API_BASE_URL}/users/${userId}`)
            .then(res => res.json())
            .then(res => {
                if (!res.success) throw new Error(res.error);
                const user = res.data;
                form.editUsername.value = user.username;
                form.editPassword.value = user.password;
                form.editFullName.value = user.full_name || '';
                form.editEmail.value = user.email;
                form.editRole.value = user.role;
                form.editStatus.checked = user.is_active;
                msg.textContent = '';
            })
            .catch(err => msg.textContent = err.message);
    };

    const closeModal = () => modal.style.display = 'none';

    const submitHandler = (e) => {
        e.preventDefault();
        const userId = form.getAttribute('data-user-id');
        const payload = {
            username: form.editUsername.value.trim(),
            password: form.editPassword.value,
            full_name: form.editFullName.value.trim(),
            email: form.editEmail.value.trim(),
            role: form.editRole.value,
            is_active: form.editStatus.checked,
        };
        if (!payload.username || !payload.email) {
            msg.textContent = 'Tên người dùng và email là bắt buộc.';
            return;
        }
        msg.textContent = 'Đang cập nhật...';
        fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json().then(data => {
                if (!res.ok) throw new Error(data.error || 'Lỗi không xác định.');
                return data;
            }))
            .then(data => {
                msg.textContent = 'Cập nhật thành công!';
                msg.style.color = 'green';
                fetchUsers();
                setTimeout(closeModal, 1000);
            })
            .catch(err => msg.textContent = err.message);
    };

    closeBtn.addEventListener('click', closeModal);
    form.addEventListener('submit', submitHandler);
    userTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-user-btn')) {
            openModalWithData(e.target.dataset.id);
        }
    });
}

/**
 * Thiết lập cho modal "Thêm tài liệu".
 */
function setupAddDocModal() {
    const modal = document.getElementById('addDocModal');
    const openBtn = document.getElementById('add-doc-btn');
    const closeBtn = document.getElementById('closeAddDocModal');
    const form = document.getElementById('addDocForm');
    const msg = document.getElementById('addDocMsg');
    const fileInput = document.getElementById('addDocFile');

    if (!modal || !openBtn || !closeBtn || !form || !fileInput) return;

    const openModal = () => {
        form.reset();
        msg.textContent = '';
        modal.style.display = 'flex';
        msg.textContent = 'Đang tải tùy chọn...';
        Promise.all([
            fetch(`${API_BASE_URL}/categories`).then(res => res.json()),
            fetch(`${API_BASE_URL}/users`).then(res => res.json())
        ]).then(([catRes, userRes]) => {
            if (!catRes.success || !userRes.success) throw new Error('Lỗi tải dữ liệu select.');

            const catSelect = form.addDocCategory;
            catSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
            catRes.data.forEach(c => catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);

            const userSelect = form.addDocEditor;
            userSelect.innerHTML = '<option value="">-- Chọn người tạo --</option>';
            userRes.data.forEach(u => userSelect.innerHTML += `<option value="${u.id}">${u.username}</option>`);
            msg.textContent = '';
        }).catch(err => msg.textContent = err.message);
    };

    const closeModal = () => modal.style.display = 'none';

    const handleFileSelect = () => {
        const file = fileInput.files[0];
        if (!file) return;
        form.addDocFileName.value = file.name;
        form.addDocType.value = file.name.split('.').pop().toUpperCase();
        form.addDocSize.value = formatBytes(file.size);
        form.addDocPath.value = 'Sẽ có sau khi upload...';
    };

    const submitHandler = (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            msg.textContent = 'Vui lòng chọn một file.';
            return;
        }
        msg.textContent = 'Đang upload file...';

        const formData = new FormData();
        formData.append('file', file);

        fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: formData })
            .then(res => res.json().then(data => {
                if (!res.ok) throw new Error(data.error || 'Lỗi upload.');
                return data;
            }))
            .then(uploadRes => {
                if (!uploadRes.success) throw new Error(uploadRes.error);
                msg.textContent = 'Đang tạo tài liệu...';
                const payload = {
                    title: form.addDocTitle.value.trim(),
                    description: form.addDocDescription.value.trim(),
                    category_id: form.addDocCategory.value,
                    created_by_id: form.addDocEditor.value,
                    ...uploadRes.data // Gộp thông tin file từ API upload
                };
                return fetch(`${API_BASE_URL}/documents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            })
            .then(res => res.json().then(data => {
                if (!res.ok) throw new Error(data.error || 'Lỗi tạo tài liệu.');
                return data;
            }))
            .then(createRes => {
                msg.textContent = 'Tạo tài liệu thành công!';
                msg.style.color = '#04ad1dff';
                fetchDocuments(1, ''); // Quay về trang đầu
                setTimeout(closeModal, 1000);
            })
            .catch(err => msg.textContent = err.message);
    };

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    fileInput.addEventListener('change', handleFileSelect);
    form.addEventListener('submit', submitHandler);
}

/**
 * Thiết lập cho modal "Sửa tài liệu".
 */
let openEditDocModal;

/**
 * Thiết lập các sự kiện và logic cho modal "Sửa tài liệu".
 * Hàm này chỉ chạy MỘT LẦN khi trang tải xong.
 */
function setupEditDocModal() {
    // 1. Lấy các phần tử DOM cần thiết cho modal
    const modal = document.getElementById('editDocModal');
    const closeBtn = document.getElementById('closeEditDocModal');
    const form = document.getElementById('editDocForm');
    const msg = document.getElementById('editDocMsg');
    const fileInput = document.getElementById('editDocFile');

    // Kiểm tra sự tồn tại của các phần tử
    if (!modal || !closeBtn || !form || !msg || !fileInput) {
        console.error("Lỗi: Không tìm thấy một hoặc nhiều phần tử của modal 'Sửa tài liệu'.");
        return;
    }

    // Biến để lưu dữ liệu gốc của tài liệu đang được sửa
    let originalDocData = {};

    // 2. Định nghĩa hàm mở modal và tải dữ liệu
    // Gán hàm này cho biến toàn cục đã khai báo ở trên
    openEditDocModal = (docId) => {
        form.reset();
        msg.textContent = 'Đang tải dữ liệu...';
        msg.style.color = '#333';
        modal.style.display = 'flex';
        form.setAttribute('data-doc-id', docId);

        // Tải song song 3 yêu cầu: danh mục, người dùng, và chi tiết tài liệu
        Promise.all([
            fetch(`${API_BASE_URL}/categories`).then(res => res.json()),
            fetch(`${API_BASE_URL}/users`).then(res => res.json()),
            fetch(`${API_BASE_URL}/documents/${docId}`).then(res => res.json())
        ])
            .then(([catRes, userRes, docRes]) => {
                // Kiểm tra kỹ từng response
                if (!catRes.success) throw new Error('Lỗi tải danh mục.');
                if (!userRes.success) throw new Error('Lỗi tải người dùng.');
                if (!docRes.success) throw new Error('Lỗi tải chi tiết tài liệu.');

                const doc = docRes.data;
                originalDocData = doc; // Lưu lại dữ liệu gốc để dùng khi submit

                // Điền dữ liệu vào các ô select
                const catSelect = form.editDocCategory;
                catSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
                catRes.data.forEach(c => catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);

                const userSelect = form.editDocEditor;
                userSelect.innerHTML = '<option value="">-- Chọn người tạo --</option>';
                userRes.data.forEach(u => userSelect.innerHTML += `<option value="${u.id}">${u.username}</option>`);

                // Điền dữ liệu tài liệu vào form
                form.editDocTitle.value = doc.title;
                form.editDocDescription.value = doc.description || '';
                form.editDocPath.value = doc.file_path;
                form.editDocFileName.value = doc.file_name;
                form.editDocType.value = doc.file_type;
                form.editDocSize.value = formatBytes(doc.file_size); // Sử dụng hàm formatBytes
                catSelect.value = doc.category_id;
                userSelect.value = doc.created_by_id;

                msg.textContent = ''; // Xóa thông báo tải
            })
            .catch(err => {
                console.error("Lỗi trong openEditDocModal:", err);
                msg.textContent = err.message;
                msg.style.color = '#e03a3a';
            });
    };

    // 3. Định nghĩa hàm xử lý khi submit form
    const submitHandler = (e) => {
        e.preventDefault();
        const docId = form.getAttribute('data-doc-id');
        const file = fileInput.files[0];

        // Hàm con để thực hiện việc cập nhật, tránh lặp code
        const processUpdate = (fileInfo) => {
            const payload = {
                title: form.editDocTitle.value.trim(),
                description: form.editDocDescription.value.trim(),
                category_id: form.editDocCategory.value,
                created_by_id: form.editDocEditor.value,
                ...fileInfo // Gộp thông tin file (mới hoặc cũ)
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
                    fetchDocuments(docCurrentPage, docCurrentSearch); // Tải lại bảng ở trang hiện tại
                    setTimeout(() => modal.style.display = 'none', 1000);
                })
                .catch(err => {
                    msg.textContent = err.message;
                    msg.style.color = '#e03a3a';
                });
        };

        // Kiểm tra xem người dùng có chọn file mới không
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
                    processUpdate(uploadRes.data); // Cập nhật với thông tin file mới
                })
                .catch(err => {
                    msg.textContent = err.message;
                    msg.style.color = '#e03a3a';
                });
        } else {
            // Nếu không có file mới, dùng lại thông tin file cũ đã lưu
            const oldFileInfo = {
                file_path: originalDocData.file_path,
                file_name: originalDocData.file_name,
                file_type: originalDocData.file_type,
                file_size: originalDocData.file_size,
            };
            processUpdate(oldFileInfo);
        }
    };

    // 4. Gán các sự kiện cho các phần tử bên trong modal
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    form.addEventListener('submit', submitHandler);
}
// ==================================================
// ===== ĐIỂM KHỞI ĐỘNG CHÍNH (MAIN ENTRY POINT) =====
// ==================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Gán các sự kiện tĩnh một lần duy nhất ---
    const docSearchInput = document.getElementById('documentSearch');
    if (docSearchInput) {
        docSearchInput.addEventListener('input', (e) => fetchDocuments(1, e.target.value));
    }

    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                fetchDocuments(parseInt(e.target.dataset.page), docCurrentSearch);
            }
        });
    }

    const userTable = document.getElementById('userTable');
    if (userTable) {
        userTable.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-user-btn')) {
                const userId = e.target.dataset.id;
                if (confirm(`Bạn chắc chắn muốn xóa người dùng ID ${userId}?`)) {
                    fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' })
                        .then(res => res.json().then(data => {
                            if (!res.ok) throw new Error(data.error);
                            return data;
                        }))
                        .then(data => {
                            alert('Xóa thành công!');
                            fetchUsers();
                        })
                        .catch(err => alert(`Lỗi: ${err.message}`));
                }
            }
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

    // --- Thiết lập các modal ---
    setupAddUserModal();
    setupEditUserModal();
    setupAddDocModal();
    setupEditDocModal();

    // --- Tải dữ liệu ban đầu ---
    fetchUsers();
    fetchDocuments();
});
