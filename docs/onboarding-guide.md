# Onboarding Guide

## Introduction

This guide helps new team members set up the development environment for the Movie Streaming App, a microservices-based web application.

## Prerequisites

- **Node.js**: v18+ (https://nodejs.org)
- **Java**: 17+ (https://adoptium.net)
- **Python**: 3.9+ (https://www.python.org)
- **Docker & Docker Compose**: Latest (https://www.docker.com)
- **Git**: Latest (https://git-scm.com)
- **IDE**: VS Code, IntelliJ IDEA, or PyCharm
- **Optional Clients**: PostgreSQL (`psql`), MongoDB (`mongosh`)

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repo-url>
cd movie-streaming-app
```

### 2. Install Dependencies

- Ensure all prerequisites are installed (see `docs/setup-guide.md`).

- Verify versions:

  ```bash
  node --version
  java --version
  python --version
  docker --version
  docker-compose --version
  ```

### 3. Run Local Environment

- Navigate to `backend/infrastructure`.

- Start services (PostgreSQL 17, MongoDB latest, Elasticsearch 8.17.5, Apache Kafka latest):

  ```bash
  cd backend/infrastructure
  docker-compose up -d
  ```

### 4. Verify Services (Optional)

- **PostgreSQL**: Connect to port 5433.

  ```bash
  psql -h localhost -p 5433 -U user -d content_db
  ```

  Password: `password`

- **MongoDB**: Connect to port 27018.

  ```bash
  mongosh localhost:27018
  ```

- **Elasticsearch**: Check port 9201.

  ```bash
  curl http://localhost:9201
  ```

- **Kafka**: Verify broker on port 9092.

  ```bash
  docker logs kafka
  ```

  Create a test topic:

  ```bash
  docker exec -it kafka kafka-topics --create --topic test --bootstrap-server localhost:9092
  ```

### 5. Configure Secrets

- Copy the `.env` template from each service (e.g., `backend/user-service/config/.env`).
- Update with local settings (e.g., DB_HOST=localhost, DB_PORT=5433).

### 6. Explore the Project

- Read `docs/requirements.md` for project scope.
- Check `README.md` in each service folder for specific instructions.
- Review `docs/architecture-diagrams` for system overview.

## Next Steps

- Start developing the User Service (see `backend/user-service/README.md`).
- Set up the API Gateway for routing (see `backend/api-gateway/README.md`).
- Contribute to documentation or code as assigned by the team lead.