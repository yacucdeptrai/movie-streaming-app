# Báo Cáo Thiết Kế Hệ Thống Trang Web Xem Phim Trực Tuyến (Microservices)

## 1. Tổng Quan

Hệ thống trang web xem phim trực tuyến là một nền tảng phát trực tuyến video chất lượng cao, hỗ trợ hàng triệu người dùng toàn cầu với các tính năng như duyệt danh mục phim, quản lý hồ sơ, thanh toán, và watch party đồng bộ thời gian thực. Được xây dựng dựa trên kiến trúc **microservices**, hệ thống tích hợp các công nghệ tiên tiến như **Kong Gateway** (API Gateway), **Kafka** (xử lý sự kiện), **Chord** (tra cứu phân tán), **CloudFront** (CDN), và **tiến trình nhẹ (LWP)** cùng luồng đa nhiệm để tối ưu hiệu suất. Triển khai trên **AWS** với **Docker** và **Kubernetes**, hệ thống đảm bảo khả năng mở rộng, độ tin cậy 99.99%, và trải nghiệm người dùng mượt mà.

### 1.1 Mục Tiêu
- Cung cấp dịch vụ phát trực tuyến video đa nền tảng (web, mobile, TV) với độ trễ khởi tạo dưới 2 giây.
- Xử lý hàng tỷ yêu cầu mỗi ngày, hỗ trợ hàng triệu người dùng đồng thời.
- Bảo vệ dữ liệu người dùng, giao dịch, và nội dung bản quyền bằng các biện pháp bảo mật mạnh mẽ (DRM, JWT, OAuth 2.0).
- Hỗ trợ tính năng xã hội như watch party với đồng bộ thời gian thực.

### 1.2 Ứng Dụng và Lý Do Triển Khai
- **Ứng dụng**:
  - Phát trực tuyến phim và chương trình TV theo yêu cầu.
  - Quản lý đăng ký, thanh toán, và hồ sơ người dùng.
  - Tương tác cộng đồng qua watch party.
  - Quản lý nội dung và báo cáo doanh thu cho quản trị viên.
- **Lý do triển khai**:
  - **Khả năng mở rộng**: Microservices và Kubernetes đáp ứng tải lớn.
  - **Hiệu suất cao**: CloudFront và Chord giảm độ trễ phân phối nội dung.
  - **Độ tin cậy**: MongoDB Replica Set, AWS ELB, và Chord đảm bảo chịu lỗi.
  - **Bảo mật**: JWT, OAuth 2.0, và DRM bảo vệ hệ thống và nội dung.

### 1.3 Yêu Cầu Hệ Thống
#### Yêu Cầu Chức Năng
- **Người dùng**:
  - Đăng ký, xác thực, và quản lý nhiều hồ sơ với Single Sign-On (SSO).
  - Duyệt danh mục phim, tìm kiếm theo tiêu đề, thể loại, hoặc danh mục phổ biến.
  - Phát video ở các độ phân giải (480p, 720p, 1080p, 4K) với bitrate thích ứng (HLS/DASH).
  - Hỗ trợ phụ đề đa ngôn ngữ, nhiều bản âm thanh, và điều chỉnh chất lượng theo băng thông.
  - Lưu lịch sử xem, tiếp tục xem từ vị trí dừng.
  - Thanh toán gói đăng ký hoặc trả phí theo lượt xem qua Stripe/PayPal.
  - Nhận thông báo thời gian thực (phim mới, hết hạn đăng ký) qua WebSocket.
  - Tham gia watch party với đồng bộ thời gian thực.
- **Quản trị viên**:
  - Quản lý nội dung: Tải lên, chỉnh sửa, xóa phim, quản lý siêu dữ liệu.
  - Quản lý người dùng: Xem thông tin, khóa tài khoản, phân tích hành vi.
  - Tạo báo cáo doanh thu và quản lý thanh toán.

#### Yêu Cầu Phi Chức Năng
- **Khả năng mở rộng**: Hỗ trợ hàng triệu người dùng đồng thời.
- **Hiệu suất**: Độ trễ khởi tạo video dưới 2 giây, chuyển đổi bitrate mượt mà.
- **Độ tin cậy**: Đạt 99.99% thời gian hoạt động, chịu lỗi mạnh mẽ.
- **Bảo mật**: Bảo vệ dữ liệu, giao dịch, và nội dung bản quyền.
- **Khả năng toàn cầu**: Phân phối nội dung nhanh, độ trễ tối thiểu trên toàn cầu.

