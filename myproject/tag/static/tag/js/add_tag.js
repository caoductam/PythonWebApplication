// Hiệu ứng focus cho input/select
document.addEventListener('DOMContentLoaded', function () {
  const inputs = document.querySelectorAll('input[type="text"]');
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