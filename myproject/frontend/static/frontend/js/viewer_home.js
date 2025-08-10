// Lấy id từ URL (?id=...)
function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

const userId = getUserIdFromUrl();

if (userId) {
    // Hiển thị id lên h3
    document.getElementById('userId').textContent = `User ID: ${userId}`;

    // Fetch thông tin user từ API (giả sử có endpoint này)
    fetch(`http://localhost:3004/api/users/${userId}`)
        .then(res => res.json())
        .then(user => {
            // Hiển thị thêm thông tin user nếu muốn
            // Ví dụ: document.getElementById('userId').textContent = `Xin chào, ${user.username} (ID: ${user.id})`;
            if (user && user.username) {
                document.getElementById('userId').textContent = `Xin chào, ${user.username} (ID: ${user.id})`;
            }
        })
        .catch(() => {
            document.getElementById('userId').textContent = 'Không thể lấy thông tin user!';
        });
} else {
    document.getElementById('userId').textContent = 'Không tìm thấy ID user trên URL!';
}


document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.id && user.username) {
        // document.getElementById('userName').textContent = user.username;
        document.getElementById('userId').textContent = `(ID: ${user.id})`;
        // document.getElementById('user-info-btn').style.display = 'flex';
        document.getElementById('login-btn').style.display = 'none';
    } else {
        // document.getElementById('user-info-btn').style.display = 'none';
        document.getElementById('login-btn').style.display = 'flex';
    }
});

