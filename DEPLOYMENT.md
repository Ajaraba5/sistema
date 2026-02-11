# Deployment Guide
# Sistema de Votación Enterprise v3.0.0

## Production Deployment

### 1. Pre-deployment Checklist

- [ ] Update `.env` with production values
- [ ] Change default admin password
- [ ] Set strong JWT secret
- [ ] Configure production database
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for specific origin
- [ ] Set up SSL/TLS certificate
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure monitoring/logging

### 2. Environment Variables

Create `.env` file with production values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=votacion_db
DB_USER=votacion_user
DB_PASSWORD=<strong-password>

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=<generate-strong-secret-key>
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

### 3. Database Setup

```bash
# Create production database
createdb votacion_db

# Create dedicated user
createuser -P votacion_user

# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE votacion_db TO votacion_user;"

# Run schema
psql -U votacion_user -d votacion_db -f backend/database/schema.sql

# Change admin password immediately!
psql -U votacion_user -d votacion_db
```

```sql
-- Generate new password hash (use bcryptjs)
-- Replace the hash below with your own generated hash
UPDATE users 
SET password = '$2a$10$YOUR_NEW_HASH_HERE' 
WHERE username = 'admin';
```

### 4. Application Deployment

#### Option A: Traditional Server (Ubuntu/Debian)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 13+
sudo apt-get install -y postgresql-13

# Create application directory
sudo mkdir -p /opt/votacion
sudo chown $USER:$USER /opt/votacion

# Clone repository
cd /opt/votacion
git clone <your-repo-url> .

# Install dependencies
cd backend
npm install --production

# Set up .env file
cp ../.env.example ../.env
nano ../.env  # Edit with production values

# Test the application
npm start
```

#### Option B: Using PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
cd /opt/votacion/backend
pm2 start server.js --name "votacion-api"

# Enable startup script
pm2 startup
pm2 save

# Monitor application
pm2 monit
pm2 logs votacion-api
```

#### Option C: Docker Deployment

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy application files
WORKDIR /app
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "backend/server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:13-alpine
    environment:
      POSTGRES_DB: votacion_db
      POSTGRES_USER: votacion_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: votacion_db
      DB_USER: votacion_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    depends_on:
      - db
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy with Docker:

```bash
docker-compose up -d
```

### 5. Nginx Reverse Proxy

Install and configure Nginx:

```bash
sudo apt-get install nginx
```

Create Nginx configuration `/etc/nginx/sites-available/votacion`:

```nginx
upstream votacion_app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy settings
    location / {
        proxy_pass http://votacion_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://votacion_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/votacion /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### 7. Database Backup

Create backup script `/opt/votacion/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/votacion/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/votacion_db_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U votacion_user votacion_db > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make executable and add to crontab:

```bash
chmod +x /opt/votacion/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /opt/votacion/backup.sh
```

### 8. Monitoring and Logging

#### Application Logs

```bash
# View PM2 logs
pm2 logs votacion-api

# Or with Docker
docker-compose logs -f app
```

#### System Monitoring

Install monitoring tools:

```bash
# Install htop for system monitoring
sudo apt-get install htop

# Check system resources
htop

# Check disk usage
df -h

# Check PostgreSQL status
sudo systemctl status postgresql
```

### 9. Security Hardening

```bash
# Enable firewall
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS

# Disable direct access to app port
sudo ufw deny 3000/tcp

# PostgreSQL: Only allow local connections
# Edit /etc/postgresql/13/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 10. Post-Deployment

- [ ] Test application accessibility
- [ ] Verify SSL certificate
- [ ] Test admin login
- [ ] Create initial contador accounts
- [ ] Import initial data (if needed)
- [ ] Test real-time features
- [ ] Set up monitoring alerts
- [ ] Document admin procedures
- [ ] Train users

### 11. Maintenance

#### Regular Tasks

- Weekly: Check application logs
- Weekly: Verify backups are running
- Monthly: Update dependencies (`npm audit fix`)
- Monthly: Review and clean audit logs
- Quarterly: Review security advisories
- Annually: Rotate JWT secret
- Annually: Review and update passwords

#### Update Application

```bash
cd /opt/votacion
git pull origin main
cd backend
npm install --production
pm2 restart votacion-api
```

### 12. Troubleshooting

#### Application won't start

```bash
# Check logs
pm2 logs votacion-api

# Check environment variables
pm2 env votacion-api

# Verify database connection
psql -U votacion_user -d votacion_db
```

#### Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection settings
cat /opt/votacion/.env

# Test connection
psql -h localhost -U votacion_user -d votacion_db
```

#### WebSocket not working

- Verify Nginx WebSocket configuration
- Check firewall rules
- Verify CORS settings in `.env`

### 13. Scaling Considerations

For high-traffic scenarios:

- Use PostgreSQL connection pooling (already implemented)
- Consider Redis for session storage
- Implement caching for dashboard statistics
- Use load balancer for multiple app instances
- Consider PostgreSQL read replicas
- Monitor and optimize database queries

### 14. Backup and Recovery

#### Restore from backup

```bash
# Decompress backup
gunzip votacion_db_YYYYMMDD_HHMMSS.sql.gz

# Drop existing database (CAUTION!)
dropdb votacion_db

# Create new database
createdb votacion_db

# Restore
psql -U votacion_user -d votacion_db < votacion_db_YYYYMMDD_HHMMSS.sql
```

## Support

For issues or questions, refer to the main README.md or create an issue in the repository.
