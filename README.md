# Thiết Kế Hệ Thống Trang Web Xem Phim Trực Tuyến (Microservices - Bổ Sung)

## 1. Tổng Quan
Trang web xem phim trực tuyến cho phép người dùng phát trực tuyến phim và chương trình TV, duyệt danh mục, quản lý hồ sơ cá nhân, và thanh toán cho các gói đăng ký hoặc thuê phim. Hệ thống sử dụng kiến trúc microservices, với **Kong Gateway** làm API Gateway, tích hợp các chiến lược từ Netflix (xử lý video, phân phối CDN), và bổ sung các kỹ thuật từ slide bán vé (UUID, Redis Redlock, MongoDB Replica Set) để tăng độ tin cậy, hiệu suất, và khả năng mở rộng.

## 2. Yêu Cầu Chức Năng
- **Tính năng cho người dùng**:
  - Đăng ký, xác thực, và quản lý nhiều hồ sơ trong một tài khoản (hỗ trợ Single Sign-On).
  - Duyệt và tìm kiếm phim theo thể loại, tiêu đề, hoặc danh mục phổ biến.
  - Phát video ở nhiều độ phân giải (480p, 720p, 1080p, 4K) với bitrate thích ứng (HLS/DASH).
  - Hỗ trợ phụ đề, nhiều bản âm thanh, và điều chỉnh chất lượng video theo băng thông.
  - Lịch sử xem và tiếp tục xem từ vị trí dừng trước đó.
  - Gói đăng ký hoặc trả phí theo lượt xem, tích hợp thanh toán qua ví điện tử.
  - Thông báo thời gian thực khi có phim mới hoặc hết hạn đăng ký.
  - Watch party (xem cùng bạn bè) với đồng bộ thời gian thực qua WebSocket.
- **Tính năng cho quản trị viên**:
  - Quản lý nội dung: Tải lên, chỉnh sửa, xóa phim, và quản lý siêu dữ liệu.
  - Quản lý người dùng và báo cáo doanh thu.
  - Quản lý thanh toán và đăng ký.

## 3. Yêu Cầu Phi Chức Năng
- **Khả năng mở rộng**: Hỗ trợ hàng triệu người dùng đồng thời và hàng tỷ yêu cầu mỗi ngày.
- **Hiệu suất**: Độ trễ khởi tạo video dưới 2 giây, chuyển đổi bitrate mượt mà.
- **Độ tin cậy**: Đảm bảo 99.99% thời gian hoạt động, chịu lỗi tốt.
- **Bảo mật**: Bảo vệ dữ liệu người dùng, giao dịch thanh toán, và nội dung bản quyền (DRM).
- **Khả năng toàn cầu**: Phân phối nội dung ở nhiều khu vực với độ trễ tối thiểu.

## 4. Kiến Trúc Hệ Thống

### 4.1 Kiến Trúc Tổng Quan
Hệ thống sử dụng kiến trúc microservices, triển khai trên AWS, với **Kong Gateway** điều phối API và **Kafka** xử lý sự kiện thời gian thực. Các dịch vụ được container hóa bằng Docker và điều phối bởi Kubernetes.

```
[Người dùng] --> [Internet]
                |
                v
[Load Balancer] --> [Kong Gateway]
                         |
                         v
[Microservices] <--> [Cơ sở dữ liệu] <--> [Redis]
       |                   |                   |
       v                   v                   v
[CDN] <------------ [Lưu trữ] <--> [Kafka]
       |
       v
[Xử lý Video]
```

### 4.2 Các Thành Phần

#### 4.2.1 Giao diện người dùng (Frontend)
- **Công nghệ**: React.js, Tailwind CSS, hỗ trợ web, mobile, TV.
- Ứng dụng một trang (SPA) với prefetching nội dung.
- Trình phát video sử dụng HLS/DASH, tích hợp Widevine DRM.
- Hỗ trợ WebSocket cho watch party và thông báo.
- Lưu trữ trên AWS S3, phân phối qua CloudFront.
- **Lợi ích**: Giao diện đáp ứng nhanh, hỗ trợ đa nền tảng, trải nghiệm mượt mà.

#### 4.2.2 Kong Gateway (API Gateway)
- **Vai trò**:
  - Định tuyến yêu cầu đến microservices.
  - Xác thực qua plugin **JWT Authentication** và **OAuth 2.0** (tích hợp Keycloak).
  - Giới hạn tỷ lệ với plugin **Rate Limiting** (10 yêu cầu/giây, 1000 yêu cầu/giờ).
  - Giám sát với plugin **Prometheus**, ghi log qua **HTTP Log**.
