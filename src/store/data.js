const TOKEN_KEY = 'fleetflow_token';
const API_BASE = '/api';

class Store {
    constructor() {
        this._listeners = [];
        this._data = {
            vehicles: [],
            drivers: [],
            trips: [],
            maintenance: [],
            fuelLogs: [],
            expenses: [],
            currentUser: null,
        };
    }

    _getAuthHeaders() {
        const token = localStorage.getItem(TOKEN_KEY);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    async _api(method, path, body) {
        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers: this._getAuthHeaders(),
            ...(body !== undefined && { body: JSON.stringify(body) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { success: false, error: data.error || res.statusText };
        return data;
    }

    _notify() {
        this._listeners.forEach(fn => fn(this._data));
    }

    subscribe(fn) {
        this._listeners.push(fn);
        return () => { this._listeners = this._listeners.filter(l => l !== fn); };
    }

    async fetchAll() {
        if (!this._data.currentUser) return;
        const [v, d, t, m, f, e] = await Promise.all([
            this._api('GET', '/vehicles'),
            this._api('GET', '/drivers'),
            this._api('GET', '/trips'),
            this._api('GET', '/maintenance'),
            this._api('GET', '/fuel'),
            this._api('GET', '/expenses'),
        ]);
        if (v.success) this._data.vehicles = v.data || [];
        else console.warn('[FleetFlow] Failed to fetch vehicles:', v.error);
        if (d.success) this._data.drivers = d.data || [];
        else console.warn('[FleetFlow] Failed to fetch drivers:', d.error);
        if (t.success) this._data.trips = t.data || [];
        else console.warn('[FleetFlow] Failed to fetch trips:', t.error);
        if (m.success) this._data.maintenance = m.data || [];
        else console.warn('[FleetFlow] Failed to fetch maintenance:', m.error);
        if (f.success) this._data.fuelLogs = f.data || [];
        else console.warn('[FleetFlow] Failed to fetch fuel logs:', f.error);
        if (e.success) this._data.expenses = e.data || [];
        else console.warn('[FleetFlow] Failed to fetch expenses:', e.error);
        this._notify();
    }

    get currentUser() { return this._data.currentUser; }

    async login(username, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!data.success) return { success: false, error: data.error };
            localStorage.setItem(TOKEN_KEY, data.token);
            this._data.currentUser = data.user;
            await this.fetchAll();
            this._notify();
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, error: 'Cannot connect to server. Is the backend running?' };
        }
    }