## 2. Kiến Trúc Hệ Thống

### 2.1 Kiến Trúc Tổng Quan
Hệ thống sử dụng kiến trúc **microservices**, kết hợp **kiến trúc hướng sự kiện** (Kafka) và **kiến trúc hướng dịch vụ** (gRPC, REST). Các thành phần chính bao gồm **Kong Gateway**, **microservices**, **CloudFront**, **Kafka**, **RabbitMQ**, và **Chord**, triển khai trên AWS với Docker và Kubernetes.

```
[Người dùng] --> [Internet]
                |
                v
[AWS ELB] --> [Kong Gateway]
                    |
                    v
[Microservices] <--> [Cơ sở dữ liệu] <--> [Redis/RabbitMQ/Chord]
       |                   |                   |
       v                   v                   v
[CloudFront] <---- [S3 Lưu trữ] <--> [Kafka]
       |
       v
[AWS MediaConvert]
```

### 2.2 Các Thành Phần Chi Tiết

#### 2.2.1 Giao Diện Người Dùng (Frontend)
- **Công nghệ**: React.js, Tailwind CSS, hỗ trợ web, mobile, TV.
- **Chi tiết**:
  - Ứng dụng một trang (SPA) với prefetching siêu dữ liệu phim để giảm thời gian chờ.
  - Trình phát video hỗ trợ HLS/DASH, tích hợp Widevine/FairPlay DRM.
  - WebSocket cho watch party và thông báo thời gian thực.
  - Tài nguyên tĩnh (hình ảnh, CSS, JS) lưu trên AWS S3, phân phối qua CloudFront.
- **Luồng**:
  - Luồng giao diện: React rendering.
  - Luồng xử lý: Gửi yêu cầu API/WebSocket.
- **Giao thức**: TCP (HTTP, WebSocket).
- **Định danh**:
  - UUID cho phiên người dùng (ví dụ: `123e4567-e89b-12d3-a456-426614174000`).
  - DNS phân giải `www.example.com`.
- **Lợi ích**:
  - Giao diện nhanh, đa nền tảng.
  - Tách biệt luồng che giấu độ trễ mạng.

#### 2.2.2 Kong Gateway (API Gateway)
- **Vai trò**:
  - Định tuyến yêu cầu từ frontend đến microservices.
  - Xác thực qua JWT và OAuth 2.0 (tích hợp Keycloak).
  - Giới hạn tỷ lệ (10 yêu cầu/giây, 1000 yêu cầu/giờ) với plugin Rate Limiting.
  - Giám sát với Prometheus, ghi log qua ELK Stack.
- **Giao thức**: HTTP/TCP.
- **Luồng**:
  - Thread-per-connection cho WebSocket.
  - Thread-per-request cho REST API.
- **Định danh**:
  - DNS phân giải `api.example.com`.
  - JWT chứa `user_id` (ví dụ: `{"user_id": "12345", "role": "user"}`).
- **Cấu hình**:
  - Chạy trên Kubernetes với nhiều instance.
  - Tích hợp Keycloak cho SSO.
- **Ví dụ cấu hình YAML**:
  ```yaml
  services:
    - name: user-service
      url: http://user-service/api
      routes:
        - name: user-route
          paths:
            - /api/auth
            - /api/users
          plugins:
            - name: jwt
              config:
                key_claim_name: iss
                secret_is_base64: false
            - name: rate-limiting
              config:
                second: 10
                hour: 1000
    - name: streaming-service
      url: http://streaming-service/api
      routes:
        - name: streaming-route
          paths:
            - /api/stream
          plugins:
            - name: jwt
            - name: cors
              config:
                origins: ["*"]
                methods: ["GET", "POST"]
  plugins:
    - name: prometheus
      config:
        metrics: ["http_requests_total", "latency"]
    - name: http-log
      config:
        http_endpoint: http://elk-stack/logs
  ```
- **Lợi ích**:
  - Quản lý API tập trung, bảo mật cao.
  - Dễ mở rộng với các plugin của Kong.