- **Cấu hình**: Chạy trên Kubernetes, tích hợp Keycloak cho SSO.
- **Lợi ích**: Quản lý API tập trung, bảo mật cao, dễ mở rộng.

#### 4.2.3 Microservices
Mỗi dịch vụ độc lập, giao tiếp qua REST hoặc Kafka.
- **Dịch vụ Người dùng**:
  - Quản lý xác thực, hồ sơ, và tùy chọn.
  - Công nghệ: Node.js/Express.
  - Cơ sở dữ liệu: PostgreSQL (tài khoản), MongoDB (hồ sơ).
  - Sử dụng **JWT** để xác thực:
    - Ví dụ: `{"user_id": "12345", "role": "user", "exp": 1700000000}`
    - Lợi ích: Bảo mật, độc lập, giảm tải cơ sở dữ liệu.
- **Dịch vụ Danh mục**:
  - Quản lý siêu dữ liệu phim, hỗ trợ tìm kiếm.
  - Công nghệ: Python/FastAPI.
  - Cơ sở dữ liệu: MongoDB, Elasticsearch.
  - Lợi ích: Tìm kiếm nhanh, linh hoạt với dữ liệu phi cấu trúc.
- **Dịch vụ Phát trực tuyến**:
  - Quản lý phiên phát, tạo URL ký số.
  - Công nghệ: Go.
  - Tích hợp CDN, Kafka ghi log sự kiện.
  - Sử dụng **UUID** để định danh phiên phát:
    - Ví dụ: `123e4567-e89b-12d3-a456-426614174000`
    - Lợi ích: Tính duy nhất, hỗ trợ quản lý hàng đợi Redis.
- **Dịch vụ Thanh toán**:
  - Xử lý thanh toán qua Stripe/PayPal.
  - Công nghệ: Node.js.
  - Cơ sở dữ liệu: PostgreSQL.
  - Lợi ích: Thanh toán nhanh, tuân thủ PCI-DSS.
- **Dịch vụ Quản lý Nội dung**:
  - Quản lý phim và siêu dữ liệu.
  - Công nghệ: Django.
  - Cơ sở dữ liệu: PostgreSQL.
  - Lợi ích: Quản lý nội dung dễ dàng, giao diện admin thân thiện.
- **Dịch vụ Xử lý Video**:
  - Mã hóa video (H.264, H.265) bằng AWS Elemental MediaConvert.
  - Tạo manifest file HLS/DASH, áp dụng DRM.
  - Lợi ích: Hỗ trợ đa thiết bị, bảo vệ bản quyền.
- **Dịch vụ Thông báo**:
  - Gửi thông báo qua Kafka và WebSocket.
  - Công nghệ: Node.js.
  - Lợi ích: Thông báo tức thời, tăng tương tác người dùng.

#### 4.2.4 Cơ sở dữ liệu
- **PostgreSQL**: Tài khoản, giao dịch, siêu dữ liệu phim.
  - Lợi ích: Dữ liệu có cấu trúc, giao dịch đáng tin cậy.
- **MongoDB**: Hồ sơ người dùng, lịch sử xem.
  - Sử dụng **MongoDB Replica Set** (Primary, Secondary, Arbiter).
  - Lợi ích: Sao lưu định kỳ, failover tự động, dữ liệu phi cấu trúc.
- **Elasticsearch**: Tìm kiếm nhanh theo tiêu đề/thể loại.
  - Lợi ích: Tìm kiếm toàn văn hiệu quả.
- **Redis**: Phiên, siêu dữ liệu, và hàng đợi.
  - Sử dụng **Redis Redlock** để quản lý khóa phân tán.
  - Sử dụng **Redis Queue** để xử lý hàng đợi thanh toán/phát video.
  - Lợi ích: Tăng tốc độ truy cập, tránh xung đột tài nguyên.

#### 4.2.5 Lưu trữ
- **AWS S3**: Video, hình ảnh, phụ đề, tệp tạm thời.
- **PostgreSQL**: Siêu dữ liệu phim, phân vùng theo khu vực.
- **Lợi ích**: Lưu trữ đáng tin cậy, dễ mở rộng.

#### 4.2.6 CDN (Mạng Phân phối Nội dung)
- Sử dụng AWS CloudFront với prefetching video chunks và caching manifest files.
- **Lợi ích**: Giảm độ trễ, phân phối nội dung toàn cầu.

#### 4.2.7 Cân bằng tải
- AWS ELB trước Kong Gateway, sử dụng thuật toán least connections.
- **Health Check**: Đảm bảo các instance microservices hoạt động tốt.
- **Lợi ích**: Phân phối tải đều, tăng hiệu suất.

