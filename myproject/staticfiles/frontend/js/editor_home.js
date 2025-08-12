// editor_home.js
document.addEventListener('DOMContentLoaded', async () => {
  // — 0. Chuyển MIME → dạng ngắn
  function mimeToShort(mime) {
    switch (mime) {
      case 'application/pdf': return 'PDF';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'Word';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'Excel';
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return 'PowerPoint';
      case 'image/jpeg':
      case 'image/jpg':  return 'JPEG';
      case 'image/png':  return 'PNG';
      case 'image/gif':  return 'GIF';
      case 'text/plain': return 'Text';
      case 'application/zip':
      case 'application/x-zip-compressed': return 'ZIP';
      case 'application/x-rar-compressed': return 'RAR';
      case 'audio/mpeg': return 'MP3';
      case 'video/mp4':  return 'MP4';
      default: return mime.split('/').pop().toUpperCase();
    }
  }

  // — 1. Lấy userId từ URL
  const match = window.location.search.match(/(?:\?id=|&id=)(\d+)/);
  const userId = match ? match[1] : null;
  const userSpan = document.getElementById('userId');
  const loginBtn = document.getElementById('login-btn');

  if (!userId) {
    if (userSpan) userSpan.textContent = 'Thiếu ID trên URL!';
    return;
  }

  // — 2. Fetch info user
  let user;
  try {
    const r = await fetch(`http://localhost:3004/api/users/${userId}`);
    if (!r.ok) throw new Error(r.status);
    user = await r.json();
    if (userSpan) {
      userSpan.textContent = `Xin chào, ${user.username} (ID: ${user.id})`;
    }
    if (loginBtn) loginBtn.style.display = 'none';
  } catch (err) {
    console.error('Lỗi lấy user:', err);
    if (userSpan) userSpan.textContent = 'Không thể lấy thông tin user!';
    return;
  }

  // — 3. Khởi tạo modules
  initDropdown();
  initProfileModal(user);
  initPasswordModal(user);
  initDocumentManager(user);

  // =========== helper ===========
  function initDropdown() {
    const btn = document.getElementById('userDropdownBtn');
    const menu = document.getElementById('userDropdownMenu');
    const log = document.getElementById('logoutBtn');
    if (!btn || !menu || !log) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      btn.classList.toggle('active');
    });
    document.addEventListener('click', e => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
        btn.classList.remove('active');
      }
    });
    log.addEventListener('click', e => {
      e.preventDefault();
      window.location.href = '/frontend/login/';
    });
  }

  function initProfileModal(user) {
    const modal = document.getElementById('profileModal');
    const openBtn = document.getElementById('profileBtn');
    const closeBtn = document.getElementById('closeProfileModal');
    const form = document.getElementById('profileForm');
    const msg = document.getElementById('profileMsg');
    if (!modal || !openBtn || !closeBtn || !form) return;

    openBtn.addEventListener('click', async e => {
      e.preventDefault();
      modal.style.display = 'flex';
      try {
        const r = await fetch(`http://localhost:3004/api/users/${user.id}`);
        if (!r.ok) throw 0;
        const d = await r.json();
        form.profileUsername.value = d.username || '';
        form.profileEmail.value    = d.email    || '';
        form.profileFullname.value = d.full_name|| '';
        msg.textContent = '';
      } catch {
        msg.textContent = 'Không thể lấy thông tin user!';
      }
    });
    closeBtn.addEventListener('click', () => modal.style.display = 'none');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const u = form.profileUsername.value.trim();
      if (!u) {
        msg.textContent = 'Vui lòng nhập username!';
        return;
      }
      const payload = {
        username: u,
        email:    form.profileEmail.value.trim(),
        full_name: form.profileFullname.value.trim()
      };
      try {
        const r = await fetch(`http://localhost:3004/api/users/${user.id}`, {
          method: 'PUT',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify(payload)
        });
        const d = await r.json();
        msg.style.color = d.success ? '#1bb934' : '#e03a3a';
        msg.textContent = d.success ? 'Cập nhật thành công!' : (d.error || 'Lỗi cập nhật!');
        if (d.success) setTimeout(()=>modal.style.display='none',800);
      } catch {
        msg.style.color = '#e03a3a';
        msg.textContent = 'Lỗi khi cập nhật!';
      }
    });
  }

  function initPasswordModal(user) {
    const modal = document.getElementById('changePasswordModal');
    const openBtn = document.getElementById('changePasswordBtn');
    const closeBtn = document.getElementById('closeChangePasswordModal');
    const form = document.getElementById('changePasswordForm');
    const msg = document.getElementById('changePasswordMsg');
    if (!modal || !openBtn || !closeBtn || !form) return;

    openBtn.addEventListener('click', e => {
      e.preventDefault();
      form.reset(); msg.textContent='';
      modal.style.display = 'flex';
    });
    closeBtn.addEventListener('click', ()=>modal.style.display='none');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const cur = form.currentPassword.value.trim();
      const nxt = form.newPassword.value.trim();
      const cf  = form.confirmPassword.value.trim();
      if (!cur||!nxt||!cf) {
        msg.textContent = 'Vui lòng nhập đầy đủ!'; msg.style.color='#e03a3a'; return;
      }
      if (nxt !== cf) {
        msg.textContent = 'Mật khẩu mới không khớp!'; msg.style.color='#e03a3a'; return;
      }
      try {
        const r = await fetch(`http://localhost:3004/api/users/${user.id}/password`, {
          method:'PUT',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ currentPassword:cur, newPassword:nxt })
        });
        const d = await r.json();
        msg.style.color = d.success?'#1bb934':'#e03a3a';
        msg.textContent = d.success?'Đổi mật khẩu thành công!':(d.error||'Đổi mật khẩu thất bại');
        if (d.success) setTimeout(()=>modal.style.display='none',800);
      } catch {
        msg.style.color='#e03a3a';
        msg.textContent='Lỗi server!';
      }
    });
  }

  function initDocumentManager(user) {
    const openBtn  = document.getElementById('manageDocumentBtn');
    const modal    = document.getElementById('manageDocumentModal');
    const closeBtn = document.getElementById('closeManageDocumentModal');
    const t1 = document.getElementById('tabListBtn');
    const t2 = document.getElementById('tabUploadBtn');
    if(!openBtn||!modal||!closeBtn||!t1||!t2) return;

    openBtn.addEventListener('click', e => {
      e.preventDefault();
      modal.style.display='flex';
      setActiveTab('tabListBtn','docListPane');
      loadCategories('category_id');
      fetchDocs(user.id);
    });
    closeBtn.addEventListener('click', ()=>modal.style.display='none');
    t1.addEventListener('click', ()=>setActiveTab('tabListBtn','docListPane'));
    t2.addEventListener('click', ()=>setActiveTab('tabUploadBtn','docUploadPane'));

    const fInp = document.getElementById('file_upload');
    const msgUp= document.getElementById('uploadDocMsg');
    const fForm= document.getElementById('uploadDocForm');
    if (fInp) {
      fInp.addEventListener('change', () => {
        const file = fInp.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        fetch('http://localhost:3004/api/upload', { method:'POST', body:fd })
          .then(r => r.json())
          .then(d => {
            // check file_path
            if (!d.file_path) throw '';
            // gán
            document.getElementById('file_path').value = d.file_path;
            document.getElementById('file_name').value = d.file_name;
            document.getElementById('file_size').value = d.file_size;
            document.getElementById('file_type').value = mimeToShort(d.file_type);
            msgUp.textContent = 'Tải file thành công!';
            msgUp.style.color = '#1bb934';
          })
          .catch(() => {
            msgUp.textContent = 'Lỗi tải file!';
            msgUp.style.color = '#e03a3a';
          });
      });
    }

    if (fForm) {
      fForm.addEventListener('submit', e => {
        e.preventDefault();
        const data = {
          title:        fForm.title.value.trim(),
          description:  fForm.description.value.trim(),
          file_path:    fForm.file_path.value,
          file_name:    fForm.file_name.value,
          file_type:    fForm.file_type.value,
          file_size:    fForm.file_size.value,
          category_id:  fForm.category_id.value,
          created_by_id:user.id
        };
        if (Object.values(data).some(v => !v)) {
          msgUp.textContent = 'Vui lòng điền đầy đủ!';
          msgUp.style.color = '#e03a3a';
          return;
        }
        fetch('http://localhost:3004/api/my-documents', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify(data)
        })
          .then(r => r.json())
          .then(d => {
            msgUp.textContent = d.success ? 'Đăng thành công!' : 'Lỗi đăng!';
            msgUp.style.color   = d.success?'#1bb934':'#e03a3a';
            if (d.success) {
              fForm.reset();
              fetchDocs(user.id);
            }
          })
          .catch(() => {
            msgUp.textContent = 'Lỗi server!';
            msgUp.style.color = '#e03a3a';
          });
      });
    }

    function fetchDocs(uid) {
      fetch(`http://localhost:3004/api/my-documents/${uid}`)
        .then(r => r.json())
        .then(arr => {
          const tbody = document.getElementById('myDocList');
          if (!tbody) return;
          tbody.innerHTML = '';
          if (!arr.length) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">Không có tài liệu.</td></tr>';
            return;
          }
          arr.forEach((doc, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${i+1}</td>
              <td>${doc.title}</td>
              <td>${doc.description||''}</td>
              <td><a href="${doc.file_path}" target="_blank">${doc.file_name}</a></td>
              <td>${doc.file_name}</td>
              <td>${mimeToShort(doc.file_type)}</td>
              <td>${doc.file_size}</td>
              <td>${doc.category_name || ''}</td>
              <td><button class="delete-btn" data-id="${doc.id}">Xoá</button></td>
            `;
            tbody.appendChild(tr);
          });
          tbody.querySelectorAll('.delete-btn').forEach(b => {
            b.addEventListener('click', () => {
              if (confirm('Bạn chắc chắn muốn xoá?')) {
                fetch(`http://localhost:3004/api/my-documents/${b.dataset.id}`, { method:'DELETE' })
                  .then(r => r.json())
                  .then(d => d.success && fetchDocs(uid));
              }
            });
          });
        });
    }

    function loadCategories(selId) {
      fetch('http://localhost:3004/api/categories')
        .then(r => r.json())
        .then(list => {
          const sel = document.getElementById(selId);
          if (!sel) return;
          sel.innerHTML = '<option value="">-- Danh mục --</option>';
          list.forEach(c => {
            const o = document.createElement('option');
            o.value       = c.id;
            o.textContent = c.name;
            sel.appendChild(o);
          });
        });
    }
  }

  function setActiveTab(btnId, paneId) {
    ['tabListBtn','tabUploadBtn'].forEach(i => {
      document.getElementById(i)?.classList.remove('active');
    });
    ['docListPane','docUploadPane'].forEach(i => {
      document.getElementById(i)?.classList.remove('active');
    });
    document.getElementById(btnId)?.classList.add('active');
    document.getElementById(paneId)?.classList.add('active');
  }
});