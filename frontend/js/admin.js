// Admin Dashboard JavaScript
const { checkAuth, apiRequest, logout } = window.authModule;
const { emitPersonaUpdate, emitDashboardRefresh } = window.socketModule;

// Check authentication
const auth = checkAuth();
if (!auth || auth.user.role !== 'admin') {
    window.location.href = '/index.html';
}

// Global state
let dashboardData = null;
let personas = [];
let contadores = [];
let lideres = [];
let charts = {};

// DOM Elements
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    userName.textContent = auth.user.nombre;
    logoutBtn.addEventListener('click', logout);
    
    initTabs();
    loadDashboard();
    initEventListeners();
});

// Tab Navigation
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Load data for specific tab
            if (tabName === 'contadores') loadContadores();
            if (tabName === 'lideres') loadLideres();
        });
    });
}

// Load Dashboard Data
async function loadDashboard() {
    try {
        const data = await apiRequest('/admin/dashboard');
        dashboardData = data.data;
        
        updateStats();
        updateCharts();
        loadPersonas();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error al cargar el dashboard');
    }
}

// Update Statistics
function updateStats() {
    if (!dashboardData) return;
    
    document.getElementById('totalPersonas').textContent = dashboardData.personas.total || 0;
    document.getElementById('totalVotaron').textContent = dashboardData.personas.votaron || 0;
    document.getElementById('totalPendientes').textContent = dashboardData.personas.pendientes || 0;
    document.getElementById('totalContadores').textContent = dashboardData.contadores.total || 0;
}

