class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        window.addEventListener('hashchange', () => this._resolve());
    }

    register(path, renderFn) {
        this.routes[path] = renderFn;
    }

    navigate(path) {
        window.location.hash = '#' + path;
    }

    _resolve() {
        const hash = window.location.hash.slice(1) || '/login';
        const route = this.routes[hash];
        if (route) {
            this.currentRoute = hash;
            route();
        } else {
            this.navigate('/login');
        }
    }

    start() {
        this._resolve();
    }
}

export const router = new Router();
