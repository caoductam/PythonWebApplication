fetch('http://localhost:3002/api/category')
  .then(res => res.json())
  .then(categories => {
      console.log('Categories:', categories); // Xem dữ liệu thực tế
      const select = document.getElementById('parent-select');
      // Không cần xóa option mặc định, chỉ append thêm
      categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.id;
          option.textContent = cat.id + ' - ' + cat.name;
          select.appendChild(option);
      });
  })
  .catch(err => {
      console.error('Lỗi fetch category:', err);
  });

function renderParentOptions(categories, selectElement, currentId = null, prefix = '') {
    categories.forEach(cat => {
        if (cat.id !== currentId) { // Không cho chọn chính nó làm cha
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = prefix + cat.name;
            selectElement.appendChild(option);
            if (cat.children && cat.children.length > 0) {
                renderParentOptions(cat.children, selectElement, currentId, prefix + '--');
            }
        }
    });
}

// Hiệu ứng focus cho input/select
document.addEventListener('DOMContentLoaded', function () {
  const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], select');
  inputs.forEach(input => {
    input.addEventListener('focus', function () {
      this.style.background = '#eaf0ff';
    });
    input.addEventListener('blur', function () {
      this.style.background = '#f8faff';
    });
  });

  // Hiệu ứng nút bấm
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.addEventListener('mousedown', function () {
      this.style.transform = 'scale(0.97)';
    });
    submitBtn.addEventListener('mouseup', function () {
      this.style.transform = '';
    });
    submitBtn.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  }

  // Hiệu ứng hover cho checkbox label
  const checkboxLabel = document.querySelector('label input[type="checkbox"]');
  if (checkboxLabel) {
    const label = checkboxLabel.parentElement;
    label.addEventListener('mouseenter', function () {
      label.style.background = '#eaf0ff';
      label.style.borderRadius = '6px';
      label.style.padding = '2px 6px';
    });
    label.addEventListener('mouseleave', function () {
      label.style.background = '';
      label.style.padding = '';
    });
  }
});