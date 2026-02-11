// Contador Dashboard JavaScript
const { checkAuth, apiRequest, logout } = window.authModule;
const { emitVoteUpdate } = window.socketModule;

// Check authentication
const auth = checkAuth();
if (!auth || auth.user.role !== 'contador') {
    window.location.href = '/index.html';
}

// Global state
let personas = [];
let currentFilter = 'all';
let selectedPersonaId = null;

// DOM Elements
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    userName.textContent = auth.user.nombre;
    logoutBtn.addEventListener('click', logout);
    
    loadDashboard();
    initEventListeners();
});

// Load Dashboard Data
async function loadDashboard() {
    try {
        const data = await apiRequest('/contador/dashboard');
        updateStats(data.data.stats);
        personas = data.data.personas;
        renderPersonas();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error al cargar el dashboard');
    }
}

// Update Statistics
function updateStats(stats) {
    document.getElementById('totalAsignados').textContent = stats.total_asignados || 0;
    document.getElementById('totalVotaron').textContent = stats.total_votaron || 0;
    document.getElementById('totalPendientes').textContent = stats.total_pendientes || 0;
    
    // Update progress bar
    const total = parseInt(stats.total_asignados) || 0;
    const votaron = parseInt(stats.total_votaron) || 0;
    const percentage = total > 0 ? Math.round((votaron / total) * 100) : 0;
    
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = percentage + '%';
    progressText.textContent = percentage + '%';
}

// Render Personas List
function renderPersonas() {
    const container = document.getElementById('personasList');
    
    // Filter personas based on current filter
    let filtered = personas;
    if (currentFilter === 'voted') {
        filtered = personas.filter(p => p.ha_votado);
    } else if (currentFilter === 'pending') {
        filtered = personas.filter(p => !p.ha_votado);
    }
    
    // Apply search filter
    const searchTerm = document.getElementById('searchPersonas').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm) ||
            (p.cedula && p.cedula.includes(searchTerm))
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">No hay votantes para mostrar</div>';
        return;
    }
    
    container.innerHTML = filtered.map(p => `
        <div class="persona-card ${p.ha_votado ? 'voted' : ''}">
            <div class="persona-info">
                <h3>${p.nombre}</h3>
                <div class="persona-details">
                    ${p.cedula ? `<div class="persona-detail"><strong>Cédula:</strong> ${p.cedula}</div>` : ''}
                    ${p.telefono ? `<div class="persona-detail"><strong>Teléfono:</strong> ${p.telefono}</div>` : ''}
                    ${p.zona ? `<div class="persona-detail"><strong>Zona:</strong> ${p.zona}</div>` : ''}
                    ${p.partido ? `<div class="persona-detail"><strong>Partido:</strong> ${p.partido}</div>` : ''}
                    ${p.direccion ? `<div class="persona-detail"><strong>Dirección:</strong> ${p.direccion}</div>` : ''}
                </div>
            </div>
            <div class="persona-actions">
                ${p.ha_votado 
                    ? `<div class="vote-status voted">✓ Votó</div>` 
                    : `<button class="btn btn-success" onclick="openVoteModal(${p.id}, '${p.nombre.replace(/'/g, "\\'")}')">Marcar Voto</button>`
                }
            </div>
        </div>
    `).join('');
}

// Event Listeners
function initEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.getAttribute('data-filter');
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            renderPersonas();
        });
    });
    
    // Search
    document.getElementById('searchPersonas').addEventListener('input', () => {
        renderPersonas();
    });
    
    // Vote modal
    document.getElementById('cancelVoteBtn').addEventListener('click', closeVoteModal);
    document.getElementById('confirmVoteBtn').addEventListener('click', confirmVote);
    
    // Modal close button
    document.querySelector('#voteModal .close').addEventListener('click', closeVoteModal);
}

// Open Vote Modal
function openVoteModal(id, nombre) {
    selectedPersonaId = id;
    document.getElementById('voterName').textContent = nombre;
    document.getElementById('voteModal').classList.add('show');
}

// Close Vote Modal
function closeVoteModal() {
    document.getElementById('voteModal').classList.remove('show');
    selectedPersonaId = null;
}

// Confirm Vote
async function confirmVote() {
    if (!selectedPersonaId) return;
    
    try {
        await apiRequest(`/personas/${selectedPersonaId}/voto`, {
            method: 'PATCH'
        });
        
        closeVoteModal();
        loadDashboard();
        emitVoteUpdate({ id: selectedPersonaId, ha_votado: true });
        
        // Show success message
        const tempMsg = document.createElement('div');
        tempMsg.className = 'success-message';
        tempMsg.textContent = 'Voto marcado exitosamente';
        tempMsg.style.position = 'fixed';
        tempMsg.style.top = '20px';
        tempMsg.style.right = '20px';
        tempMsg.style.zIndex = '9999';
        document.body.appendChild(tempMsg);
        
        setTimeout(() => {
            document.body.removeChild(tempMsg);
        }, 3000);
    } catch (error) {
        alert('Error al marcar voto: ' + error.message);
    }
}

// Refresh Dashboard (called by socket events)
function refreshDashboard() {
    loadDashboard();
}

// Make functions global for onclick handlers
window.openVoteModal = openVoteModal;
window.refreshDashboard = refreshDashboard;
