// Authentication Module
const API_URL = window.location.origin + '/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = '/index.html';
        }
        return null;
    }
    
    return { token, user };
}

// Redirect based on role
function redirectByRole(role) {
    if (role === 'admin') {
        window.location.href = '/admin.html';
    } else if (role === 'contador') {
        window.location.href = '/contador.html';
    }
}

// API Request helper
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/index.html';
            }
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// Login page functionality
if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Iniciando...';
                errorMessage.style.display = 'none';
                
                const data = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });
                
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                redirectByRole(data.data.user.role);
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
                loginBtn.disabled = false;
                loginBtn.textContent = 'Iniciar Sesión';
            }
        });
    }
}

// Export functions for use in other modules
window.authModule = {
    checkAuth,
    apiRequest,
    logout,
    redirectByRole
};
