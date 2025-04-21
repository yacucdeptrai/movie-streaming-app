# Project Requirements

## Overview
A microservices-based web application for streaming movies, featuring user management, movie metadata, video streaming, search, reviews, recommendations, and event-driven communication.

## Functional Requirements

### User Service
- User registration and login with JWT authentication.
- Profile management (update username, email, password).
- Role-based access (user, admin).

### Content Service
- Manage movie metadata (title, description, genre, release date).
- Support CRUD operations for movies.
- Store metadata in PostgreSQL 17.

### Streaming Service
- Stream videos using FFmpeg and CDN (e.g., Cloudflare Stream).
- Support multiple resolutions (480p, 720p, 1080p).
- Store video files in cloud storage (e.g., AWS S3).

### Search Service
- Search movies by title, genre, or release date.
- Use Elasticsearch 8.17.5 for full-text search.
- Support pagination and filtering.

### Review Service
- Allow users to rate and comment on movies.
- Store reviews in MongoDB latest.
- Support CRUD operations for reviews.

### Recommendation Service
- Provide personalized movie recommendations using machine learning (e.g., collaborative filtering).
- Built with Python and libraries like TensorFlow or Scikit-learn.
- Use user ratings and viewing history as input.

### Event Bus
- Enable asynchronous communication between services (e.g., user registration triggers recommendation update).
- Use Apache Kafka latest with KRaft mode.

### Frontend
- Web interface built with React.
- Features: homepage, movie details, user profile, search, reviews.
- Responsive design for desktop and mobile.

## Non-Functional Requirements
- **Performance**: Handle 1,000 concurrent users with < 1s API response time.
- **Scalability**: Horizontal scaling with Kubernetes.
- **Security**: JWT for authentication, HTTPS for all APIs.
- **Reliability**: 99.9% uptime, automated backups for databases.

## Technologies
- **Backend**: Spring Boot (Java), Node.js, Python.
- **Frontend**: React.
- **Database**: PostgreSQL 17 (port 5433), MongoDB latest (port 27018), Elasticsearch 8.17.5 (port 9201).
- **Message Broker**: Apache Kafka latest (port 9092, KRaft mode).
- **Infrastructure**: Docker, Kubernetes, GitHub Actions.
- **Monitoring**: Prometheus, Grafana.
- **Logging**: ELK Stack.