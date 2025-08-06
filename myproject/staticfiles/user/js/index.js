document.addEventListener('DOMContentLoaded', function () {
  // Fetch và render bảng user
  fetch('/user/api/user')
    .then(res => res.json())
    .then(users => {
      const tbody = document.querySelector('tbody');
      tbody.innerHTML = users.map((user, idx) => `
        <tr>
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.password}</td>
          <td>${user.full_name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>
            <span class="${user.is_active ? 'active' : 'inactive'}">
              ${user.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
            </span>
          </td>
          <td>
            <a href="/user/update_user/${user.id}" class="btn edit-btn">Sửa</a>
            <button class="btn delete-btn" data-id="${user.id}">Xoá</button>
          </td>
        </tr>
      `).join('');

      // Gắn lại sự kiện xoá cho các nút vừa render
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (confirm('Bạn chắc chắn muốn xoá?')) {
            const userId = this.getAttribute('data-id');
            fetch(`http://127.0.0.1:3000/api/user/${userId}/delete`, {
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
    document.querySelectorAll('.user-table tbody tr').forEach(row => {
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