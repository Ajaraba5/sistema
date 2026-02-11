// Socket.IO Client Setup
let socket;

function initSocket() {
    if (typeof io === 'undefined') {
        console.warn('Socket.IO not loaded');
        return;
    }
    
    socket = io(window.location.origin);
    
    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });
    
    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
    
    socket.on('vote-updated', (data) => {
        console.log('Vote update received:', data);
        // Trigger dashboard refresh
        if (typeof refreshDashboard === 'function') {
            refreshDashboard();
        }
    });
    
    socket.on('persona-updated', (data) => {
        console.log('Persona update received:', data);
        if (typeof refreshDashboard === 'function') {
            refreshDashboard();
        }
    });
    
    socket.on('dashboard-updated', () => {
        console.log('Dashboard update received');
        if (typeof refreshDashboard === 'function') {
            refreshDashboard();
        }
    });
}

function emitVoteUpdate(data) {
    if (socket && socket.connected) {
        socket.emit('vote-update', data);
    }
}

function emitPersonaUpdate(data) {
    if (socket && socket.connected) {
        socket.emit('persona-update', data);
    }
}

function emitDashboardRefresh() {
    if (socket && socket.connected) {
        socket.emit('dashboard-refresh');
    }
}

// Initialize socket when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSocket);
} else {
    initSocket();
}

window.socketModule = {
    emitVoteUpdate,
    emitPersonaUpdate,
    emitDashboardRefresh
};
