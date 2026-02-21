import { store } from '../store/data.js';
import { router } from '../utils/router.js';
import { toast } from '../utils/helpers.js';

/* ════════════════════════════════════════════════════════════════
   LOGIN PAGE  — default auth view
   ════════════════════════════════════════════════════════════════ */
export function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      ${heroPanel()}
      <div class="login-form-side">
        <div class="login-form-container animate-fade-in">
          <h1>Welcome back</h1>
          <p class="subtitle">Sign in to your FleetFlow account</p>
          <form class="login-form" id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-username">Username / Email</label>
              <div class="input-icon-wrap">
                <span class="material-symbols-rounded input-icon">person</span>
                <input class="form-input has-icon" type="text" id="login-username" placeholder="Enter your username" required autocomplete="username" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <div class="input-icon-wrap">
                <span class="material-symbols-rounded input-icon">lock</span>
                <input class="form-input has-icon" type="password" id="login-password" placeholder="Enter your password" required autocomplete="current-password" />
              </div>
            </div>
            <div class="form-group" style="flex-direction:row;justify-content:flex-end;margin-top:-4px">
              <a href="#" id="forgot-password" class="auth-link" style="font-size:var(--fs-sm)">Forgot Password?</a>
            </div>
            <div id="login-error" class="form-error" style="display:none"></div>
            <button type="submit" class="btn btn-primary w-full" id="login-btn">
              <span class="material-symbols-rounded">login</span> Sign In
            </button>
          </form>
          <div class="auth-switch">
            Don't have an account? <a href="#/register" class="auth-link">Create an account</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div class="modal-overlay" id="forgot-modal" style="display:none">
      <div class="modal" style="max-width:440px">
        <div class="modal-header">
          <span class="modal-title">🔑 Forgot Password</span>
          <button class="btn btn-icon btn-ghost" id="forgot-close"><span class="material-symbols-rounded">close</span></button>
        </div>
        <div class="modal-body">
          <p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.7">
            Enter the email address linked to your account and we'll notify the administrator to reset your password.
          </p>
          <div class="form-group">
            <label class="form-label" for="forgot-email">Email Address</label>
            <input class="form-input" type="email" id="forgot-email" placeholder="yourname@gmail.com" required />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="forgot-cancel">Cancel</button>
          <button class="btn btn-primary" id="forgot-submit">
            <span class="material-symbols-rounded">send</span> Send Request
          </button>
        </div>
      </div>
    </div>
  `;
  bindLoginEvents();
}

/* ════════════════════════════════════════════════════════════════
   REGISTER PAGE
   ════════════════════════════════════════════════════════════════ */
export function renderRegister() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      ${heroPanel()}
      <div class="login-form-side">
        <div class="login-form-container animate-fade-in">
          <a href="#/login" class="back-to-login"><span class="material-symbols-rounded" style="font-size:18px">arrow_back</span> Back to Login</a>
          <h1 style="margin-top:var(--sp-4)">Create Account</h1>
          <p class="subtitle">Get started with FleetFlow for your business</p>
          <form class="login-form" id="register-form">
            <div class="form-group">
              <label class="form-label" for="reg-email">Email <span style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:400">(Gmail only)</span></label>
              <div class="input-icon-wrap">
                <span class="material-symbols-rounded input-icon">mail</span>
                <input class="form-input has-icon" type="email" id="reg-email" placeholder="yourname@gmail.com" required pattern="[a-zA-Z0-9._%+\\-]+@gmail\\.com" title="Only @gmail.com addresses are accepted" autocomplete="email" />
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="reg-password">Password</label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-rounded input-icon">lock</span>
                  <input class="form-input has-icon" type="password" id="reg-password" placeholder="Min 4 characters" required minlength="4" autocomplete="new-password" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-confirm">Confirm Password</label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-rounded input-icon">lock</span>
                  <input class="form-input has-icon" type="password" id="reg-confirm" placeholder="Confirm password" required minlength="4" autocomplete="new-password" />
                </div>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="reg-company">Company Name</label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-rounded input-icon">business</span>
                  <input class="form-input has-icon" type="text" id="reg-company" placeholder="Your company" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-name">Display Name</label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-rounded input-icon">badge</span>
                  <input class="form-input has-icon" type="text" id="reg-name" placeholder="Your name" required />
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-role">Role</label>
              <select class="form-select" id="reg-role">
                <option value="manager">Fleet Manager</option>
                <option value="dispatcher" selected>Dispatcher</option>
                <option value="safety">Safety Officer</option>
                <option value="analyst">Financial Analyst</option>
              </select>
            </div>
            <div id="register-error" class="form-error" style="display:none"></div>
            <button type="submit" class="btn btn-primary w-full" id="register-btn">
              <span class="material-symbols-rounded">person_add</span> Create Account
            </button>
          </form>
          <div class="auth-switch">
            Already have an account? <a href="#/login" class="auth-link">Sign In</a>
          </div>
        </div>
      </div>
    </div>
  `;
  bindRegisterEvents();
}

