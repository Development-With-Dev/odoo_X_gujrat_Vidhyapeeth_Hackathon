import { store } from '../store/data.js';
import { router } from '../utils/router.js';
import { toast } from '../utils/helpers.js';

export function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="login-page login-split">
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
      </div>
      <div class="login-forms-row">
        <div class="login-form-box">
          <h3 class="login-form-heading">Login</h3>
          <form class="login-form" id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-username">Username</label>
              <input class="form-input" type="text" id="login-username" placeholder="Enter your username" required autocomplete="username" />
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input class="form-input" type="password" id="login-password" placeholder="Enter your password" required autocomplete="current-password" />
            </div>
            <div class="form-group" style="margin-bottom:0">
              <a href="#" id="forgot-password" class="text-sm" style="color:var(--c-accent-light)">Forgot Password?</a>
            </div>
            <div id="login-error" class="form-error" style="display:none"></div>
            <button type="submit" class="btn btn-primary w-full" id="login-btn">
              <span class="material-symbols-rounded">login</span> Login
            </button>
          </form>
        </div>
        <div class="login-form-divider"></div>
        <div class="login-form-box">
          <h3 class="login-form-heading">Register</h3>
          <p class="login-register-desc">Make a new account for your business</p>
          <form class="login-form" id="register-form">
            <div class="form-group">
              <label class="form-label" for="reg-email">Email</label>
              <input class="form-input" type="text" id="reg-email" placeholder="your@email.com" required minlength="3" autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">Password</label>
              <input class="form-input" type="password" id="reg-password" placeholder="Min 4 characters" required minlength="4" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-confirm">Confirm Password</label>
              <input class="form-input" type="password" id="reg-confirm" placeholder="Confirm password" required minlength="4" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-company">Company Name</label>
              <input class="form-input" type="text" id="reg-company" placeholder="Your company name" />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-name">Display Name</label>
              <input class="form-input" type="text" id="reg-name" placeholder="Your name" required />
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
              <span class="material-symbols-rounded">person_add</span> Register
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
    bindAuthEvents();
}

function bindAuthEvents() {
    document.getElementById('forgot-password')?.addEventListener('click', (e) => {
        e.preventDefault();
        toast('Contact your administrator to reset your password.', 'info');
    });

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
            btn.innerHTML = '<span class="material-symbols-rounded">login</span> Login';
        }
    });

    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
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
            btn.innerHTML = '<span class="material-symbols-rounded">person_add</span> Register';
        }
    });
}