// Update Charts
function updateCharts() {
    if (!dashboardData) return;
    
    // Zona Chart
    const zonaCtx = document.getElementById('zonaChart');
    if (charts.zonaChart) charts.zonaChart.destroy();
    
    const zonaData = dashboardData.statsByZona || [];
    charts.zonaChart = new Chart(zonaCtx, {
        type: 'bar',
        data: {
            labels: zonaData.map(z => z.zona || 'Sin zona'),
            datasets: [{
                label: 'Total',
                data: zonaData.map(z => z.total),
                backgroundColor: 'rgba(37, 99, 235, 0.5)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1
            }, {
                label: 'Votaron',
                data: zonaData.map(z => z.votaron),
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Partido Chart
    const partidoCtx = document.getElementById('partidoChart');
    if (charts.partidoChart) charts.partidoChart.destroy();
    
    const partidoData = dashboardData.statsByPartido || [];
    charts.partidoChart = new Chart(partidoCtx, {
        type: 'pie',
        data: {
            labels: partidoData.map(p => p.partido || 'Sin partido'),
            datasets: [{
                data: partidoData.map(p => p.total),
                backgroundColor: [
                    'rgba(37, 99, 235, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(139, 92, 246, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// Load Personas
async function loadPersonas() {
    try {
        const data = await apiRequest('/personas');
        personas = data.data;
        renderPersonasTable();
        populateFilters();
    } catch (error) {
        console.error('Error loading personas:', error);
    }
}

// Render Personas Table
function renderPersonasTable() {
    const tbody = document.getElementById('personasTableBody');
    
    if (personas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay votantes registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = personas.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.cedula || '-'}</td>
            <td>${p.zona || '-'}</td>
            <td>${p.partido || '-'}</td>
            <td>${p.contador_nombre || 'Sin asignar'}</td>
            <td>
                <span class="badge ${p.ha_votado ? 'badge-success' : 'badge-danger'}">
                    ${p.ha_votado ? 'Sí' : 'No'}
                </span>
            </td>
            <td>
                ${!p.ha_votado ? `<button class="action-btn action-btn-vote" onclick="markVote(${p.id})">Marcar Voto</button>` : ''}
                <button class="action-btn action-btn-delete" onclick="deletePersona(${p.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// Populate Filters
function populateFilters() {
    const zonas = [...new Set(personas.map(p => p.zona).filter(Boolean))];
    const partidos = [...new Set(personas.map(p => p.partido).filter(Boolean))];
    
    const filterZona = document.getElementById('filterZona');
    const filterPartido = document.getElementById('filterPartido');
    
    filterZona.innerHTML = '<option value="">Todas las zonas</option>' +
        zonas.map(z => `<option value="${z}">${z}</option>`).join('');
    
    filterPartido.innerHTML = '<option value="">Todos los partidos</option>' +
        partidos.map(p => `<option value="${p}">${p}</option>`).join('');
}

// Load Contadores
async function loadContadores() {
    try {
        const data = await apiRequest('/admin/usuarios');
        contadores = data.data;
        renderContadoresTable();
        populateContadorSelect();
    } catch (error) {
        console.error('Error loading contadores:', error);
    }
}

// Render Contadores Table
function renderContadoresTable() {
    const tbody = document.getElementById('contadoresTableBody');
    
    if (contadores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay contadores registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = contadores.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${c.username}</td>
            <td>${c.email || '-'}</td>
            <td>${c.stats?.total_asignados || 0}</td>
            <td>${c.stats?.total_votaron || 0}</td>
            <td>${c.stats?.total_pendientes || 0}</td>
            <td>
                <button class="action-btn action-btn-delete" onclick="deleteContador(${c.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// Populate Contador Select
function populateContadorSelect() {
    const select = document.getElementById('personaContador');
    select.innerHTML = '<option value="">Sin asignar</option>' +
        contadores.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

// Load Lideres
async function loadLideres() {
    try {
        const data = await apiRequest('/admin/lideres/estadisticas');
        lideres = data.data;
        renderLideresTable();
    } catch (error) {
        console.error('Error loading lideres:', error);
    }
}

// Render Lideres Table
function renderLideresTable() {
    const tbody = document.getElementById('lideresTableBody');
    
    if (lideres.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay líderes registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = lideres.map(l => `
        <tr>
            <td>${l.nombre}</td>
            <td>${l.partido || '-'}</td>
            <td>${l.zona || '-'}</td>
            <td>${l.total_personas || 0}</td>
            <td>${l.total_votaron || 0}</td>
            <td>
                <button class="action-btn action-btn-delete" onclick="deleteLider(${l.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// Event Listeners
function initEventListeners() {
    // Add Persona
    document.getElementById('addPersonaBtn').addEventListener('click', () => {
        openPersonaModal();
    });
    
    // Add Contador
    document.getElementById('addContadorBtn').addEventListener('click', () => {
        openContadorModal();
    });
    
    // Add Lider
    document.getElementById('addLiderBtn').addEventListener('click', () => {
        openLiderModal();
    });
    
    // Persona Form
    document.getElementById('personaForm').addEventListener('submit', savePersona);
    document.getElementById('cancelPersonaBtn').addEventListener('click', closePersonaModal);
    
    // Contador Form
    document.getElementById('contadorForm').addEventListener('submit', saveContador);
    document.getElementById('cancelContadorBtn').addEventListener('click', closeContadorModal);
    
    // Lider Form
    document.getElementById('liderForm').addEventListener('submit', saveLider);
    document.getElementById('cancelLiderBtn').addEventListener('click', closeLiderModal);
    
    // Search and Filters
    document.getElementById('searchPersonas').addEventListener('input', filterPersonas);
    document.getElementById('filterZona').addEventListener('change', filterPersonas);
    document.getElementById('filterPartido').addEventListener('change', filterPersonas);
    
    // Excel
    document.getElementById('importExcelBtn').addEventListener('click', () => {
        document.getElementById('excelFile').click();
    });
    
    document.getElementById('excelFile').addEventListener('change', importExcel);
    document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
    
    // Reset DB
    document.getElementById('resetDbBtn').addEventListener('click', resetDatabase);
    
    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
}

// Modal Functions
function openPersonaModal(persona = null) {
    const modal = document.getElementById('personaModal');
    const form = document.getElementById('personaForm');
    
    form.reset();
    
    if (persona) {
        document.getElementById('personaModalTitle').textContent = 'Editar Votante';
        document.getElementById('personaId').value = persona.id;
        document.getElementById('personaNombre').value = persona.nombre;
        document.getElementById('personaCedula').value = persona.cedula || '';
        document.getElementById('personaTelefono').value = persona.telefono || '';
        document.getElementById('personaZona').value = persona.zona || '';
        document.getElementById('personaPartido').value = persona.partido || '';
        document.getElementById('personaDireccion').value = persona.direccion || '';
        document.getElementById('personaContador').value = persona.contador_id || '';
    } else {
        document.getElementById('personaModalTitle').textContent = 'Agregar Votante';
    }
    
    modal.classList.add('show');
}

function closePersonaModal() {
    document.getElementById('personaModal').classList.remove('show');
}

function openContadorModal() {
    document.getElementById('contadorModal').classList.add('show');
}

function closeContadorModal() {
    document.getElementById('contadorModal').classList.remove('show');
}

function openLiderModal() {
    document.getElementById('liderModal').classList.add('show');
}

function closeLiderModal() {
    document.getElementById('liderModal').classList.remove('show');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

// Save Persona
async function savePersona(e) {
    e.preventDefault();
    
    const personaData = {
        nombre: document.getElementById('personaNombre').value,
        cedula: document.getElementById('personaCedula').value,
        telefono: document.getElementById('personaTelefono').value,
        zona: document.getElementById('personaZona').value,
        partido: document.getElementById('personaPartido').value,
        direccion: document.getElementById('personaDireccion').value,
        contador_id: document.getElementById('personaContador').value || null
    };
    
    try {
        await apiRequest('/personas', {
            method: 'POST',
            body: JSON.stringify(personaData)
        });
        
        closePersonaModal();
        loadDashboard();
        emitDashboardRefresh();
        alert('Votante guardado exitosamente');
    } catch (error) {
        alert('Error al guardar votante: ' + error.message);
    }
}

// Save Contador
async function saveContador(e) {
    e.preventDefault();
    
    const contadorData = {
        nombre: document.getElementById('contadorNombre').value,
        username: document.getElementById('contadorUsername').value,
        password: document.getElementById('contadorPassword').value,
        email: document.getElementById('contadorEmail').value
    };
    
    try {
        await apiRequest('/admin/usuarios', {
            method: 'POST',
            body: JSON.stringify(contadorData)
        });
        
        closeContadorModal();
        loadContadores();
        alert('Contador creado exitosamente');
    } catch (error) {
        alert('Error al crear contador: ' + error.message);
    }
}

// Save Lider
async function saveLider(e) {
    e.preventDefault();
    
    const liderData = {
        nombre: document.getElementById('liderNombre').value,
        partido: document.getElementById('liderPartido').value,
        zona: document.getElementById('liderZona').value,
        telefono: document.getElementById('liderTelefono').value,
        email: document.getElementById('liderEmail').value
    };
    
    try {
        await apiRequest('/admin/lideres', {
            method: 'POST',
            body: JSON.stringify(liderData)
        });
        
        closeLiderModal();
        loadLideres();
        alert('Líder creado exitosamente');
    } catch (error) {
        alert('Error al crear líder: ' + error.message);
    }
}

// Mark Vote
async function markVote(id) {
    if (!confirm('¿Confirma que esta persona ha votado?')) return;
    
    try {
        await apiRequest(`/personas/${id}/voto`, {
            method: 'PATCH'
        });
        
        loadDashboard();
        emitPersonaUpdate({ id, ha_votado: true });
        alert('Voto marcado exitosamente');
    } catch (error) {
        alert('Error al marcar voto: ' + error.message);
    }
}

// Delete Persona
async function deletePersona(id) {
    if (!confirm('¿Está seguro de eliminar este votante?')) return;
    
    try {
        await apiRequest(`/personas/${id}`, {
            method: 'DELETE'
        });
        
        loadDashboard();
        emitDashboardRefresh();
        alert('Votante eliminado exitosamente');
    } catch (error) {
        alert('Error al eliminar votante: ' + error.message);
    }
}

// Delete Contador
async function deleteContador(id) {
    if (!confirm('¿Está seguro de eliminar este contador?')) return;
    
    try {
        await apiRequest(`/admin/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        loadContadores();
        alert('Contador eliminado exitosamente');
    } catch (error) {
        alert('Error al eliminar contador: ' + error.message);
    }
}

// Delete Lider
async function deleteLider(id) {
    if (!confirm('¿Está seguro de eliminar este líder?')) return;
    
    try {
        // Note: Backend doesn't have this endpoint yet, but keeping for consistency
        alert('Función no implementada aún');
    } catch (error) {
        alert('Error al eliminar líder: ' + error.message);
    }
}

// Filter Personas
function filterPersonas() {
    const search = document.getElementById('searchPersonas').value.toLowerCase();
    const zona = document.getElementById('filterZona').value;
    const partido = document.getElementById('filterPartido').value;
    
    const filtered = personas.filter(p => {
        const matchSearch = !search || 
            p.nombre.toLowerCase().includes(search) || 
            (p.cedula && p.cedula.includes(search));
        const matchZona = !zona || p.zona === zona;
        const matchPartido = !partido || p.partido === partido;
        
        return matchSearch && matchZona && matchPartido;
    });
    
    // Render filtered results
    const tbody = document.getElementById('personasTableBody');
    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.cedula || '-'}</td>
            <td>${p.zona || '-'}</td>
            <td>${p.partido || '-'}</td>
            <td>${p.contador_nombre || 'Sin asignar'}</td>
            <td>
                <span class="badge ${p.ha_votado ? 'badge-success' : 'badge-danger'}">
                    ${p.ha_votado ? 'Sí' : 'No'}
                </span>
            </td>
            <td>
                ${!p.ha_votado ? `<button class="action-btn action-btn-vote" onclick="markVote(${p.id})">Marcar Voto</button>` : ''}
                <button class="action-btn action-btn-delete" onclick="deletePersona(${p.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// Import Excel
async function importExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.location.origin}/api/excel/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        const resultDiv = document.getElementById('importResult');
        if (data.success) {
            resultDiv.innerHTML = `
                <div class="success-message">
                    Importación completada<br>
                    Exitosos: ${data.data.success}<br>
                    Errores: ${data.data.errors.length}
                </div>
            `;
            loadDashboard();
            emitDashboardRefresh();
        } else {
            resultDiv.innerHTML = `<div class="error-message">${data.message}</div>`;
        }
    } catch (error) {
        alert('Error al importar Excel: ' + error.message);
    }
    
    e.target.value = '';
}

// Export Excel
async function exportExcel() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.location.origin}/api/excel/export`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `personas-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        alert('Error al exportar Excel: ' + error.message);
    }
}

// Reset Database
async function resetDatabase() {
    const conf1 = prompt('Digite "CONFIRMO" para continuar:');
    if (conf1 !== 'CONFIRMO') return;
    
    const conf2 = prompt('Digite "ELIMINAR" para continuar:');
    if (conf2 !== 'ELIMINAR') return;
    
    const conf3 = prompt('Digite "TODO" para confirmar:');
    if (conf3 !== 'TODO') return;
    
    try {
        await apiRequest('/admin/reset-db', {
            method: 'POST',
            body: JSON.stringify({
                confirmations: ['CONFIRMO', 'ELIMINAR', 'TODO']
            })
        });
        
        alert('Base de datos reiniciada exitosamente');
        loadDashboard();
        emitDashboardRefresh();
    } catch (error) {
        alert('Error al reiniciar la base de datos: ' + error.message);
    }
}

// Refresh Dashboard (called by socket events)
function refreshDashboard() {
    loadDashboard();
}

// Make functions global for onclick handlers
window.markVote = markVote;
window.deletePersona = deletePersona;
window.deleteContador = deleteContador;
window.deleteLider = deleteLider;
window.refreshDashboard = refreshDashboard;