    async register(username, password, name, role, companyName) {
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, name, role, companyName: companyName || '' }),
            });
            const data = await res.json();
            if (!data.success) return { success: false, error: data.error };
            localStorage.setItem(TOKEN_KEY, data.token);
            this._data.currentUser = data.user;
            await this.fetchAll();
            this._notify();
            return { success: true, user: data.user };
        } catch (err) {
            return { success: false, error: 'Cannot connect to server. Is the backend running?' };
        }
    }

    async restoreSession() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;
        try {
            const res = await fetch(`${API_BASE}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                this._data.currentUser = data.user;
                await this.fetchAll();
                return true;
            }
        } catch (err) { }
        localStorage.removeItem(TOKEN_KEY);
        this._data.currentUser = null;
        return false;
    }

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        this._data.currentUser = null;
        this._data.vehicles = [];
        this._data.drivers = [];
        this._data.trips = [];
        this._data.maintenance = [];
        this._data.fuelLogs = [];
        this._data.expenses = [];
        this._notify();
    }

    async updateProfile(updates) {
        try {
            const res = await fetch(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: this._getAuthHeaders(),
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (data.success) {
                this._data.currentUser = data.user;
                this._notify();
                return { success: true, user: data.user };
            }
            return { success: false, error: data.error };
        } catch (err) {
            return { success: false, error: 'Failed to update profile' };
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const res = await fetch(`${API_BASE}/auth/profile/password`, {
                method: 'PATCH',
                headers: this._getAuthHeaders(),
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to change password' };
        }
    }

    get vehicles() { return [...this._data.vehicles]; }
    getVehicle(id) { return this._data.vehicles.find(v => v.id === id || v.id?.toString() === id); }

    async fetchVehicles(params = {}) {
        const q = new URLSearchParams(params).toString();
        const r = await this._api('GET', '/vehicles' + (q ? '?' + q : ''));
        if (r.success) this._data.vehicles = r.data || [];
        this._notify();
        return r;
    }

    async addVehicle(vehicle) {
        const r = await this._api('POST', '/vehicles', { ...vehicle, dateAdded: new Date().toISOString().slice(0, 10) });
        if (r.success) {
            this._data.vehicles.push(r.data);
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    async updateVehicle(id, updates) {
        const r = await this._api('PUT', `/vehicles/${id}`, updates);
        if (r.success) {
            const idx = this._data.vehicles.findIndex(v => (v.id || v._id) === id);
            if (idx !== -1) this._data.vehicles[idx] = r.data;
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    async setVehicleStatus(id, status) {
        const r = await this._api('PATCH', `/vehicles/${id}/status`, { status });
        if (r.success) {
            const idx = this._data.vehicles.findIndex(v => (v.id || v._id) === id);
            if (idx !== -1) this._data.vehicles[idx] = r.data;
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    async deleteVehicle(id) {
        const r = await this._api('DELETE', `/vehicles/${id}`);
        if (r.success) {
            this._data.vehicles = this._data.vehicles.filter(v => (v.id || v._id) !== id);
            this._notify();
        }
        return r;
    }

    get availableVehicles() {
        return this._data.vehicles.filter(v => v.status === 'Available');
    }

    get drivers() { return [...this._data.drivers]; }
    getDriver(id) { return this._data.drivers.find(d => d.id === id || d.id?.toString() === id); }

    async fetchDrivers(params = {}) {
        const q = new URLSearchParams(params).toString();
        const r = await this._api('GET', '/drivers' + (q ? '?' + q : ''));
        if (r.success) this._data.drivers = r.data || [];
        this._notify();
        return r;
    }

    async addDriver(driver) {
        const r = await this._api('POST', '/drivers', {
            ...driver,
            tripsCompleted: driver.tripsCompleted ?? 0,
            tripsCancelled: driver.tripsCancelled ?? 0,
            safetyScore: driver.safetyScore ?? 100,
        });
        if (r.success) {
            this._data.drivers.push(r.data);
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    async updateDriver(id, updates) {
        const r = await this._api('PUT', `/drivers/${id}`, updates);
        if (r.success) {
            const idx = this._data.drivers.findIndex(d => (d.id || d._id) === id);
            if (idx !== -1) this._data.drivers[idx] = r.data;
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    async setDriverStatus(id, status) {
        const r = await this._api('PATCH', `/drivers/${id}/status`, { status });
        if (r.success) {
            const idx = this._data.drivers.findIndex(d => (d.id || d._id) === id);
            if (idx !== -1) this._data.drivers[idx] = r.data;
            this._notify();
            return { success: true };
        }
        return r;
    }

    get availableDrivers() {
        const today = new Date().toISOString().slice(0, 10);
        return this._data.drivers.filter(d =>
            d.status === 'On Duty' && (d.licenseExpiry || '') >= today
        );
    }

    isDriverLicenseValid(driverId, vehicleType) {
        const driver = this.getDriver(driverId);
        if (!driver) return { valid: false, reason: 'Driver not found' };
        const today = new Date().toISOString().slice(0, 10);
        const expiry = (driver.licenseExpiry || '').slice(0, 10);
        if (expiry < today) return { valid: false, reason: 'License expired on ' + expiry };
        const cats = (driver.licenseCategory || '').split(',').map(c => c.trim());
        if (!cats.includes(vehicleType)) return { valid: false, reason: `Not licensed for ${vehicleType}` };
        return { valid: true };
    }

    get trips() { return [...this._data.trips]; }
    getTrip(id) { return this._data.trips.find(t => t.id === id || t.id?.toString() === id); }

    async fetchTrips(params = {}) {
        const q = new URLSearchParams(params).toString();
        const r = await this._api('GET', '/trips' + (q ? '?' + q : ''));
        if (r.success) this._data.trips = r.data || [];
        this._notify();
        return r;
    }

    async createTrip(trip) {
        const vehicle = this.getVehicle(trip.vehicleId);
        if (!vehicle) return { success: false, error: 'Vehicle not found' };
        if (vehicle.status !== 'Available') return { success: false, error: 'Vehicle is not available' };
        if (trip.cargoWeight > vehicle.maxCapacity) {
            return { success: false, error: `Cargo weight (${trip.cargoWeight}kg) exceeds vehicle max capacity (${vehicle.maxCapacity}kg)` };
        }
        const licCheck = this.isDriverLicenseValid(trip.driverId, vehicle.type);
        if (!licCheck.valid) return { success: false, error: licCheck.reason };
        const driver = this.getDriver(trip.driverId);
        if (!driver || driver.status !== 'On Duty') return { success: false, error: 'Driver is not available (must be On Duty)' };

        const r = await this._api('POST', '/trips', trip);
        if (r.success) {
            this._data.trips.unshift(r.data);
            this._notify();
            return { success: true, trip: r.data };
        }
        return r;
    }

    async dispatchTrip(id) {
        const r = await this._api('PATCH', `/trips/${id}/dispatch`);
        if (r.success) {
            await Promise.all([this.fetchTrips(), this.fetchVehicles(), this.fetchDrivers()]);
            return { success: true };
        }
        return r;
    }

    async completeTrip(id, endOdometer) {
        const r = await this._api('PATCH', `/trips/${id}/complete`, { endOdometer });
        if (r.success) {
            await Promise.all([this.fetchTrips(), this.fetchVehicles(), this.fetchDrivers()]);
            return { success: true };
        }
        return r;
    }

    async cancelTrip(id) {
        const r = await this._api('PATCH', `/trips/${id}/cancel`);
        if (r.success) {
            await Promise.all([this.fetchTrips(), this.fetchVehicles(), this.fetchDrivers()]);
            return { success: true };
        }
        return r;
    }

    get maintenance() { return [...this._data.maintenance]; }

    async fetchMaintenance(params = {}) {
        const q = new URLSearchParams(params).toString();
        const r = await this._api('GET', '/maintenance' + (q ? '?' + q : ''));
        if (r.success) this._data.maintenance = r.data || [];
        this._notify();
        return r;
    }

    async addMaintenance(record) {
        const r = await this._api('POST', '/maintenance', record);
        if (r.success) {
            this._data.maintenance.unshift(r.data);
            await this.fetchVehicles();
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    async updateMaintenance(id, updates) {
        const r = await this._api('PATCH', `/maintenance/${id}`, updates);
        if (r.success) {
            const idx = this._data.maintenance.findIndex(m => (m.id || m._id) === id);
            if (idx !== -1) this._data.maintenance[idx] = r.data;
            await this.fetchVehicles();
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    getMaintenanceForVehicle(vehicleId) {
        return this._data.maintenance.filter(m => (m.vehicleId || m.vehicleId?.toString()) === (vehicleId?.toString?.() || vehicleId));
    }

    get fuelLogs() { return [...this._data.fuelLogs]; }

    async fetchFuelLogs(params = {}) {
        const q = new URLSearchParams(params).toString();
        const r = await this._api('GET', '/fuel' + (q ? '?' + q : ''));
        if (r.success) this._data.fuelLogs = r.data || [];
        this._notify();
        return r;
    }

    async addFuelLog(log) {
        const totalCost = (log.liters || 0) * (log.costPerLiter || 0);
        const r = await this._api('POST', '/fuel', { ...log, totalCost });
        if (r.success) {
            this._data.fuelLogs.unshift(r.data);
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    getFuelLogsForVehicle(vehicleId) {
        const id = vehicleId?.toString?.() || vehicleId;
        return this._data.fuelLogs.filter(f => (f.vehicleId || f.vehicleId?.toString()) === id);
    }

    get expenses() { return [...this._data.expenses]; }

    async fetchExpenses(params = {}) {
        const q = new URLSearchParams(params).toString();
        const r = await this._api('GET', '/expenses' + (q ? '?' + q : ''));
        if (r.success) this._data.expenses = r.data || [];
        this._notify();
        return r;
    }

    async addExpense(expense) {
        const r = await this._api('POST', '/expenses', expense);
        if (r.success) {
            this._data.expenses.unshift(r.data);
            this._notify();
            return { success: true, data: r.data };
        }
        return r;
    }

    getExpensesForVehicle(vehicleId) {
        const id = vehicleId?.toString?.() || vehicleId;
        return this._data.expenses.filter(e => (e.vehicleId || e.vehicleId?.toString()) === id);
    }

    getTotalFuelCost(vehicleId) {
        return this.getFuelLogsForVehicle(vehicleId).reduce((s, f) => s + (f.totalCost || 0), 0);
    }
    getTotalMaintenanceCost(vehicleId) {
        return this.getMaintenanceForVehicle(vehicleId).reduce((s, m) => s + (m.cost || 0), 0);
    }
    getTotalExpenseCost(vehicleId) {
        return this.getExpensesForVehicle(vehicleId).reduce((s, e) => s + (e.amount || 0), 0);
    }
    getTotalOperationalCost(vehicleId) {
        return this.getTotalFuelCost(vehicleId) + this.getTotalMaintenanceCost(vehicleId) + this.getTotalExpenseCost(vehicleId);
    }
    getTotalRevenue(vehicleId) {
        const id = vehicleId?.toString?.() || vehicleId;
        return this._data.trips
            .filter(t => (t.vehicleId || t.vehicleId?.toString()) === id && t.status === 'Completed')
            .reduce((s, t) => s + (t.revenue || 0), 0);
    }
    getVehicleROI(vehicleId) {
        const vehicle = this.getVehicle(vehicleId);
        if (!vehicle || !vehicle.acquisitionCost) return 0;
        const revenue = this.getTotalRevenue(vehicleId);
        const cost = this.getTotalOperationalCost(vehicleId);
        return (((revenue - cost) / vehicle.acquisitionCost) * 100).toFixed(1);
    }

    get kpis() {
        const vehicles = this._data.vehicles.filter(v => v.status !== 'Retired');
        const activeFleet = vehicles.filter(v => v.status === 'On Trip').length;
        const inShop = vehicles.filter(v => v.status === 'In Shop').length;
        const available = vehicles.filter(v => v.status === 'Available').length;
        const total = vehicles.length;
        const utilizationRate = total > 0 ? ((activeFleet / total) * 100).toFixed(1) : 0;
        const pendingCargo = this._data.trips.filter(t => t.status === 'Draft').length;
        const totalDrivers = this._data.drivers.length;
        const activeDrivers = this._data.drivers.filter(d => d.status === 'On Duty' || d.status === 'On Trip').length;
        return { activeFleet, inShop, available, total, utilizationRate: Number(utilizationRate), pendingCargo, totalDrivers, activeDrivers };
    }
}

export const store = new Store();