#### 2.2.3 Microservices
Mỗi microservice chạy trong container Docker, sử dụng **tiến trình nhẹ (LWP)** để tối ưu CPU, giao tiếp qua REST, gRPC, hoặc Kafka. Các dịch vụ chính:
- **Dịch vụ Người dùng**:
  - **Chức năng**: Quản lý đăng ký, đăng nhập, hồ sơ, tùy chọn (ngôn ngữ, chất lượng video).
  - **Công nghệ**: Node.js/Express (REST), gRPC.
  - **Cơ sở dữ liệu**: PostgreSQL (tài khoản), MongoDB (hồ sơ).
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP (REST, gRPC).
- **Dịch vụ Danh mục**:
  - **Chức năng**: Quản lý siêu dữ liệu phim, hỗ trợ tìm kiếm.
  - **Công nghệ**: Python/FastAPI (REST), gRPC.
  - **Cơ sở dữ liệu**: MongoDB, Elasticsearch.
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP.
- **Dịch vụ Phát trực tuyến**:
  - **Chức năng**: Quản lý phiên phát, tạo URL ký số, giám sát chất lượng.
  - **Công nghệ**: Go.
  - **Tích hợp**: CloudFront, Kafka, Chord.
  - **Luồng**: Thread-per-connection cho WebSocket/HLS.
  - **Giao thức**: UDP (HLS/DASH), TCP (REST/gRPC).
- **Dịch vụ Thanh toán**:
  - **Chức năng**: Xử lý thanh toán qua Stripe/PayPal.
  - **Công nghệ**: Node.js, gRPC.
  - **Cơ sở dữ liệu**: PostgreSQL.
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP.
- **Dịch vụ Quản lý Nội dung**:
  - **Chức năng**: Quản lý phim, siêu dữ liệu.
  - **Công nghệ**: Django.
  - **Cơ sở dữ liệu**: PostgreSQL.
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP.
- **Dịch vụ Xử lý Video**:
  - **Chức năng**: Mã hóa video (H.264, H.265), tạo HLS/DASH, áp dụng DRM.
  - **Công nghệ**: AWS Elemental MediaConvert.
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP.
- **Dịch vụ Thông báo**:
  - **Chức năng**: Gửi thông báo qua WebSocket và Kafka.
  - **Công nghệ**: Node.js.
  - **Luồng**: Thread-per-connection.
  - **Giao thức**: TCP (WebSocket).

#### 2.2.4 Cơ Sở Dữ Liệu
- **PostgreSQL**: Lưu tài khoản, giao dịch, siêu dữ liệu phim (phân vùng theo khu vực, UUID).
- **MongoDB**: Lưu hồ sơ người dùng, lịch sử xem (Replica Set, UUID).
- **Elasticsearch**: Tìm kiếm phim theo thuộc tính (ví dụ: `genre:action AND year>2020`).
- **Redis**: Quản lý phiên, siêu dữ liệu, hàng đợi (Redlock, Redis Queue, UUID).

#### 2.2.5 Lưu Trữ
- **AWS S3**: Lưu video, hình ảnh, phụ đề (UUID).
- **PostgreSQL**: Lưu siêu dữ liệu phim.

#### 2.2.6 CDN
- **Công nghệ**: AWS CloudFront.
- **Chi tiết**:
  - Prefetching video chunks, caching manifest files.
  - Sử dụng UDP cho streaming HLS/DASH.
  - Tra cứu UUID qua Chord đến URL edge location.
  - DNS phân giải `cdn.example.com`.

#### 2.2.7 Cân Bằng Tải
- **Công nghệ**: AWS Elastic Load Balancer (ELB).
- **Chi tiết**: Thuật toán least connections, health check giám sát microservices.

#### 2.2.8 Kafka
- **Vai trò**: Xử lý sự kiện theo mô hình Publish-Subscribe.
- **Topic**:
  - `user-events`: Ghi hành vi người dùng.
  - `streaming-logs`: Ghi log phiên phát.
  - `notifications`: Gửi thông báo.
- **Định danh**: UUID.

#### 2.2.9 RabbitMQ
- **Vai trò**: Message Queue cho xử lý bất đồng bộ (thanh toán, mã hóa video).
- **Giao thức**: AMQP (TCP).
- **Ví dụ cấu hình**:
  ```yaml
  queue:
    name: payment-queue
    durable: true
    exchange:
      name: payment-exchange
      type: direct
  ```

#### 2.2.10 Chord
- **Vai trò**: Tra cứu phân tán UUID (video, phiên watch party).
- **Cơ chế**:
  - Vòng tròn định danh từ \(0\) đến \(2^m-1\), sử dụng hàm băm SHA-1.
  - Finger Table: \(FT_p[i] = \text{succ}(p + 2^{i-1})\).
