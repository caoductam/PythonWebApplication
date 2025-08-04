// Hiệu ứng nút Xoá (chỉ giao diện, không xử lý dữ liệu)
document.addEventListener('DOMContentLoaded', function () {
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            btn.textContent = 'Đã xoá!';
            btn.style.background = '#bdbdbd';
            btn.style.color = '#fff';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = 'Xoá';
                btn.style.background = '#ffeaea';
                btn.style.color = '#e03a3a';
                btn.disabled = false;
            }, 1200);
        });
    });

    // Fetch và render bảng user
    fetch('/user/api/user')
      .then(res => res.json())
      .then(users => {
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = users.map((user, idx) => `
          <tr>
            <td>${idx + 1}</td>
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
              <a href="/user/delete_user/${user.id}" class="btn delete-btn" onclick="return confirm('Bạn chắc chắn muốn xoá?')">Xoá</a>
            </td>
          </tr>
        `).join('');
      });
});