// Dropdown toggle
document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('userDropdownBtn');
    const menu = document.getElementById('userDropdownMenu');
    if (btn && menu) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            btn.classList.toggle('active');
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        });
        // Ẩn dropdown khi click ra ngoài
        document.addEventListener('click', function (e) {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                menu.style.display = 'none';
                btn.classList.remove('active');
            }
        });
    }
    // Logout demo
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '/frontend/login/';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Modal elements
    const profileModal = document.getElementById('profileModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const profileBtn = document.getElementById('profileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const closeChangePasswordModal = document.getElementById('closeChangePasswordModal');
    const profileInfo = document.getElementById('profileInfo');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const changePasswordMsg = document.getElementById('changePasswordMsg');

    // Show profile modal
    if (profileBtn && profileModal) {
        profileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            profileModal.style.display = 'flex';

            // Lấy user id từ giao diện
            const userIdText = document.getElementById('userId').textContent;
            const userId = userIdText.split('(ID:')[1]?.replace(/\D/g, '').trim() || null;

            if (userId) {
                fetch(`http://localhost:3004/api/users/${userId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.username) {
                            document.getElementById('profileUsername').value = data.username;
                            document.getElementById('profileEmail').value = data.email || '';
                            document.getElementById('profileFullname').value = data.full_name || '';
                            document.getElementById('profileMsg').textContent = '';
                        } else {
                            document.getElementById('profileMsg').textContent = 'Không tìm thấy thông tin user!';
                        }
                    })
                    .catch(() => {
                        document.getElementById('profileMsg').textContent = 'Lỗi khi lấy thông tin user!';
                    });
            } else {
                document.getElementById('profileMsg').textContent = 'Không tìm thấy thông tin user!';
            }
        });

        // Xử lý submit form cập nhật thông tin cá nhân
        document.getElementById('profileForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const userIdText = document.getElementById('userId').textContent;
            const userId = userIdText.split('(ID:')[1]?.replace(/\D/g, '').trim() || null;
            const username = document.getElementById('profileUsername').value.trim();
            const email = document.getElementById('profileEmail').value.trim();
            const full_name = document.getElementById('profileFullname').value.trim();

            if (!userId || !username) {
                document.getElementById('profileMsg').textContent = 'Thiếu thông tin!';
                return;
            }

            fetch(`http://localhost:3004/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, full_name })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('profileMsg').style.color = '#1bb934';
                        document.getElementById('profileMsg').textContent = 'Cập nhật thành công!';
                        setTimeout(() => { profileModal.style.display = 'none'; }, 1200);
                    } else {
                        document.getElementById('profileMsg').style.color = '#e03a3a';
                        document.getElementById('profileMsg').textContent = data.error || 'Lỗi cập nhật!';
                    }
                })
                .catch(() => {
                    document.getElementById('profileMsg').style.color = '#e03a3a';
                    document.getElementById('profileMsg').textContent = 'Lỗi khi cập nhật!';
                });
        });
    }
    // Show change password modal

    if (changePasswordBtn && changePasswordModal) {
        changePasswordBtn.addEventListener('click', function (e) {
            e.preventDefault();
            changePasswordModal.style.display = 'flex';
            if (changePasswordMsg) {
                changePasswordMsg.textContent = '';
                changePasswordMsg.style.color = '#e03a3a';
            }
            if (changePasswordForm) {
                changePasswordForm.reset();
                const firstInput = changePasswordForm.querySelector('input');
                if (firstInput) firstInput.focus();
            }
        });

        // Xử lý submit đổi mật khẩu
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', function (e) {
                e.preventDefault();

                // Lấy userId từ giao diện (giống như modal profile)
                const userIdText = document.getElementById('userId').textContent;
                const match = userIdText.match(/KATEX_INLINE_OPENID:\s*(\d+)KATEX_INLINE_CLOSE/);
                const userId = match ? match[1] : null;

                const currentPassword = document.getElementById('currentPassword').value.trim();
                const newPassword = document.getElementById('newPassword').value.trim();
                const confirmPassword = document.getElementById('confirmPassword').value.trim();

                if (!userId || !currentPassword || !newPassword || !confirmPassword) {
                    changePasswordMsg.textContent = 'Vui lòng nhập đầy đủ thông tin!';
                    changePasswordMsg.style.color = '#e03a3a';
                    return;
                }
                if (newPassword !== confirmPassword) {
                    changePasswordMsg.textContent = 'Mật khẩu mới không khớp!';
                    changePasswordMsg.style.color = '#e03a3a';
                    return;
                }

                fetch(`http://localhost:3004/api/users/${userId}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            changePasswordMsg.style.color = '#1bb934';
                            changePasswordMsg.textContent = 'Đổi mật khẩu thành công!';
                            setTimeout(() => { changePasswordModal.style.display = 'none'; }, 1200);
                        } else {
                            changePasswordMsg.style.color = '#e03a3a';
                            changePasswordMsg.textContent = data.error || 'Lỗi đổi mật khẩu!';
                        }
                    })
                    .catch(() => {
                        changePasswordMsg.style.color = '#e03a3a';
                        changePasswordMsg.textContent = 'Lỗi khi đổi mật khẩu!';
                    });
            });
        }
    }

    // Close modals
    if (closeProfileModal && profileModal) {
        closeProfileModal.addEventListener('click', function () {
            profileModal.style.display = 'none';
        });
    }
    if (closeChangePasswordModal && changePasswordModal) {
        closeChangePasswordModal.addEventListener('click', function () {
            changePasswordModal.style.display = 'none';
        });
    }
    // Click outside modal to close
    window.onclick = function (event) {
        if (event.target === profileModal) profileModal.style.display = 'none';
        if (event.target === changePasswordModal) changePasswordModal.style.display = 'none';
    }
    // Đổi mật khẩu demo
    // if (changePasswordForm) {
    //     changePasswordForm.addEventListener('submit', function (e) {
    //         e.preventDefault();
    //         const current = document.getElementById('currentPassword').value;
    //         const newPass = document.getElementById('newPassword').value;
    //         const confirm = document.getElementById('confirmPassword').value;
    //         if (!current || !newPass || !confirm) {
    //             changePasswordMsg.textContent = 'Vui lòng nhập đầy đủ thông tin!';
    //             return;
    //         }
    //         if (newPass !== confirm) {
    //             changePasswordMsg.textContent = 'Mật khẩu mới không khớp!';
    //             return;
    //         }
    //         // Gửi API đổi mật khẩu ở đây (demo)
    //         changePasswordMsg.style.color = '#1bb934';
    //         changePasswordMsg.textContent = 'Đổi mật khẩu thành công (demo)!';
    //         setTimeout(() => {
    //             changePasswordModal.style.display = 'none';
    //         }, 1200);
    //     });
    // }
});