- **Ví dụ**:
  - Mạng 8 nút với ID: 0, 1, 4, 7, 9, 11, 12, 14.
  - UUID video "Movie A" (khóa 3) lưu tại nút ID 4.

### 2.3 Luồng Dữ Liệu
- **Phát video**:
  1. Frontend gửi yêu cầu qua HTTP/TCP, tra cứu DNS.
  2. Kong Gateway xác thực JWT, định tuyến (thread-per-connection/request).
  3. Redis kiểm tra phiên (UUID, Redlock).
  4. Dịch vụ Phát trực tuyến gọi gRPC, tra cứu UUID qua Chord, tạo URL ký số (UDP, HLS/DASH).
  5. CloudFront phát video, ghi log vào Kafka.
  6. MongoDB cập nhật lịch sử, thông báo qua WebSocket.
- **Thanh toán**:
  1. Frontend gửi yêu cầu REST.
  2. Kong Gateway định tuyến (thread-per-request).
  3. Dịch vụ Thanh toán xử lý qua RabbitMQ, Stripe/PayPal.
  4. PostgreSQL lưu giao dịch, Kafka ghi log, thông báo qua WebSocket.
- **Watch party**:
  1. Frontend kết nối WebSocket.
  2. Kong Gateway định tuyến (thread-per-connection).
  3. Dịch vụ Phát trực tuyến tra cứu UUID qua Chord, đồng bộ qua Kafka.

**Sơ đồ luồng (Dịch vụ Phát trực tuyến)**:
```
[Client] --> [Request] --> [Dispatcher Thread] --> [Worker Thread (Thread-per-connection)]
   |                          |                         |
   v                          v                         v
[UI Thread]            [Queue Requests]          [Handle WebSocket/HLS]
```

## 3. Trao Đổi Thông Tin

### 3.1 Giao Thức
- **TCP** (REST, WebSocket, gRPC):
  - **Ứng dụng**: Đăng nhập, thanh toán, watch party, giao tiếp nội bộ.
  - **Cấu trúc gói tin**:
    ```
    | Source Port | Destination Port |
    | Sequence Number                  |
    | Acknowledgment Number            |
    | Header Length | Flags | Window   |
    | Checksum      | Urgent Pointer   |
    | Options | Data                   |
    ```
  - **Lợi ích**: Đảm bảo độ tin cậy, dữ liệu đến đúng thứ tự.
- **UDP** (HLS/DASH):
  - **Ứng dụng**: Streaming video.
  - **Cấu trúc gói tin**:
    ```
    | Source Port | Destination Port |
    | Length      | Checksum         |
    | Data                             |
    ```
  - **Lợi ích**: Tốc độ cao, độ trễ thấp.

### 3.2 gRPC
- **Ứng dụng**: Giao tiếp nội bộ giữa microservices.
- **Công nghệ**: HTTP/2, Protocol Buffers.
- **Ví dụ**:
  ```proto
  service PaymentService {
    rpc VerifyPayment (PaymentRequest) returns (PaymentResponse);
  }
  message PaymentRequest {
    string user_id = 1;
    string plan_id = 2;
  }
  message PaymentResponse {
    bool success = 1;
    string subscription_id = 2;
  }
  ```
- **Lợi ích**: Hiệu suất cao, giảm độ trễ so với REST.

### 3.3 Mô Hình Thông Điệp
- **Publish-Subscribe (Kafka)**:
  - **Ứng dụng**: Ghi log, thông báo, xử lý sự kiện.
  - **Lợi ích**: Bền vững, hỗ trợ phân tích thời gian thực.
- **Message Queues (RabbitMQ)**:
  - **Ứng dụng**: Thanh toán, mã hóa video.
  - **Lợi ích**: Xử lý bất đồng bộ, đảm bảo thứ tự.

## 4. Tiến Trình và Luồng

### 4.1 Tiến Trình Nhẹ (LWP)
- **Cơ chế**:
  - Mỗi microservice là một tiến trình, sinh nhiều LWP.
  - Blocking call chỉ dừng một LWP, hỗ trợ đa CPU.
- **Ứng dụng**: Tối ưu tài nguyên CPU trên AWS EC2.

### 4.2 Luồng
- **Client**:
  - Tách biệt luồng giao diện (React) và xử lý API/WebSocket.
