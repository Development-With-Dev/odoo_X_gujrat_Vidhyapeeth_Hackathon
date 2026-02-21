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

    <!-- Forgot Password Modal — 3 Step Flow -->
    <div class="modal-overlay" id="forgot-modal" style="display:none">
      <div class="modal" style="max-width:460px">
        <div class="modal-header">
          <span class="modal-title">🔑 Reset Password</span>
          <button class="btn btn-icon btn-ghost" id="forgot-close"><span class="material-symbols-rounded">close</span></button>
        </div>

        <!-- STEP 1: Enter Email -->
        <div id="forgot-step-1">
          <div class="modal-body">
            <div style="text-align:center;margin-bottom:16px">
              <span class="material-symbols-rounded" style="font-size:48px;color:var(--c-primary);opacity:0.8">mail_lock</span>
            </div>
            <p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.7;text-align:center;margin-bottom:16px">
              Enter the email address linked to your account.<br>We'll send a <strong>6-digit verification code</strong> to reset your password.
            </p>
            <div class="form-group">
              <label class="form-label" for="forgot-email">Email Address</label>
              <div class="input-icon-wrap">
                <span class="material-symbols-rounded input-icon">mail</span>
                <input class="form-input has-icon" type="email" id="forgot-email" placeholder="yourname@gmail.com" required />
              </div>
            </div>
            <div id="forgot-error-1" class="form-error" style="display:none"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="forgot-cancel">Cancel</button>
            <button class="btn btn-primary" id="forgot-send-otp">
              <span class="material-symbols-rounded">send</span> Send Code
            </button>
          </div>
        </div>

        <!-- STEP 2: Enter OTP -->
        <div id="forgot-step-2" style="display:none">
          <div class="modal-body">
            <div style="text-align:center;margin-bottom:16px">
              <span class="material-symbols-rounded" style="font-size:48px;color:var(--c-info);opacity:0.8">pin</span>
            </div>
            <p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.7;text-align:center;margin-bottom:8px">
              We've sent a 6-digit code to <strong id="forgot-display-email"></strong>
            </p>
            <p id="forgot-timer" style="font-size:var(--fs-xs);color:var(--c-warning);text-align:center;margin-bottom:16px">
              Code expires in <strong>10:00</strong>
            </p>
            <div class="form-group">
              <label class="form-label" for="forgot-otp">Verification Code</label>
              <div class="input-icon-wrap">
                <span class="material-symbols-rounded input-icon">pin</span>
                <input class="form-input has-icon" type="text" id="forgot-otp" placeholder="Enter 6-digit code" maxlength="6" pattern="[0-9]{6}" required style="font-size:1.2rem;letter-spacing:6px;font-weight:700;text-align:center" />
              </div>
            </div>
            <div id="forgot-error-2" class="form-error" style="display:none"></div>
            <button class="btn btn-ghost w-full" id="forgot-resend" style="margin-top:8px;font-size:var(--fs-sm)">
              <span class="material-symbols-rounded" style="font-size:16px">refresh</span> Resend Code
            </button>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="forgot-back-1">
              <span class="material-symbols-rounded" style="font-size:16px">arrow_back</span> Back
            </button>
            <button class="btn btn-primary" id="forgot-verify-otp">
              <span class="material-symbols-rounded">verified</span> Verify Code
            </button>
          </div>
        </div>

        <!-- STEP 3: New Password -->
        <div id="forgot-step-3" style="display:none">
          <div class="modal-body">
            <div style="text-align:center;margin-bottom:16px">
              <span class="material-symbols-rounded" style="font-size:48px;color:var(--c-success);opacity:0.8">lock_reset</span>
            </div>
            <p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.7;text-align:center;margin-bottom:16px">
              Code verified! Set your new password below.
            </p>
            <div class="form-group">
              <label class="form-label" for="forgot-new-pass">New Password</label>
              <div class="input-icon-wrap">
                <span class="material-symbols-rounded input-icon">lock</span>
                <input class="form-input has-icon" type="password" id="forgot-new-pass" placeholder="Min 4 characters" required minlength="4" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="forgot-confirm-pass">Confirm Password</label>
              <div class="input-icon-wrap">
                <span class="material-symbols-rounded input-icon">lock</span>
                <input class="form-input has-icon" type="password" id="forgot-confirm-pass" placeholder="Confirm new password" required minlength="4" />
              </div>
            </div>
            <div id="forgot-error-3" class="form-error" style="display:none"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="forgot-back-2">
              <span class="material-symbols-rounded" style="font-size:16px">arrow_back</span> Back
            </button>
            <button class="btn btn-primary" id="forgot-reset-pass">
              <span class="material-symbols-rounded">lock_reset</span> Reset Password
            </button>
          </div>
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
  const modal = document.getElementById('forgot-modal');
  const step1 = document.getElementById('forgot-step-1');
  const step2 = document.getElementById('forgot-step-2');
  const step3 = document.getElementById('forgot-step-3');
  let resetEmail = '';
  let resetOtp = '';
  let timerInterval = null;

  function showStep(n) {
    step1.style.display = n === 1 ? '' : 'none';
    step2.style.display = n === 2 ? '' : 'none';
    step3.style.display = n === 3 ? '' : 'none';
  }

  function closeModal() {
    modal.style.display = 'none';
    showStep(1);
    if (timerInterval) clearInterval(timerInterval);
    // Reset fields
    document.getElementById('forgot-email').value = '';
    document.getElementById('forgot-otp').value = '';
    document.getElementById('forgot-new-pass').value = '';
    document.getElementById('forgot-confirm-pass').value = '';
    [document.getElementById('forgot-error-1'), document.getElementById('forgot-error-2'), document.getElementById('forgot-error-3')].forEach(e => { if (e) e.style.display = 'none'; });
  }

  function showError(step, msg) {
    const el = document.getElementById(`forgot-error-${step}`);
    if (el) {
      el.style.display = 'flex';
      el.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px">error</span> ${msg}`;
    }
  }

  function startTimer() {
    let seconds = 600; // 10 min
    const timerEl = document.getElementById('forgot-timer');
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds--;
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      if (timerEl) timerEl.innerHTML = `Code expires in <strong>${m}:${s}</strong>`;
      if (seconds <= 0) {
        clearInterval(timerInterval);
        if (timerEl) { timerEl.innerHTML = '<strong style="color:var(--c-danger)">Code expired — request a new one</strong>'; }
      }
    }, 1000);
  }

  async function sendOTP(email) {
    const btn = document.getElementById('forgot-send-otp');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Sending...';
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { showError(1, data.error || 'Failed to send code'); return false; }
      return true;
    } catch {
      showError(1, 'Cannot connect to server');
      return false;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-rounded">send</span> Send Code';
    }
  }

  // Open modal
  document.getElementById('forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'flex';
    showStep(1);
  });
  document.getElementById('forgot-close')?.addEventListener('click', closeModal);
  document.getElementById('forgot-cancel')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Step 1 → Step 2 : Send OTP
  document.getElementById('forgot-send-otp')?.addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { showError(1, 'Please enter your email'); return; }
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) { showError(1, 'Please enter a valid Gmail address'); return; }
    document.getElementById('forgot-error-1').style.display = 'none';
    const ok = await sendOTP(email);
    if (ok) {
      resetEmail = email;
      document.getElementById('forgot-display-email').textContent = email;
      showStep(2);
      startTimer();
      toast('Verification code sent to ' + email, 'success');
    }
  });

  // Step 2 → Step 1 : Back
  document.getElementById('forgot-back-1')?.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    showStep(1);
  });

  // Step 2 : Resend
  document.getElementById('forgot-resend')?.addEventListener('click', async () => {
    document.getElementById('forgot-error-2').style.display = 'none';
    const ok = await sendOTP(resetEmail);
    if (ok) { startTimer(); toast('New verification code sent!', 'success'); }
  });

  // Step 2 → Step 3 : Verify OTP
  document.getElementById('forgot-verify-otp')?.addEventListener('click', () => {
    const otp = document.getElementById('forgot-otp').value.trim();
    if (!otp || otp.length !== 6) { showError(2, 'Please enter a valid 6-digit code'); return; }
    document.getElementById('forgot-error-2').style.display = 'none';
    resetOtp = otp;
    showStep(3);
  });

  // Step 3 → Step 2 : Back
  document.getElementById('forgot-back-2')?.addEventListener('click', () => showStep(2));

  // Step 3 : Reset Password
  document.getElementById('forgot-reset-pass')?.addEventListener('click', async () => {
    const newPass = document.getElementById('forgot-new-pass').value;
    const confirmPass = document.getElementById('forgot-confirm-pass').value;
    if (!newPass || newPass.length < 4) { showError(3, 'Password must be at least 4 characters'); return; }
    if (newPass !== confirmPass) { showError(3, 'Passwords do not match'); return; }
    document.getElementById('forgot-error-3').style.display = 'none';

    const btn = document.getElementById('forgot-reset-pass');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Resetting...';
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast('Password reset successfully! You can now login.', 'success');
        closeModal();
      } else {
        showError(3, data.error || 'Failed to reset password');
      }
    } catch {
      showError(3, 'Cannot connect to server');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-rounded">lock_reset</span> Reset Password';
    }
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
