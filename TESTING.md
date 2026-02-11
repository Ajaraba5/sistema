# Manual Testing Guide
# Sistema de Votación Enterprise v3.0.0

## Pre-requisites
- PostgreSQL 13+ installed and running
- Node.js 18+ installed
- Database created and schema loaded

## 1. Setup Test

### Database Setup
```bash
# Create database
createdb votacion_db

# Load schema
psql -U postgres -d votacion_db -f backend/database/schema.sql

# Verify tables created
psql -U postgres -d votacion_db -c "\dt"
```

Expected output: Should show 4 tables (users, personas, lideres, audit_log)

### Environment Setup
```bash
# Copy env file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### Install Dependencies
```bash
cd backend
npm install
```

## 2. Backend API Tests

### Start Server
```bash
cd backend
npm start
```

Expected output:
```
✓ Connected to PostgreSQL database
Sistema de Votación Enterprise v3.0.0
Server running on port 3000
```

### Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Expected: `{"success":true,"message":"Sistema de Votación API v3.0.0","timestamp":"..."}`

### Test Authentication

#### Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: Should return token and user data with role='admin'

Save the token for subsequent tests:
```bash
TOKEN="<paste-token-here>"
```

### Test Admin Endpoints

#### Get Dashboard
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/dashboard
```

Expected: Dashboard statistics with personas, contadores, and lideres data

#### Create Contador
```bash
curl -X POST http://localhost:3000/api/admin/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username":"contador1",
    "password":"contador123",
    "nombre":"Contador de Prueba",
    "email":"contador1@test.com"
  }'
```

Expected: Success message with new contador data

#### Create Persona
```bash
curl -X POST http://localhost:3000/api/personas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre":"Juan Pérez",
    "cedula":"12345678",
    "telefono":"555-1234",
    "zona":"Zona Norte",
    "partido":"Partido A"
  }'
```

Expected: Success message with new persona data

#### Mark Vote
```bash
# Replace {id} with the persona ID from previous step
curl -X PATCH http://localhost:3000/api/personas/{id}/voto \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Success message with updated persona showing ha_votado=true

### Test Contador Login

#### Login as Contador
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"contador1","password":"contador123"}'
```

Expected: Token with role='contador'

```bash
CONTADOR_TOKEN="<paste-contador-token-here>"
```

#### Get Contador Dashboard
```bash
curl -H "Authorization: Bearer $CONTADOR_TOKEN" \
  http://localhost:3000/api/contador/dashboard
```

Expected: Contador's personal statistics and assigned personas

### Test Role-Based Access Control

#### Try to access admin endpoint as contador (should fail)
```bash
curl -H "Authorization: Bearer $CONTADOR_TOKEN" \
  http://localhost:3000/api/admin/dashboard
```

Expected: 403 Forbidden error

## 3. Frontend Tests

### Open in Browser
1. Navigate to `http://localhost:3000`
2. Should see login page

### Test Admin Login
1. Username: `admin`
2. Password: `admin123`
3. Click "Iniciar Sesión"
4. Should redirect to admin dashboard

### Test Admin Dashboard
1. Verify statistics cards show correct numbers
2. Check charts are rendering (Zona and Partido charts)
3. Navigate through tabs: Votantes, Contadores, Líderes, Excel, Configuración

### Test Persona Management
1. Click "Agregar Votante"
2. Fill in the form:
   - Nombre: "Test Voter"
   - Cédula: "87654321"
   - Zona: "Zona Sur"
   - Partido: "Partido B"
3. Click "Guardar"
4. Verify new person appears in table

### Test Vote Marking
1. Find a persona that hasn't voted
2. Click "Marcar Voto" button
3. Confirm action
4. Verify badge changes to "Sí" (voted)
5. Check statistics update in real-time

### Test Contador Creation
1. Go to "Contadores" tab
2. Click "Agregar Contador"
3. Fill form:
   - Nombre: "Test Counter"
   - Usuario: "test_counter"
   - Contraseña: "test123"
4. Click "Guardar"
5. Verify new contador appears in table

### Test Excel Export
1. Go to "Excel" tab
2. Click "Descargar Excel"
3. Verify .xlsx file downloads
4. Open file and verify data is correct

### Test Contador Panel
1. Logout from admin
2. Login with contador credentials (username: contador1, password: contador123)
3. Should see contador dashboard
4. Verify assigned personas list
5. Test search functionality
6. Test filter buttons (Todos, Han Votado, Pendientes)
7. Mark a vote
8. Verify progress bar updates

## 4. WebSocket Tests

### Test Real-time Updates
1. Open admin dashboard in browser 1
2. Open contador panel in browser 2
3. Mark a vote in browser 2
4. Verify statistics update automatically in browser 1 (without refresh)

## 5. Security Tests

### Test Invalid Token
```bash
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3000/api/admin/dashboard
```

Expected: 401 Unauthorized

### Test No Token
```bash
curl http://localhost:3000/api/admin/dashboard
```

Expected: 401 Unauthorized

### Test SQL Injection Prevention
```bash
curl -X POST http://localhost:3000/api/personas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre":"Test'; DROP TABLE personas; --",
    "cedula":"123"
  }'
```

Expected: Should create persona with the literal string (not execute SQL)

## 6. Database Reset Test

### Test Database Reset (Admin Only)
1. Login as admin
2. Go to "Configuración" tab
3. Click "Reiniciar Base de Datos"
4. Follow three confirmation prompts:
   - Type: CONFIRMO
   - Type: ELIMINAR
   - Type: TODO
5. Verify database is reset (all data except admin user removed)

## Test Results Checklist

- [ ] Server starts successfully
- [ ] Database connection works
- [ ] Admin login works
- [ ] Contador login works
- [ ] Role-based access control works
- [ ] Persona CRUD operations work
- [ ] Vote marking works
- [ ] Contador management works
- [ ] Lider management works
- [ ] Excel export works
- [ ] Excel import works
- [ ] Real-time updates work (WebSocket)
- [ ] Charts render correctly
- [ ] Search and filters work
- [ ] Database reset works
- [ ] Security headers present (Helmet)
- [ ] Rate limiting works
- [ ] Invalid authentication rejected

## Known Issues

### XLSX Security Warning
- The xlsx library has known vulnerabilities for prototype pollution
- This is acceptable for internal use
- For production, consider implementing file validation and sanitization

### Multer Deprecation
- Updated to multer 2.0.0-rc.4
- Fully compatible with current implementation

## Performance Notes

- Test with at least 100 personas to verify pagination needs
- Monitor database connection pool usage
- Check WebSocket connection limits
- Test concurrent user scenarios
