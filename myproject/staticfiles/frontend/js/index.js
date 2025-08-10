// --- Thông tin trạng thái filter, phân trang, view ---
let currentPage = 1;
let pageSize = 12;
let currentSearch = '';
let currentCategory = '';
let currentFileType = '';
let currentView = 'grid'; // hoặc 'list'

// --- Fetch số liệu thống kê ---
fetch('http://localhost:3004/api/stats')
    .then(res => res.json())
    .then(stats => {
        document.querySelector('.stat-number.documents').textContent = stats.document_count;
        document.querySelector('.stat-number.categories').textContent = stats.category_count;
        document.querySelector('.stat-number.users').textContent = stats.user_count;
    });

// --- Fetch danh mục cho select ---
fetch('http://localhost:3004/api/categories')
    .then(res => res.json())
    .then(categories => {
        const select = document.getElementById('category-select');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    });

// --- Fetch file_type cho select ---
fetch('http://localhost:3004/api/filetypes')
    .then(res => res.json())
    .then(types => {
        const select = document.getElementById('format-select');
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        });
    });

// --- Hàm fetch và render tài liệu ---
function fetchDocuments(page = 1) {
    currentPage = page;
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);
    if (currentSearch) params.append('search', currentSearch);
    if (currentCategory) params.append('category_id', currentCategory);
    if (currentFileType) params.append('file_type', currentFileType);

    fetch('http://localhost:3004/api/documents?' + params.toString())
        .then(res => res.json())
        .then(data => {
            // Hiển thị số lượng
            document.getElementById('doc-count').textContent =
                `Hiển thị ${data.results.length} trong số ${data.total.toLocaleString()} tài liệu`;

            // Render danh sách tài liệu
            const docList = document.getElementById('doc-list');
            docList.className = 'doc-list ' + (currentView === 'list' ? 'list-view' : 'grid-view');
            if (data.results.length === 0) {
                docList.innerHTML = '<p>Không có tài liệu nào.</p>';
            } else {
                docList.innerHTML = data.results.map(doc => `
                    <div class="doc-item">
                        <a class="doc-title" href="${doc.file_path}" target="_blank">${doc.title}</a>
                        <div class="doc-meta">
                            <span>Mô tả: ${doc.description}</span>
                            <span>Danh mục: ${doc.category_name || ''}</span>
                            <span>Định dạng: ${doc.file_type}</span>
                            <span>Dung lượng: ${doc.file_size} KB</span>
                            <span>Người đăng: ${doc.created_by_username}</span>
                        </div>
                    </div>
                `).join('');
            }

            // Render phân trang
            renderPagination(data.page, data.total_pages);
        });
}

// --- Hàm render phân trang ---
function renderPagination(current, total) {
    const pagDiv = document.getElementById('doc-pagination');
    let html = '';
    html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} data-page="${current - 1}">&lt;</button>`;
    html += `<span style="font-size:1.2rem;color:#374151;">Trang ${current} của ${total}</span>`;
    html += `<button class="page-btn" ${current === total ? 'disabled' : ''} data-page="${current + 1}">&gt;</button>`;
    pagDiv.innerHTML = html;
    pagDiv.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = parseInt(this.getAttribute('data-page'));
            if (!isNaN(page)) fetchDocuments(page);
        });
    });
}

// --- Sự kiện filter/search ---
document.getElementById('search-input').addEventListener('input', function() {
    currentSearch = this.value.trim();
    fetchDocuments(1);
});
document.getElementById('category-select').addEventListener('change', function() {
    currentCategory = this.value;
    fetchDocuments(1);
});
document.getElementById('format-select').addEventListener('change', function() {
    currentFileType = this.value;
    fetchDocuments(1);
});
document.querySelector('.clear-btn').addEventListener('click', function() {
    document.getElementById('search-input').value = '';
    document.getElementById('category-select').value = '';
    document.getElementById('format-select').value = '';
    currentSearch = '';
    currentCategory = '';
    currentFileType = '';
    fetchDocuments(1);
});

// --- Sự kiện chuyển view ---
document.getElementById('grid-view-btn').addEventListener('click', function() {
    currentView = 'grid';
    this.classList.add('active');
    document.getElementById('list-view-btn').classList.remove('active');
    fetchDocuments(currentPage);
});
document.getElementById('list-view-btn').addEventListener('click', function() {
    currentView = 'list';
    this.classList.add('active');
    document.getElementById('grid-view-btn').classList.remove('active');
    fetchDocuments(currentPage);
});

// --- Gọi lần đầu ---
fetchDocuments(1);

fetch('http://localhost:3004/api/categories_grid')
    .then(res => res.json())
    .then(categories => {
        const grid = document.getElementById('category-grid');
        grid.innerHTML = categories.map(cat => `
            <div class="category-card">
                <div class="category-name">${cat.name}</div>
                <div class="category-desc">${cat.description || ''}</div>
                <div class="category-doc-count">${cat.document_count} tài liệu</div>
            </div>
        `).join('');
    });