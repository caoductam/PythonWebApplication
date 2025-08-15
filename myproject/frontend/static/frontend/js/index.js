// admin_home.js hoặc file JS tương ứng của bạn

document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // ===== ĐỊNH NGHĨA CÁC BIẾN TRẠNG THÁI VÀ HẰNG SỐ =================
    // =================================================================
    const API_BASE_URL = 'http://127.0.0.1:3004/api'; // <-- QUAN TRỌNG: Dùng một nơi duy nhất

    let currentPage = 1;
    const pageSize = 12;
    let currentSearch = '';
    let currentCategory = '';
    let currentFileType = '';
    let currentView = 'grid'; // Mặc định là 'grid'

    // =================================================================
    // ===== HÀM TRỢ GIÚP (HELPERS ) =====================================
    // =================================================================

    /**
     * Hàm trợ giúp để xử lý fetch và parse JSON, bao gồm cả xử lý lỗi.
     * @param {string} url - URL của API.
     * @returns {Promise<object>} - Promise chứa dữ liệu đã được parse.
     */
    function apiFetch(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    // Nếu server trả về lỗi (4xx, 5xx), ném lỗi để khối .catch() bắt được
                    throw new Error(`Lỗi HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error(`Lỗi khi fetch từ ${url}:`, error);
                // Ném lại lỗi để các hàm gọi nó có thể hiển thị thông báo cho người dùng
                throw error;
            });
    }

    /**
     * Hàm định dạng kích thước file từ byte sang đơn vị dễ đọc hơn.
     * @param {number} bytes - Kích thước file tính bằng byte.
     * @returns {string} - Chuỗi đã được định dạng (ví dụ: "1.23 MB").
     */
    function formatBytes(bytes) {
        if (bytes === 0 || !bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }


    // =================================================================
    // ===== CÁC HÀM TẢI DỮ LIỆU (DATA FETCHING FUNCTIONS) ==============
    // =================================================================

    // --- Tải các số liệu thống kê tổng quan ---
    function loadStats() {
        apiFetch(`${API_BASE_URL}/stats`)
            .then(stats => {
                // Giả sử API trả về { document_count: N, category_count: M, user_count: P }
                document.querySelector('.stat-number.documents').textContent = stats.document_count || 0;
                document.querySelector('.stat-number.categories').textContent = stats.category_count || 0;
                document.querySelector('.stat-number.users').textContent = stats.user_count || 0;
            })
            .catch(() => {
                console.error("Không thể tải số liệu thống kê.");
            });
    }

    // --- Tải danh sách danh mục cho ô select filter ---
    function loadFilterCategories() {
        apiFetch(`${API_BASE_URL}/categories`)
            .then(response => {
                // Giả sử API trả về { success: true, data: [...] }
                if (!response.success || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu danh mục không hợp lệ.");
                }
                const select = document.getElementById('category-select');
                select.innerHTML = '<option value="">Tất cả danh mục</option>';
                response.data.forEach(cat => {
                    select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
            })
            .catch(() => {
                document.getElementById('category-select').innerHTML = '<option value="">Lỗi tải danh mục</option>';
            });
    }

    // --- Tải các loại file cho ô select filter ---
    function loadFileTypes() {
        apiFetch(`${API_BASE_URL}/filetypes`)
            .then(response => {
                if (!response.success || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu loại file không hợp lệ.");
                }
                const select = document.getElementById('format-select');
                select.innerHTML = '<option value="">Tất cả định dạng</option>';

                // --- SỬA LỖI TẠI ĐÂY ---
                // Truy cập vào thuộc tính .file_type của mỗi đối tượng typeObj
                response.data.forEach(typeObj => {
                    // Bỏ qua các giá trị null hoặc rỗng từ CSDL (nếu có)
                    if (typeObj && typeObj.file_type) {
                        select.innerHTML += `<option value="${typeObj.file_type}">${typeObj.file_type}</option>`;
                    }
                });
            })
            .catch(() => {
                document.getElementById('format-select').innerHTML = '<option value="">Lỗi tải định dạng</option>';
            });
    }

    // --- Tải và hiển thị danh sách tài liệu (hàm chính) ---
    function fetchAndRenderDocuments(page = 1) {
        currentPage = page;
        const params = new URLSearchParams({
            page: currentPage,
            page_size: pageSize,
            search: currentSearch,
            category_id: currentCategory,
            file_type: currentFileType
        });

        const docList = document.getElementById('doc-list');
        docList.innerHTML = '<p>Đang tải tài liệu...</p>';

        apiFetch(`${API_BASE_URL}/documents?${params.toString()}`)
            .then(data => {
                // Giả sử API trả về { results: [...], total: N, page: P, total_pages: T }
                if (!data || !Array.isArray(data.results)) {
                    throw new Error("Dữ liệu tài liệu trả về không hợp lệ.");
                }
                document.getElementById('doc-count').textContent =
                    `Hiển thị ${data.results.length} trong số ${data.total.toLocaleString()} tài liệu`;

                docList.className = 'doc-list ' + (currentView === 'list' ? 'list-view' : 'grid-view');

                if (data.results.length === 0) {
                    docList.innerHTML = '<p>Không tìm thấy tài liệu nào phù hợp.</p>';
                } else {
                    docList.innerHTML = data.results.map(doc => `
                        <div class="doc-item">
                            <a class="doc-title" href="${doc.file_path}" target="_blank">${doc.title}</a>
                            <div class="doc-meta">
                                <span>Mô tả: ${doc.description || 'Không có'}</span>
                                <span>Danh mục: ${doc.category_name || 'N/A'}</span>
                                <span>Định dạng: ${doc.file_type || 'N/A'}</span>
                                <span>Dung lượng: ${formatBytes(doc.file_size)}</span>
                                <span>Người đăng: ${doc.created_by_username || 'N/A'}</span>
                            </div>
                        </div>
                    `).join('');
                }
                renderPagination(data.page, data.total_pages);
            })
            .catch(error => {
                docList.innerHTML = `<p style="color: red;">Lỗi tải tài liệu: ${error.message}</p>`;
            });
    }

    // --- Tải và hiển thị các danh mục dạng lưới ---
    function loadCategoryGrid() {
        const grid = document.getElementById('category-grid');
        apiFetch(`${API_BASE_URL}/categories_grid`)
            .then(response => {
                if (!response.success || !Array.isArray(response.data)) {
                    throw new Error("Dữ liệu lưới danh mục không hợp lệ.");
                }
                grid.innerHTML = response.data.map(cat => `
                    <div class="category-card">
                        <div class="category-name">${cat.name}</div>
                        <div class="category-desc">${cat.description || 'Không có mô tả.'}</div>
                        <div class="category-doc-count">${cat.document_count} tài liệu</div>
                    </div>
                `).join('');
            })
            .catch(() => {
                grid.innerHTML = '<p style="color: red;">Không thể tải các danh mục.</p>';
            });
    }


    // =================================================================
    // ===== CÁC HÀM RENDER GIAO DIỆN (UI FUNCTIONS) ===================
    // =================================================================

    // --- Hàm render các nút phân trang ---
    function renderPagination(current, total) {
        const pagDiv = document.getElementById('doc-pagination');
        if (!total || total <= 1) {
            pagDiv.innerHTML = '';
            return;
        }
        pagDiv.innerHTML = `
            <button class="page-btn" data-page="${current - 1}" ${current === 1 ? 'disabled' : ''}>&lt;</button>
            <span style="font-size:1.2rem;color:#374151;">Trang ${current} / ${total}</span>
            <button class="page-btn" data-page="${current + 1}" ${current === total ? 'disabled' : ''}>&gt;</button>
        `;
    }


    // =================================================================
    // ===== GÁN CÁC SỰ KIỆN (EVENT LISTENERS) =========================
    // =================================================================

    function setupEventListeners() {
        document.getElementById('search-input').addEventListener('input', (e) => {
            currentSearch = e.target.value.trim();
            fetchAndRenderDocuments(1);
        });
        document.getElementById('category-select').addEventListener('change', (e) => {
            currentCategory = e.target.value;
            fetchAndRenderDocuments(1);
        });
        document.getElementById('format-select').addEventListener('change', (e) => {
            currentFileType = e.target.value;
            fetchAndRenderDocuments(1);
        });
        document.querySelector('.clear-btn').addEventListener('click', () => {
            document.getElementById('search-input').value = '';
            document.getElementById('category-select').value = '';
            document.getElementById('format-select').value = '';
            currentSearch = '';
            currentCategory = '';
            currentFileType = '';
            fetchAndRenderDocuments(1);
        });
        document.getElementById('grid-view-btn').addEventListener('click', function () {
            if (currentView === 'grid') return;
            currentView = 'grid';
            this.classList.add('active');
            document.getElementById('list-view-btn').classList.remove('active');
            fetchAndRenderDocuments(currentPage);
        });
        document.getElementById('list-view-btn').addEventListener('click', function () {
            if (currentView === 'list') return;
            currentView = 'list';
            this.classList.add('active');
            document.getElementById('grid-view-btn').classList.remove('active');
            fetchAndRenderDocuments(currentPage);
        });
        document.getElementById('doc-pagination').addEventListener('click', (e) => {
            if (e.target && e.target.matches('.page-btn:not([disabled])')) {
                const page = parseInt(e.target.dataset.page);
                fetchAndRenderDocuments(page);
            }
        });
    }


    // =================================================================
    // ===== ĐIỂM KHỞI ĐỘNG CHÍNH (MAIN ENTRY POINT) ====================
    // =================================================================

    function initializePage() {
        setupEventListeners();
        loadStats();
        loadFilterCategories();
        loadFileTypes();
        fetchAndRenderDocuments(1);
        loadCategoryGrid();
    }

    initializePage();

});
