// Thay thế toàn bộ sự kiện 'submit' của bạn bằng đoạn code này

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const msg = document.getElementById('login-message');

    // Kiểm tra đầu vào cơ bản phía client
    if (!username || !password) {
        msg.style.color = '#e03a3a';
        msg.textContent = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
        return;
    }

    msg.style.color = '#333'; // Màu xám cho trạng thái chờ
    msg.textContent = 'Đang kiểm tra...';

    fetch('http://127.0.0.1:3004/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password } )
    })
    .then(res => {
        // Luôn cố gắng parse JSON, dù thành công hay thất bại
        // để có thể đọc thông báo lỗi từ server
        return res.json().then(data => {
            if (!res.ok) {
                // Nếu server trả về lỗi (4xx, 5xx), ném lỗi với thông báo từ server
                throw new Error(data.error || 'Đã xảy ra lỗi không xác định.');
            }
            return data; // Nếu server trả về 2xx, trả về dữ liệu
        });
    })
    .then(response => {
        // --- SỬA LỖI TẠI ĐÂY: Đọc từ response.data thay vì response.user ---
        const user = response.data;

        if (user && user.role) {
            msg.style.color = '#1bb934'; // Màu xanh lá cho thành công
            msg.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';

            // Lưu thông tin người dùng vào localStorage để các trang khác có thể sử dụng
            localStorage.setItem('loggedInUser', JSON.stringify(user));

            let homeUrl = '/'; // Trang mặc định nếu vai trò không khớp
            if (user.role === 'Admin') {
                // Sửa lại đường dẫn cho chính xác, không cần truyền id qua URL
                // vì chúng ta đã lưu vào localStorage
                homeUrl = `/frontend/admin_home/?id=${user.id}`; 
            } else if (user.role === 'Editor') {
                homeUrl = `/frontend/editor_home/?id=${user.id}`;
            } else if (user.role === 'Viewer') {
                homeUrl = `/frontend/viewer_home/?id=${user.id}`;
            }

            setTimeout(() => {
                window.location.href = homeUrl;
            }, 1000); // Chờ 1 giây để người dùng đọc thông báo

        } else {
            // Trường hợp hiếm gặp: server trả về thành công nhưng không có vai trò
            throw new Error('Không xác định được vai trò người dùng!');
        }
    })
    .catch(err => {
        // Bắt tất cả các lỗi (lỗi mạng, lỗi server, lỗi logic) và hiển thị
        msg.style.color = '#e03a3a';
        msg.textContent = err.message;
        console.error('Lỗi đăng nhập:', err);
    });
});
