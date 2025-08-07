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