const unlockBtn = document.getElementById('unlockBtn');
const adminPassword = document.getElementById('adminPassword');
const leftUploadBtn = document.getElementById('leftUploadBtn');
const rightUploadBtn = document.getElementById('rightUploadBtn');
const leftUpload = document.getElementById('leftUpload');
const rightUpload = document.getElementById('rightUpload');
const previewLeft = document.getElementById('previewLeft');
const previewRight = document.getElementById('previewRight');
const voteLeftBtn = document.getElementById('voteLeftBtn');
const voteRightBtn = document.getElementById('voteRightBtn');
const countLeft = document.getElementById('countLeft');
const countRight = document.getElementById('countRight');
const voteStatus = document.getElementById('voteStatus');
const adminCountPanel = document.getElementById('adminCountPanel');
const countLeftInput = document.getElementById('countLeftInput');
const countRightInput = document.getElementById('countRightInput');
const setLeftCountBtn = document.getElementById('setLeftCountBtn');
const setRightCountBtn = document.getElementById('setRightCountBtn');
const API_BASE = '';
const ADMIN_PASSWORD = '0906';

function setButtonState(isAdmin) {
  leftUploadBtn.disabled = !isAdmin;
  rightUploadBtn.disabled = !isAdmin;
  if (adminCountPanel) {
    adminCountPanel.style.display = isAdmin ? 'block' : 'none';
  }
}

function showPreview(element, file) {
  const reader = new FileReader();
  reader.onload = () => {
    element.innerHTML = `<img src="${reader.result}" alt="上传图片" />`;
  };
  reader.readAsDataURL(file);
}

function updateVoteStatus() {
  const voted = localStorage.getItem('voted');
  if (voted) {
    voteStatus.textContent = '你已投票，感谢参与！每个用户只能投一次。';
    voteLeftBtn.disabled = true;
    voteRightBtn.disabled = true;
  } else {
    voteStatus.textContent = '你尚未投票，可以选择一个选项。';
    voteLeftBtn.disabled = false;
    voteRightBtn.disabled = false;
  }
}

async function updateCounts() {
  try {
    const res = await fetch(`${API_BASE}/api/counts`);
    if (!res.ok) throw new Error('no-server');
    const json = await res.json();
    countLeft.textContent = json.counts.left ?? '0';
    countRight.textContent = json.counts.right ?? '0';
    return;
  } catch (err) {
    // fallback to localStorage
    countLeft.textContent = localStorage.getItem('countLeft') || '0';
    countRight.textContent = localStorage.getItem('countRight') || '0';
  }
}

unlockBtn?.addEventListener('click', () => {
  const value = adminPassword.value.trim();
  if (value === ADMIN_PASSWORD) {
    setButtonState(true);
    voteStatus.textContent = '管理员模式已激活，你可以上传图片并修改票数。';
    // try to load counts from server
    fetch(`${API_BASE}/api/counts`).then(r => r.json()).then(json => {
      if (countLeftInput) countLeftInput.value = json.counts.left || '0';
      if (countRightInput) countRightInput.value = json.counts.right || '0';
      updateCounts();
    }).catch(() => {
      if (countLeftInput) countLeftInput.value = localStorage.getItem('countLeft') || '0';
      if (countRightInput) countRightInput.value = localStorage.getItem('countRight') || '0';
    });
  } else {
    setButtonState(false);
    voteStatus.textContent = '密码不正确，上传功能未开启。';
  }
});

leftUploadBtn?.addEventListener('click', () => {
  leftUpload.click();
});

rightUploadBtn?.addEventListener('click', () => {
  rightUpload.click();
});

leftUpload?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    showPreview(previewLeft, file);
    // upload to server if admin unlocked
    if (adminPassword.value.trim() === ADMIN_PASSWORD) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('password', adminPassword.value.trim());
      fetch(`${API_BASE}/api/upload/left`, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(json => {
          if (json.url) {
            previewLeft.innerHTML = `<img src="${json.url}" alt="冰棒" />`;
            window.alert('图片已上传并发布');
          }
        }).catch(() => {});
    }
  }
});

