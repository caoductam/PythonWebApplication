let currentPage = 1;
let pageSize = 10;
let currentSearch = '';

function fetchDocuments(page = 1, search = '') {
    currentPage = page;
    currentSearch = search;
    const url = `http://127.0.0.1:3003/api/documents?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`;
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(response => {
            const docs = response.results || [];
            const tbody = document.querySelector('#document-table tbody');
            tbody.innerHTML = '';
            if (docs.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="10" style="text-align:center;">Không có tài liệu nào.</td>`;
                tbody.appendChild(tr);
            } else {
                docs.forEach(doc => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${doc.id}</td>
                        <td>${doc.title}</td>
                        <td>${doc.description || ''}</td>
                        <td><a href="${doc.file_path}" target="_blank">${doc.file_name}</a></td>
                        <td>${doc.file_name}</td>
                        <td>${doc.file_type}</td>
                        <td>${doc.file_size}</td>
                        <td>${doc.category_name || ''}</td>
                        <td>${doc.created_by_username || ''}</td>
                        <td>
                            <a href="/document/update/${doc.id}/" class="btn edit-btn">Sửa</a>
                            <button class="btn delete-btn" data-id="${doc.id}">Xoá</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            renderPagination(response.page, response.total_pages);

            // Gắn lại sự kiện xoá sau khi render bảng
            document.querySelectorAll('.btn.delete-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (confirm('Bạn chắc chắn muốn xoá tài liệu này?')) {
                        const docId = this.getAttribute('data-id');
                        fetch(`http://127.0.0.1:3003/api/documents/${docId}`, {
                            method: 'DELETE'
                        })
                        .then(res => {
                            if (!res.ok) throw new Error('Delete failed');
                            return res.json();
                        })
                        .then(data => {
                            if (data.success) {
                                alert('Đã xoá thành công!');
                                fetchDocuments(currentPage, currentSearch);
                            } else {
                                alert('Lỗi xoá: ' + (data.error || ''));
                            }
                        })
                        .catch(() => {
                            alert('Lỗi khi xoá tài liệu!');
                        });
                    }
                });
            });
        })
        .catch(err => {
            alert('Không thể tải dữ liệu tài liệu!');
        });
}

// Hàm render phân trang
function renderPagination(current, total) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    let html = '';
    if (total > 1) {
        for (let i = 1; i <= total; i++) {
            html += `<button class="page-btn" data-page="${i}" ${i === current ? 'disabled' : ''}>${i}</button> `;
        }
    }
    pagination.innerHTML = html;
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            fetchDocuments(parseInt(this.getAttribute('data-page')), currentSearch);
        });
    });
}

// Hàm lấy CSRF token (nếu dùng Django, không cần cho NodeJS API)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Tìm kiếm realtime
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', function () {
    fetchDocuments(1, this.value);
});

// Gọi lần đầu
fetchDocuments(1, '');

// Thêm div phân trang vào HTML (nếu chưa có)
if (!document.getElementById('pagination')) {
    const pagDiv = document.createElement('div');
    pagDiv.id = 'pagination';
    pagDiv.style.marginTop = '16px';
    document.querySelector('.container').appendChild(pagDiv);
}