# Setup Guide

## Prerequisites
- **Node.js**: v18+ (https://nodejs.org)
- **Java**: 17+ (https://adoptium.net)
- **Python**: 3.9+ (https://www.python.org)
- **Docker & Docker Compose**: Latest (https://www.docker.com)
- **Kubernetes (Minikube)**: Latest (https://minikube.sigs.k8s.io)
- **Git**: Latest (https://git-scm.com)
- **PostgreSQL Client** (optional): Latest (https://www.postgresql.org)
- **MongoDB Client** (optional): Latest (https://www.mongodb.com)
- **FFmpeg**: Latest (https://ffmpeg.org)
- **IDE**: VS Code, IntelliJ IDEA, or PyCharm

## Installation Steps
1. Install Node.js: `node --version`
2. Install Java: `java --version`
3. Install Python: `python --version`
4. Install Docker: `docker --version`
5. Install Docker Compose: `docker-compose --version`
6. Install Minikube: `minikube version`
7. Install Git: `git --version`
8. Install PostgreSQL Client (optional): `psql --version`
9. Install MongoDB Client (optional): `mongosh --version`
10. Install FFmpeg: `ffmpeg -version`
11. Install IDE of choice.

## Notes
- Database and Kafka services (PostgreSQL 17, MongoDB latest, Elasticsearch 8.17.5, Apache Kafka latest) are provided via Docker Compose.
- Kafka uses KRaft mode, eliminating the need for Zookeeper.