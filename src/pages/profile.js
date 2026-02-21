import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { toast, formatDate } from '../utils/helpers.js';

const AVATARS = ['👤', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🔧', '👩‍🔧', '🧑‍✈️', '👨‍✈️', '🦸', '🧑‍🚀', '🧔', '👩', '🧑', '🤖', '🎯', '⚡'];

export function renderProfile() {
    const app = document.getElementById('app');
    const user = store.currentUser;
    if (!user) return;

    const memberSince = user.createdAt ? formatDate(user.createdAt) : 'N/A';
    const lastUpdated = user.updatedAt ? formatDate(user.updatedAt) : 'N/A';

    const bodyContent = `
    <div style="max-width:720px;margin:0 auto">

      <!-- Profile Header Card -->
      <div class="card mb-6 animate-slide-up stagger-1" style="overflow:visible">
        <div style="height:80px;background:var(--c-accent-bg);border-radius:var(--radius-lg) var(--radius-lg) 0 0;position:relative">
          <div style="position:absolute;bottom:-32px;left:var(--sp-6);display:flex;align-items:flex-end;gap:var(--sp-4)">
            <div id="profile-avatar-display" style="width:72px;height:72px;border-radius:var(--radius-full);background:var(--c-accent);display:flex;align-items:center;justify-content:center;font-size:2rem;border:3px solid var(--bg-card);box-shadow:var(--shadow-md);cursor:pointer;transition:transform 0.3s var(--ease-spring)" title="Click to change avatar">
              ${user.avatar || '👤'}
            </div>
            <div style="padding-bottom:var(--sp-2)">
              <h2 style="font-size:var(--fs-xl);font-weight:700;letter-spacing:-0.02em">${user.name}</h2>
              <div style="display:flex;align-items:center;gap:var(--sp-2)">
                <span class="status-pill" style="background:var(--c-accent-bg);color:var(--c-accent-light);text-transform:capitalize">${user.role}</span>
                ${user.companyName ? `<span style="font-size:var(--fs-xs);color:var(--text-muted)">· ${user.companyName}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
        <div style="padding:var(--sp-12) var(--sp-6) var(--sp-5)">
          <div style="display:flex;gap:var(--sp-8);flex-wrap:wrap">
            <div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Username</div>
              <div style="font-size:var(--fs-sm);font-weight:600">${user.username}</div>
            </div>
            <div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Member Since</div>
              <div style="font-size:var(--fs-sm);font-weight:600">${memberSince}</div>
            </div>
            <div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Last Updated</div>
              <div style="font-size:var(--fs-sm);font-weight:600">${lastUpdated}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Avatar Picker (hidden by default) -->
      <div class="card mb-6" id="avatar-picker-card" style="display:none;animation:fadeSlideUp 0.3s var(--ease-out) both">
        <div class="card-header">
          <span class="card-title flex items-center gap-2">
            <span class="material-symbols-rounded" style="color:var(--c-accent)">mood</span> Choose Avatar
          </span>
          <button class="btn btn-ghost btn-sm" id="close-avatar-picker"><span class="material-symbols-rounded" style="font-size:16px">close</span></button>
        </div>
        <div class="card-body">
          <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
            ${AVATARS.map(a => `
              <button class="avatar-pick-btn ${a === (user.avatar || '👤') ? 'active' : ''}" data-avatar="${a}" style="width:48px;height:48px;font-size:1.4rem;border-radius:var(--radius-md);border:2px solid ${a === (user.avatar || '👤') ? 'var(--c-accent)' : 'var(--border-color)'};background:${a === (user.avatar || '👤') ? 'var(--c-accent-bg)' : 'var(--bg-elevated)'};cursor:pointer;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center">${a}</button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Edit Profile Form -->
      <div class="card mb-6 animate-slide-up stagger-2">
        <div class="card-header">
          <span class="card-title flex items-center gap-2">
            <span class="material-symbols-rounded" style="color:var(--c-accent)">edit</span> Edit Profile
          </span>
        </div>
        <div class="card-body">
          <form id="profile-form" class="login-form" style="gap:var(--sp-4)">
            <div class="form-group">
              <label class="form-label">Display Name</label>
              <input class="form-input" id="pf-name" value="${user.name || ''}" placeholder="Your name" required />
            </div>
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input class="form-input" id="pf-company" value="${user.companyName || ''}" placeholder="Company (optional)" />
            </div>
            <div class="form-group">
              <label class="form-label">Username / Email</label>
              <input class="form-input" value="${user.username}" disabled style="opacity:0.5;cursor:not-allowed" />
              <span style="font-size:var(--fs-xs);color:var(--text-muted)">Username cannot be changed</span>
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <input class="form-input" value="${user.role}" disabled style="opacity:0.5;cursor:not-allowed;text-transform:capitalize" />
              <span style="font-size:var(--fs-xs);color:var(--text-muted)">Role can only be changed by an administrator</span>
            </div>
            <div id="pf-error" style="display:none;color:var(--c-danger);font-size:var(--fs-sm);animation:shakeX 0.4s var(--ease-out)"></div>
            <div id="pf-success" style="display:none;color:var(--c-success);font-size:var(--fs-sm)"></div>
            <div style="display:flex;gap:var(--sp-3);justify-content:flex-end;margin-top:var(--sp-2)">
              <button type="submit" class="btn btn-primary" id="pf-save-btn">
                <span class="material-symbols-rounded" style="font-size:16px">save</span> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Change Password -->
      <div class="card mb-6 animate-slide-up stagger-3">
        <div class="card-header">
          <span class="card-title flex items-center gap-2">
            <span class="material-symbols-rounded" style="color:var(--c-warning)">lock</span> Change Password
          </span>
        </div>
        <div class="card-body">
          <form id="password-form" class="login-form" style="gap:var(--sp-4)">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" class="form-input" id="pw-current" placeholder="Enter current password" required />
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" class="form-input" id="pw-new" placeholder="Min 4 characters" required minlength="4" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-input" id="pw-confirm" placeholder="Re-enter new password" required />
              </div>
            </div>
            <div id="pw-error" style="display:none;color:var(--c-danger);font-size:var(--fs-sm);animation:shakeX 0.4s var(--ease-out)"></div>
            <div id="pw-success" style="display:none;color:var(--c-success);font-size:var(--fs-sm)"></div>
            <div style="display:flex;gap:var(--sp-3);justify-content:flex-end;margin-top:var(--sp-2)">
              <button type="submit" class="btn btn-secondary" id="pw-save-btn">
                <span class="material-symbols-rounded" style="font-size:16px">key</span> Update Password
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Account Info -->
      <div class="card animate-slide-up stagger-4">
        <div class="card-header">
          <span class="card-title flex items-center gap-2">
            <span class="material-symbols-rounded" style="color:var(--text-muted)">info</span> Account Details
          </span>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
            <div style="padding:var(--sp-3);background:var(--bg-elevated);border-radius:var(--radius-md)">
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:2px">Account ID</div>
              <code style="font-size:var(--fs-xs);color:var(--text-secondary)">${(user._id || user.id || '').slice(-12)}</code>
            </div>
            <div style="padding:var(--sp-3);background:var(--bg-elevated);border-radius:var(--radius-md)">
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:2px">Auth Token</div>
              <code style="font-size:var(--fs-xs);color:var(--text-secondary)">${(localStorage.getItem('fleetflow_token') || '').slice(-16)}…</code>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

    app.innerHTML = renderShell('My Profile', 'Manage your account settings', '', bodyContent);
    bindShellEvents();

    /* ─── Avatar Picker Toggle ─── */
    const avatarDisplay = document.getElementById('profile-avatar-display');
    const avatarCard = document.getElementById('avatar-picker-card');
    avatarDisplay?.addEventListener('click', () => {
        avatarCard.style.display = avatarCard.style.display === 'none' ? 'block' : 'none';
        avatarDisplay.style.transform = avatarCard.style.display === 'none' ? '' : 'scale(1.1)';
    });
    document.getElementById('close-avatar-picker')?.addEventListener('click', () => {
        avatarCard.style.display = 'none';
        avatarDisplay.style.transform = '';
    });

    /* ─── Avatar Selection ─── */
    document.querySelectorAll('.avatar-pick-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const avatar = btn.dataset.avatar;
            const r = await store.updateProfile({ avatar });
            if (r.success) {
                toast('Avatar updated! ✨', 'success');
                renderProfile();
            } else {
                toast(r.error || 'Failed to update avatar', 'error');
            }
        });
    });

    /* ─── Profile Form ─── */
    const profileForm = document.getElementById('profile-form');
    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pfError = document.getElementById('pf-error');
        const pfSuccess = document.getElementById('pf-success');
        const saveBtn = document.getElementById('pf-save-btn');
        pfError.style.display = 'none';
        pfSuccess.style.display = 'none';

        const name = document.getElementById('pf-name').value.trim();
        const companyName = document.getElementById('pf-company').value.trim();

        if (!name) {
            pfError.textContent = 'Display name is required';
            pfError.style.display = 'block';
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px">hourglass_empty</span> Saving...';

        const r = await store.updateProfile({ name, companyName });
        if (r.success) {
            pfSuccess.textContent = '✓ Profile updated successfully';
            pfSuccess.style.display = 'block';
            toast('Profile updated! ✅', 'success');
            setTimeout(() => renderProfile(), 800);
        } else {
            pfError.textContent = r.error || 'Failed to update';
            pfError.style.display = 'block';
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px">save</span> Save Changes';
        }
    });

    /* ─── Password Form ─── */
    const passwordForm = document.getElementById('password-form');
    passwordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwError = document.getElementById('pw-error');
        const pwSuccess = document.getElementById('pw-success');
        const saveBtn = document.getElementById('pw-save-btn');
        pwError.style.display = 'none';
        pwSuccess.style.display = 'none';

        const currentPassword = document.getElementById('pw-current').value;
        const newPassword = document.getElementById('pw-new').value;
        const confirmPassword = document.getElementById('pw-confirm').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            pwError.textContent = 'All password fields are required';
            pwError.style.display = 'block';
            return;
        }

        if (newPassword !== confirmPassword) {
            pwError.textContent = 'New passwords do not match';
            pwError.style.display = 'block';
            return;
        }

        if (newPassword.length < 4) {
            pwError.textContent = 'New password must be at least 4 characters';
            pwError.style.display = 'block';
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px">hourglass_empty</span> Updating...';

        const r = await store.changePassword(currentPassword, newPassword);
        if (r.success) {
            pwSuccess.textContent = '✓ Password changed successfully';
            pwSuccess.style.display = 'block';
            toast('Password updated! 🔑', 'success');
            document.getElementById('pw-current').value = '';
            document.getElementById('pw-new').value = '';
            document.getElementById('pw-confirm').value = '';
        } else {
            pwError.textContent = r.error || 'Failed to change password';
            pwError.style.display = 'block';
        }
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px">key</span> Update Password';
    });
}
