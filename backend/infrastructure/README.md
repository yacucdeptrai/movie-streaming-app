# Backend Infrastructure

## Setup Instructions
1. Ensure Docker and Docker Compose are installed.
2. Run `docker-compose up -d` to start PostgreSQL 17, MongoDB latest, Elasticsearch 8.17.5, and Apache Kafka latest.
3. Verify services:
   - PostgreSQL: `psql -h localhost -p 5433 -U user -d content_db`
   - MongoDB: `mongosh localhost:27018`
   - Elasticsearch: `curl http://localhost:9201`
   - Kafka: Check container logs (`docker logs kafka`).
4. Configure secrets in each service's `.env` file (e.g., `user-service/config/.env`).

## Notes
- Kafka uses KRaft mode, no Zookeeper required.
- Port mappings: PostgreSQL (5433), MongoDB (27018), Elasticsearch (9201).