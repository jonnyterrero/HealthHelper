# Health Helper Enhanced - Deployment Guide
# =========================================
# Complete deployment guide for the Health AI System

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone and Setup
```bash
# Navigate to the Health Helper Enhanced folder
cd "Health Helper Enhanced"

# Make scripts executable
chmod +x *.sh
```

### 2. Development Setup
```bash
# Install dependencies
npm install
pip install -r Configuration/requirements.txt

# Initialize database
python -c "from src.lib.unified_health_ai import init_db; init_db()"

# Start development servers
npm run dev &  # Frontend on :3000
python -m uvicorn src.lib.api_server:app --reload --port 8000  # API on :8000
```

### 3. Production Deployment
```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

## 📁 Project Structure

```
Health Helper Enhanced/
├── Core System/           # Database schema & ML models
├── Frontend/              # Next.js integration
├── AI Features/           # Sleep, stress, nutrition AI
├── Deployment/            # Docker & production config
├── Configuration/         # Docker files & requirements
└── Documentation/         # This guide
```

## 🔧 Configuration

### Environment Variables
```env
# Next.js App
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
NODE_ENV=development

# AI API
DATABASE_URL=sqlite:///data/unified_health.db
PYTHONPATH=/app

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Database Options
- **SQLite**: Development (default)
- **PostgreSQL**: Production

## 🐳 Docker Services

### Services Overview
- **health-helper**: Next.js frontend (port 3000)
- **ai-api**: Python FastAPI backend (port 8000)
- **redis**: Caching layer (port 6379)
- **postgres**: Database (port 5432)

### Service Dependencies
```
health-helper → ai-api → postgres
                ↓
              redis
```

## 📊 Monitoring

### Health Checks
```bash
# Check all services
./health_check.sh

# Check specific service
curl http://localhost:8000/health
curl http://localhost:3000
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai-api
docker-compose logs -f health-helper
```

## 🔒 Security

### Production Security
- Use environment variables for secrets
- Enable HTTPS with SSL certificates
- Configure firewall rules
- Regular security updates

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups
- Access control

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale API instances
docker-compose up -d --scale ai-api=3

# Scale frontend instances
docker-compose up -d --scale health-helper=2
```

### Load Balancing
- Use nginx for load balancing
- Configure upstream servers
- Health checks for backends

## 💾 Backup & Restore

### Backup
```bash
# Create backup
./backup.sh

# Backup includes:
# - Database dump
# - Model files
# - User data
```

### Restore
```bash
# Restore from backup
./restore.sh /path/to/backup.tar.gz
```

## 🔄 Updates

### Rolling Updates
```bash
# Update services
docker-compose pull
docker-compose up -d

# Update specific service
docker-compose up -d --no-deps ai-api
```

### Database Migrations
```bash
# Run migrations
docker-compose exec ai-api python -c "
from src.lib.unified_health_ai import init_db
init_db()
"
```

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Change ports in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres psql -U health_user -d health_ai -c "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Model Loading Issues
```bash
# Check model files
ls -la models/

# Retrain models
docker-compose exec ai-api python -c "
from src.lib.ml_models import HealthModelTrainer
trainer = HealthModelTrainer()
trainer.train_trigger_classifiers('user_001')
"
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=1
docker-compose up -d

# View detailed logs
docker-compose logs -f --tail=100
```

## 📚 API Documentation

### Endpoints
- **Health Check**: `GET /health`
- **API Docs**: `GET /docs`
- **Data Ingestion**: `POST /api/*`
- **Predictions**: `GET /api/predictions/*`
- **Analytics**: `GET /api/analytics/*`

### Authentication
- JWT tokens for user authentication
- API keys for service authentication
- Rate limiting for API endpoints

## 🌐 Production Deployment

### Domain Setup
1. Configure DNS records
2. Set up SSL certificates
3. Configure nginx reverse proxy
4. Set up monitoring

### Performance Optimization
- Enable gzip compression
- Configure caching headers
- Optimize database queries
- Use CDN for static assets

### Monitoring Setup
- Prometheus for metrics
- Grafana for dashboards
- Alerting for issues
- Log aggregation

## 🔧 Maintenance

### Regular Tasks
- Database backups
- Model retraining
- Security updates
- Performance monitoring

### Updates
- Check for updates weekly
- Test in staging environment
- Deploy during maintenance windows
- Monitor after deployment

## 📞 Support

### Getting Help
- Check logs first
- Review documentation
- Test in development
- Contact support team

### Common Commands
```bash
# Restart services
docker-compose restart

# Rebuild services
docker-compose up -d --build

# Clean up
docker-compose down -v
docker system prune -a
```

---

**Health Helper Enhanced** - Your comprehensive AI-powered health tracking solution! 🏥🤖
