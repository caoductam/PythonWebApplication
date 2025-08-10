document.getElementById('loginForm').addEventListener('submit', function (e) {
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
                // Lấy role và id từ response
                const user = data.user;
                if (user && user.role) {
                    let homeUrl = '/';
                    if (user.role === 'Admin') {
                        homeUrl = `/frontend/admin_home/?id=${user.id}`;
                    } else if (user.role === 'Editor') {
                        homeUrl = `/frontend/editor_home/?id=${user.id}`;
                    } else if (user.role === 'Viewer') {
                        homeUrl = `/frontend/viewer_home/?id=${user.id}`;
                    }
                    setTimeout(() => {
                        window.location.href = homeUrl;
                    }, 1000);
                } else {
                    msg.style.color = '#e03a3a';
                    msg.textContent = 'Không xác định được vai trò người dùng!';
                }
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