document.addEventListener('DOMContentLoaded', function () {

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function () {
        const keyword = this.value.toLowerCase();
        document.querySelectorAll('.category-table tbody tr').forEach(row => {
            // Lấy text của tất cả các cột (trừ cột hành động)
            const rowText = Array.from(row.querySelectorAll('td'))
                .slice(0, -1) // chỉ lấy các cột trừ cột cuối
                .map(td => td.textContent.toLowerCase())
                .join(' ');
            if (rowText.includes(keyword)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
});