- **Server**:
  - Kong Gateway: Thread-per-connection (WebSocket), thread-per-request (REST).
  - Dịch vụ Phát trực tuyến/Thông báo: Thread-per-connection.
  - Dịch vụ Danh mục/Thanh toán: Thread-per-request.
- **Dispatcher**:
  - Nhận yêu cầu, xếp hàng đợi, chuyển đến worker threads.
- **Lợi ích**:
  - Thread-per-connection hỗ trợ kết nối bền vững (WebSocket, HLS).
  - Thread-per-request tối ưu yêu cầu ngắn (REST API).

## 5. Định Danh và Không Gian Tên

### 5.1 UUID
- **Ứng dụng**: Định danh người dùng, video, giao dịch, phiên.
- **Ví dụ**: `123e4567-e89b-12d3-a456-426614174000` (v4, ngẫu nhiên).
- **Lợi ích**: Duy nhất, ngăn xung đột trong hệ thống phân tán.

### 5.2 Chord
- **Ứng dụng**: Tra cứu phân tán UUID (video, phiên watch party).
- **Cơ chế**: Vòng tròn định danh, Finger Table, tra cứu \(O(\log N)\).
- **Lợi ích**: Phân tán, chịu lỗi, hiệu quả.

### 5.3 DNS
- **Ứng dụng**: Phân giải `www.example.com`, `api.example.com`, `cdn.example.com`.
- **Lợi ích**: Caching giảm độ trễ, tích hợp AWS Route 53.

### 5.4 Elasticsearch
- **Ứng dụng**: Tìm kiếm theo thuộc tính (ví dụ: `genre:action AND year>2020`).
- **Lợi ích**: Linh hoạt, nhanh chóng.

## 6. Đồng Bộ Hóa

### 6.1 Distributed Locking
- **Công cụ**: Redis Redlock.
- **Ứng dụng**: Khóa tài nguyên khi cập nhật lịch sử xem hoặc giao dịch.
- **Cơ chế**: Khóa với TTL 5 giây, tránh deadlock.

### 6.2 Message Queues
- **Công cụ**: Kafka, RabbitMQ.
- **Ứng dụng**: Kafka đồng bộ watch party, RabbitMQ xử lý thanh toán.

### 6.3 CQRS
- **Ứng dụng**:
  - Command: Cập nhật trạng thái watch party.
  - Query: Truy vấn lịch sử xem.
- **Cơ chế**: Command ghi vào Kafka, Query đọc từ MongoDB/Elasticsearch.

### 6.4 Event Sourcing
- **Ứng dụng**: Lưu trạng thái watch party (play, pause) trong Kafka.
- **Cơ chế**: Tái tạo trạng thái từ lịch sử sự kiện.

### 6.5 Optimistic Locking
- **Ứng dụng**: Cập nhật lịch sử xem, giao dịch.
- **Cơ chế**: Kiểm tra trường `version` trước khi ghi.

**Sơ đồ đồng bộ hóa (Watch Party)**:
```
[Client] --> [WebSocket] --> [Kafka Topic: streaming-logs]
   |                          |
   v                          v
[Command: Play/Pause]   [Event Sourcing: Replay]
   |                          |
   v                          v
[MongoDB: Optimistic Lock] [Reconstruct State]
```

## 7. Sao Lưu

### 7.1 Database Backup
- **Công cụ**: pg_dump (PostgreSQL), mongodump (MongoDB).
- **Ứng dụng**: Sao lưu tài khoản, giao dịch, lịch sử xem.
- **Cơ chế**: Lưu snapshot vào AWS S3 hàng ngày.

### 7.2 Incremental Backup
- **Công cụ**: rsync, AWS Backup.
- **Ứng dụng**: Sao lưu video, log trên S3.
- **Cơ chế**: Đồng bộ thay đổi hàng giờ.

### 7.3 Cloud Storage
- **Công cụ**: AWS S3, Glacier.
- **Ứng dụng**: Lưu bản sao lưu, chuyển bản cũ sang Glacier.

### 7.4 Data Replication
- **Công cụ**: MongoDB Replica Set, PostgreSQL Streaming Replication.
- **Ứng dụng**: Sao chép thời gian thực, failover tự động.

### 7.5 Automated Backup
- **Công cụ**: Cron Jobs, AWS Lambda.
- **Ví dụ**:
  ```bash
  0 2 * * * pg_dump -U postgres dbname | aws s3 cp - s3://backup-bucket/db-$(date +%Y%m%d).sql
  ```

