document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const msg = document.getElementById('login-message');
    msg.style.color = '#3358e0';
    msg.textContent = 'Đang kiểm tra...';

    fetch('http://localhost:3004/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok && data.success) {
            msg.style.color = '#1bb934';
            msg.textContent = data.message || 'Đăng nhập thành công!';
            // Ví dụ: chuyển trang sau 1s
            setTimeout(() => {
                // window.location.href = '/'; // hoặc trang dashboard
            }, 1000);
        } else {
            msg.style.color = '#e03a3a';
            msg.textContent = data.message || 'Đăng nhập thất bại!';
        }
    })
    .catch(err => {
        msg.style.color = '#e03a3a';
        msg.textContent = 'Lỗi kết nối server!';
    });
});