#### 4.2.8 Kafka
- **Vai trò**: Xử lý sự kiện thời gian thực (lịch sử xem, thông báo).
- **Topic**:
  - `user-events`: Ghi hành vi người dùng.
  - `streaming-logs`: Ghi log phiên phát.
  - `notifications`: Gửi thông báo phim mới/hết hạn đăng ký.
- **Lợi ích**: Xử lý sự kiện nhanh, hỗ trợ phân tích thời gian thực.

### 4.3 Luồng Dữ liệu
Ví dụ quy trình phát video:
1. **Frontend**: Người dùng đăng nhập, tìm phim, chọn phim để phát.
2. **Kong Gateway**: Xác thực JWT, định tuyến yêu cầu đến Dịch vụ Phát trực tuyến.
3. **Redis**: Kiểm tra phiên người dùng, sử dụng Redlock để khóa tài nguyên video.
4. **Dịch vụ Phát trực tuyến**: Tạo URL ký số với UUID (ví dụ: `123e4567-e89b-12d3-a456-426614174000`), gửi đến CDN.
5. **CDN**: Phát video qua CloudFront, ghi log sự kiện vào Kafka (`streaming-logs`).
6. **MongoDB**: Cập nhật lịch sử xem, sử dụng Replica Set để đảm bảo dữ liệu.
7. **Dịch vụ Thông báo**: Gửi thông báo qua Kafka (`notifications`) và WebSocket nếu có phim mới.

## 5. Khả năng Mở rộng
- **Auto-scaling**: Kubernetes tự động mở rộng microservices và Kong Gateway dựa trên tải.
- **Phân vùng dữ liệu**: PostgreSQL/MongoDB phân vùng theo khu vực/ID người dùng.
- **Redis Queue**: Quản lý hàng đợi để tránh quá tải khi thanh toán/phát video.
- **CDN**: Lưu trữ nội dung gần người dùng qua các điểm cạnh.

## 6. Bảo mật
- **Xác thực**: Kong Gateway với plugin JWT/OAuth, tích hợp Keycloak.
  - Lợi ích: Bảo mật, giảm tải cơ sở dữ liệu.
- **Mã hóa**: HTTPS, AES-256 cho video, DRM (Widevine/FairPlay).
- **Bảo mật thanh toán**: Tuân thủ PCI-DSS với Stripe/PayPal.
- **Chống tấn công**: Plugin Rate Limiting và ACL của Kong, kết hợp WAF.

## 7. Chịu Lỗi
- **MongoDB Replica Set**: Sao lưu định kỳ, failover tự động.
- **Bộ ngắt mạch**: Hystrix để xử lý lỗi dịch vụ.
- **Health Check**: Đảm bảo microservices hoạt động tốt.
- **Giám sát**: Prometheus và Grafana, tích hợp plugin Prometheus của Kong.
- **Ghi log**: ELK Stack với plugin HTTP Log của Kong.

## 8. Triển khai
- **Container hóa**: Docker cho microservices, Kong Gateway, và phụ trợ.
- **Điều phối**: Kubernetes với auto-scaling và rolling updates.
- **CI/CD**: GitHub Actions cho triển khai liên tục.
- **Đám mây**: AWS với EC2, S3, CloudFront, Elemental MediaConvert.

## 9. Ví dụ Cấu Hình Kong Gateway
Cấu hình mẫu cho Kong Gateway:

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

## 10. Ví dụ API Endpoints
- `POST /api/auth/login`: Xác thực, trả về JWT.
- `GET /api/catalog/movies?region={region}`: Lấy danh mục phim.
- `GET /api/stream/{movie_id}`: Lấy URL ký số (UUID) để phát video.
- `POST /api/payment/subscribe`: Xử lý thanh toán.
- `POST /api/notifications`: Gửi thông báo phim mới/hết hạn.
- `WS /api/watch-party/{session_id}`: Kết nối WebSocket cho watch party.

## 11. Thách Thức và Giải Pháp
- **Thách thức**: Độ trễ cao khi khởi tạo video.
  - **Giải pháp**: CDN prefetching, caching manifest files.
- **Thách thức**: Tải cao trong giờ cao điểm.
  - **Giải pháp**: Kubernetes auto-scaling, Redis Queue.
- **Thách thức**: Đồng bộ watch party.
  - **Giải pháp**: WebSocket và Kafka xử lý sự kiện.
- **Thách thức**: Quản lý bản quyền.
  - **Giải pháp**: DRM (Widevine/FairPlay), URL ký số với UUID.

## 12. Kế Hoạch Phát Triển Tiếp Theo
- Tối ưu hóa hiệu suất CDN cho khu vực băng thông thấp.
- Hỗ trợ đa ngôn ngữ cho phụ đề và giao diện.
- Tích hợp phương thức thanh toán địa phương để tăng tiếp cận.