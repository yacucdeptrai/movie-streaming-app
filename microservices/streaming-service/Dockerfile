FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o streaming-service

FROM alpine:latest
RUN apk --no-cache add ca-certificates curl
WORKDIR /root/
COPY --from=builder /app/streaming-service .
HEALTHCHECK --interval=30s --timeout=3s CMD curl --fail http://localhost:8002/api/stream/test || exit 1
CMD ["./streaming-service"]