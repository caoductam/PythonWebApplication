// editor_list.js (hoặc bất cứ tên nào bạn dùng)
let currentPage   = 1;
let pageSize      = 10;
let currentSearch = '';

// Hàm fetch, render và gán sự kiện Xóa
function fetchDocuments(page = 1, search = '') {
  currentPage   = page;
  currentSearch = search;

  const url = `http://127.0.0.1:3003/api/documents`
            + `?page=${page}`
            + `&page_size=${pageSize}`
            + `&search=${encodeURIComponent(search)}`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    })
    .then(data => {
      const docs  = data.results || [];
      const tbody = document.querySelector('#document-table tbody');
      tbody.innerHTML = '';

      if (docs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" style="text-align:center;">Không có tài liệu nào.</td>
          </tr>`;
      } else {
        docs.forEach(doc => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${doc.id}</td>
            <td>${doc.title}</td>
            <td>${doc.description || ''}</td>
            <td>
              <a href="${doc.file_path}" target="_blank">
                ${doc.file_name}
              </a>
            </td>
            <td>${doc.file_name}</td>
            <td>${doc.file_type}</td>
            <td>${doc.file_size}</td>
            <td>${doc.category_name || ''}</td>
            <td>${doc.created_by_username || ''}</td>
            <td>
              <a href="/document/update/${doc.id}/" class="btn edit-btn">Sửa</a>
              <button class="btn delete-btn" data-id="${doc.id}">Xoá</button>
            </td>`;
          tbody.appendChild(tr);
        });
      }

      // Render pagination
      renderPagination(data.page, data.total_pages);

      // Gán event cho nút Xóa
      tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          const docId = btn.dataset.id;
          if (confirm('Bạn chắc chắn muốn xoá tài liệu này?')) {
            fetch(`http://127.0.0.1:3003/api/documents/${docId}`, {
              method: 'DELETE'
            })
            .then(res => {
              if (!res.ok) throw new Error('Delete failed');
              return res.json();
            })
            .then(resp => {
              if (resp.success) {
                alert('Đã xoá thành công!');
                fetchDocuments(currentPage, currentSearch);
              } else {
                alert('Lỗi xoá: ' + (resp.error || 'Unknown'));
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
      console.error('Fetch documents error:', err);
      alert('Không thể tải dữ liệu tài liệu!');
    });
}

// Hàm vẽ phân trang
function renderPagination(current, total) {
  const pager = document.getElementById('pagination');
  if (!pager) return;

  let html = '';
  if (total > 1) {
    for (let i = 1; i <= total; i++) {
      html += `<button 
                class="page-btn" 
                data-page="${i}" 
                ${i===current? 'disabled': ''}
               >${i}</button>`;
    }
  }
  pager.innerHTML = html;

  // Gán sự kiện chuyển trang
  pager.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      fetchDocuments(p, currentSearch);
    });
  });
}

// Gán sự kiện tìm kiếm realtime
const searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', function() {
    fetchDocuments(1, this.value);
  });
}

// Tạo div pagination nếu chưa có
if (!document.getElementById('pagination')) {
  const box = document.createElement('div');
  box.id = 'pagination';
  box.style.marginTop = '1em';
  document.querySelector('.container')?.appendChild(box);
}

// FETCH lần đầu
fetchDocuments(1, '');