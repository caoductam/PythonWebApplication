document.addEventListener('DOMContentLoaded', function () {
  // Fetch và render bảng user
  fetch('/category/api/category')
    .then(res => res.json())
    .then(categories => {
      const tbody = document.querySelector('tbody');
      tbody.innerHTML = categories.map((category, idx) => `
        <tr>
          <td>${category.id}</td>
          <td>${category.name}</td>
          <td>${category.description}</td>
          <td>${category.parent_id}</td>
          <td>
            <a href="/category/update_category/${category.id}" class="btn edit-btn">Sửa</a>
            <button class="btn delete-btn" data-id="${category.id}">Xoá</button>
          </td>
        </tr>
      `).join('');

      // Gắn lại sự kiện xoá cho các nút vừa render
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (confirm('Bạn chắc chắn muốn xoá?')) {
            const categoryId = this.getAttribute('data-id');
            fetch(`http://127.0.0.1:3002/api/category/${categoryId}/delete`, {
              method: 'DELETE'
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  this.closest('tr').remove();
                } else {
                  alert('Xoá thất bại!');
                }
              });
          }
        });
      });
    });

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