**Sơ đồ sao lưu**:
```
[PostgreSQL] --> [pg_dump] --> [AWS S3]
[MongoDB] --> [mongodump] --> [AWS S3]
[S3 Video] --> [rsync/AWS Backup] --> [S3/Glacier]
[Cron Jobs/Lambda] --> [Automate Schedule]
```

## 8. Tính Chịu Lỗi
- **MongoDB Replica Set**: Failover tự động.
- **Hystrix**: Circuit Breaking cho lỗi dịch vụ.
- **Prometheus/Grafana**: Giám sát hiệu suất.
- **ELK Stack**: Quản lý log.
- **AWS ELB**: Cân bằng tải, health check.
- **Kubernetes**: Auto-scaling, rolling updates.
- **Chord**: Tự định tuyến lại khi nút thất bại.
- **LWP**: Giới hạn tác động của blocking calls.

## 9. Khả Năng Mở Rộng
- **Auto-scaling**: Kubernetes điều chỉnh tài nguyên dựa trên tải.
- **Phân vùng dữ liệu**: PostgreSQL, MongoDB, Kafka, Chord.
- **Hàng đợi**: Redis Queue, RabbitMQ.
- **CDN**: CloudFront giảm độ trễ toàn cầu.
- **Luồng**: LWP, thread-per-connection/request.

## 10. Bảo Mật
- **Xác thực**: JWT, OAuth 2.0, Keycloak.
- **Mã hóa**: HTTPS, AES-256, Widevine/FairPlay DRM.
- **Thanh toán**: Stripe/PayPal (PCI-DSS).
- **Chống tấn công**: Rate Limiting, WAF.

## 11. Triển Khai
- **Container hóa**: Docker.
- **Điều phối**: Kubernetes.
- **CI/CD**: GitHub Actions.
- **Đám mây**: AWS (EC2, S3, CloudFront, MediaConvert, Route 53).

## 12. API Endpoints
- `POST /api/auth/login`: Trả JWT.
- `GET /api/catalog/movies?region={region}`: Lấy danh mục phim.
- `GET /api/stream/{movie_id}`: Trả URL ký số.
- `POST /api/payment/subscribe`: Xử lý thanh toán.
- `POST /api/notifications`: Gửi thông báo.
- `WS /api/watch-party/{session_id}`: WebSocket cho watch party.

## 13. Thách Thức và Giải Pháp
- **Độ trễ streaming**:
  - Giải pháp: UDP, CloudFront, Chord, thread-per-connection.
- **Tải cao**:
  - Giải pháp: Kubernetes, RabbitMQ, LWP.
- **Đồng bộ watch party**:
  - Giải pháp: WebSocket, Kafka, CQRS, Event Sourcing.
- **Bản quyền**:
  - Giải pháp: DRM, URL ký số.
- **Xung đột dữ liệu**:
  - Giải pháp: Redlock, Optimistic Locking.
- **Mất dữ liệu**:
  - Giải pháp: pg_dump, mongodump, rsync, AWS Backup.

## 14. Kế Hoạch Phát Triển
- Tối ưu streaming với QUIC.
- Triển khai Chord đầy đủ cho CDN/watch party.
- Tích hợp Redis Pub/Sub cho thông báo nhỏ.
- Hỗ trợ đa ngôn ngữ cho phụ đề/giao diện.
- Thêm phương thức thanh toán địa phương (ví dụ: Momo).

## 15. Kết Luận
Hệ thống trang web xem phim trực tuyến là một nền tảng microservices mạnh mẽ, tích hợp **Kong Gateway**, **Kafka**, **RabbitMQ**, **CloudFront**, và **Chord** để cung cấp dịch vụ phát trực tuyến toàn cầu. **Tiến trình nhẹ (LWP)** và **thread-per-connection/request** tối ưu hiệu suất, đặc biệt cho WebSocket và HLS. **Đồng bộ hóa** với Redlock, CQRS, Event Sourcing, và Optimistic Locking đảm bảo nhất quán dữ liệu. **Sao lưu** với pg_dump, rsync, và AWS Backup bảo vệ dữ liệu hiệu quả. Triển khai trên AWS với Docker và Kubernetes, hệ thống đạt độ tin cậy 99.99%, khả năng mở rộng cao, và trải nghiệm người dùng mượt mà.