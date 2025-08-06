document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Lấy dữ liệu từ form
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Hiển thị hiệu ứng loading (giả lập)
    const msg = document.getElementById('login-message');
    msg.style.color = '#3358e0';
    msg.textContent = 'Đang kiểm tra...';

    // Giả lập kiểm tra (chưa xử lý sâu)
    setTimeout(() => {
        if (!username || !password) {
            msg.style.color = '#e03a3a';
            msg.textContent = 'Vui lòng nhập đầy đủ thông tin!';
        } else {
            msg.style.color = '#1bb934';
            msg.textContent = 'Đăng nhập thành công (giả lập)!';
            // window.location.href = '/'; // Chuyển trang nếu muốn
        }
    }, 900);
});