/* ════════════════════════════════════════════════════════════════
   SHARED HERO PANEL
   ════════════════════════════════════════════════════════════════ */
function heroPanel() {
  return `
    <div class="login-hero">
      <div class="login-hero-content">
        <div class="login-hero-icon"><span class="material-symbols-rounded" style="font-size:4rem">hub</span></div>
        <h2>FleetFlow</h2>
        <p>Replace inefficient manual logbooks with a centralized, rule-based digital hub that optimizes your delivery fleet lifecycle.</p>
        <div style="margin-top:2rem;display:flex;gap:1.5rem;justify-content:center;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:1.75rem;font-weight:800;color:white">Fleet</div><div style="font-size:0.75rem;color:rgba(255,255,255,0.7)">Management</div></div>
          <div style="text-align:center"><div style="font-size:1.75rem;font-weight:800;color:white">RBAC</div><div style="font-size:0.75rem;color:rgba(255,255,255,0.7)">Roles</div></div>
          <div style="text-align:center"><div style="font-size:1.75rem;font-weight:800;color:white">99%</div><div style="font-size:0.75rem;color:rgba(255,255,255,0.7)">Uptime</div></div>
        </div>
      </div>
    </div>`;
}

/* ════════════════════════════════════════════════════════════════
   EVENT HANDLERS
   ════════════════════════════════════════════════════════════════ */
function bindLoginEvents() {
  // Forgot password modal
  const modal = document.getElementById('forgot-modal');
  document.getElementById('forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'flex';
  });
  document.getElementById('forgot-close')?.addEventListener('click', () => modal.style.display = 'none');
  document.getElementById('forgot-cancel')?.addEventListener('click', () => modal.style.display = 'none');
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  document.getElementById('forgot-submit')?.addEventListener('click', () => {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { toast('Please enter your email', 'error'); return; }
    toast('Password reset request sent to administrator for ' + email, 'success');
    modal.style.display = 'none';
  });

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Signing in...';
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const result = await store.login(username, password);
    if (result.success) {
      toast('Welcome back, ' + result.user.name + '!', 'success');
      router.navigate('/dashboard');
    } else {
      const err = document.getElementById('login-error');
      err.style.display = 'flex';
      err.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px">error</span> ${result.error}`;
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-rounded">login</span> Sign In';
    }
  });
}

function bindRegisterEvents() {
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailVal = document.getElementById('reg-email').value.trim();
    if (!emailVal.toLowerCase().endsWith('@gmail.com')) {
      const err = document.getElementById('register-error');
      err.style.display = 'flex';
      err.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px">error</span> Only @gmail.com email addresses are allowed`;
      return;
    }
    const pass = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    if (pass !== confirm) {
      const err = document.getElementById('register-error');
      err.style.display = 'flex';
      err.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px">error</span> Passwords do not match`;
      return;
    }
    const btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Creating account...';
    const username = document.getElementById('reg-email').value.trim();
    const name = document.getElementById('reg-name').value.trim();
    const companyName = document.getElementById('reg-company').value.trim();
    const role = document.getElementById('reg-role').value;
    const result = await store.register(username, pass, name, role, companyName);
    if (result.success) {
      toast('Account created! Welcome, ' + result.user.name + '!', 'success');
      router.navigate('/dashboard');
    } else {
      const err = document.getElementById('register-error');
      err.style.display = 'flex';
      err.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px">error</span> ${result.error}`;
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-rounded">person_add</span> Create Account';
    }
  });
}