rightUpload?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    showPreview(previewRight, file);
    if (adminPassword.value.trim() === ADMIN_PASSWORD) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('password', adminPassword.value.trim());
      fetch(`${API_BASE}/api/upload/right`, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(json => {
          if (json.url) {
            previewRight.innerHTML = `<img src="${json.url}" alt="雪糕" />`;
            window.alert('图片已上传并发布');
          }
        }).catch(() => {});
    }
  }
});

voteLeftBtn?.addEventListener('click', async () => {
  if (localStorage.getItem('voted')) {
    window.alert('你已经投过票了。');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice: 'left' }),
    });
    const json = await res.json();
    if (!res.ok) {
      window.alert('投票失败，稍后再试。');
      return;
    }
    localStorage.setItem('voted', 'true');
    countLeft.textContent = json.counts.left;
    countRight.textContent = json.counts.right;
    updateVoteStatus();
  } catch (err) {
    // fallback local
    const value = Number(localStorage.getItem('countLeft') || '0') + 1;
    localStorage.setItem('countLeft', String(value));
    localStorage.setItem('voted', 'true');
    updateCounts();
    updateVoteStatus();
  }
});

voteRightBtn?.addEventListener('click', async () => {
  if (localStorage.getItem('voted')) {
    window.alert('你已经投过票了。');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice: 'right' }),
    });
    const json = await res.json();
    if (!res.ok) {
      window.alert('投票失败，稍后再试。');
      return;
    }
    localStorage.setItem('voted', 'true');
    countLeft.textContent = json.counts.left;
    countRight.textContent = json.counts.right;
    updateVoteStatus();
  } catch (err) {
    // fallback local
    const value = Number(localStorage.getItem('countRight') || '0') + 1;
    localStorage.setItem('countRight', String(value));
    localStorage.setItem('voted', 'true');
    updateCounts();
    updateVoteStatus();
  }
});

setLeftCountBtn?.addEventListener('click', async () => {
  if (adminPassword.value.trim() !== ADMIN_PASSWORD) {
    window.alert('请输入管理员密码后再修改票数。');
    return;
  }
  const left = Math.max(0, Number(countLeftInput.value));
  const right = Number(countRightInput.value) || 0;
  try {
    const res = await fetch(`${API_BASE}/api/admin/set-count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ left, right, password: adminPassword.value.trim() }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'failed');
    updateCounts();
    window.alert('已更新冰棒票数。');
  } catch (err) {
    window.alert('无法修改票数（请确保后端可用且密码正确）。');
  }
});

setRightCountBtn?.addEventListener('click', async () => {
  if (adminPassword.value.trim() !== ADMIN_PASSWORD) {
    window.alert('请输入管理员密码后再修改票数。');
    return;
  }
  const left = Number(countLeftInput.value) || 0;
  const right = Math.max(0, Number(countRightInput.value));
  try {
    const res = await fetch(`${API_BASE}/api/admin/set-count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ left, right, password: adminPassword.value.trim() }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'failed');
    updateCounts();
    window.alert('已更新雪糕票数。');
  } catch (err) {
    window.alert('无法修改票数（请确保后端可用且密码正确）。');
  }
});

setButtonState(false);
updateCounts();
updateVoteStatus();

requestCodeBtn?.addEventListener('click', async () => {
  const email = (voterEmail.value || '').trim();
  if (!email) { window.alert('请输入邮箱'); return; }
  try {
    const res = await fetch(`${API_BASE}/api/request-code`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    });
    const json = await res.json();
    if (json.code) {
      window.alert(`测试模式验证码：${json.code}`);
    } else {
      window.alert('验证码已发送，请查收邮箱');
    }
  } catch (err) {
    window.alert('无法发送验证码（后端未配置邮件或不可用）');
  }
});

verifyCodeBtn?.addEventListener('click', async () => {
  const email = (voterEmail.value || '').trim();
  const code = (voterCode.value || '').trim();
  if (!email || !code) { window.alert('请输入邮箱和验证码'); return; }
  try {
    const res = await fetch(`${API_BASE}/api/verify-code`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code })
    });
    const json = await res.json();
    if (!res.ok) { window.alert('验证码错误'); return; }
    voterId = json.voterId;
    localStorage.setItem('voterId', voterId);
    voterInfo.textContent = '已验证，可投票';
    window.alert('验证成功，你现在可投票。');
  } catch (err) {
    window.alert('验证失败');
  }
});
