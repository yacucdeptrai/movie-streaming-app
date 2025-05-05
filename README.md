# Báo Cáo Thiết Kế Hệ Thống Trang Web Xem Phim Trực Tuyến (Microservices)

## 1. Tổng Quan

Hệ thống trang web xem phim trực tuyến là một nền tảng phát trực tuyến video chất lượng cao, hỗ trợ hàng triệu người dùng qua trình duyệt web. Người dùng không đăng nhập (khách) xem phim với giới hạn 5 phim/ngày và chờ 10 giây. Người dùng đăng nhập có thể theo dõi phim, xem phim premium qua gói tháng/năm với thanh toán VNPay-QR. Được xây dựng trên kiến trúc **microservices**, hệ thống tích hợp **Kong Gateway**, **Kafka**, **Chord**, và **tiến trình nhẹ (LWP)**. Triển khai trên **Windows Server**, lưu trữ video cục bộ, tích hợp nội dung qua **API/SFTP**, đạt độ tin cậy 99.99%.

### 1.1 Mục Tiêu
- Cung cấp dịch vụ phát trực tuyến video với độ trễ khởi tạo dưới 2 giây.
- Hỗ trợ người dùng khách xem phim giới hạn, khuyến khích đăng nhập.
- Cho phép theo dõi phim và xem phim premium qua gói tháng/năm.
- Bảo vệ dữ liệu, giao dịch, và nội dung bản quyền.
- Tự động hóa tích hợp nội dung qua API/SFTP.
- Tích hợp VNPay-QR để tiếp cận người dùng Việt Nam.

### 1.2 Ứng Dụng và Lý Do Triển Khai
- **Ứng dụng**:
  - Phát trực tuyến phim theo yêu cầu qua web.
  - Quản lý đăng ký, thanh toán gói, và hồ sơ người dùng.
  - Quản lý nội dung và báo cáo doanh thu.
- **Lý do triển khai**:
  - **Khả năng mở rộng**: Microservices và Kubernetes đáp ứng tải lớn.
  - **Hiệu suất cao**: Nginx và Cloudflare giảm độ trễ.
  - **Độ tin cậy**: MongoDB Replica Set, ELB, Chord đảm bảo chịu lỗi.
  - **Bảo mật**: JWT, OAuth 2.0, DRM, chữ ký VNPay.
  - **Tiết kiệm chi phí**: Lưu trữ cục bộ, API/SFTP.
  - **Tiếp cận địa phương**: VNPay-QR phổ biến tại Việt Nam.

### 1.3 Yêu Cầu Hệ Thống
#### Yêu Cầu Chức Năng
- **Người dùng khách**:
  - Xem phim không cần đăng nhập, chờ 10 giây trước khi phát.
  - Giới hạn tối đa 5 phim/ngày (dựa trên IP/session ID).
  - Không lưu lịch sử xem hoặc hỗ trợ theo dõi phim.
- **Người dùng đăng nhập**:
  - Đăng ký, xác thực, quản lý hồ sơ với Single Sign-On (SSO).
  - Duyệt danh mục phim, tìm kiếm theo tiêu đề, thể loại, hoặc danh mục.
  - Phát video ở các độ phân giải (480p, 720p, 1080p, 4K) với bitrate thích ứng (HLS/DASH).
  - Hỗ trợ phụ đề đa ngôn ngữ, nhiều bản âm thanh, điều chỉnh chất lượng.
  - Theo dõi phim: Lưu lịch sử xem, tiếp tục xem, danh sách yêu thích.
  - Xem phim premium với gói tháng (100,000 VND) hoặc năm (1,000,000 VND) qua VNPay-QR.
  - Nhận thông báo thời gian thực (phim mới, hết hạn gói) qua WebSocket.
- **Quản trị viên**:
  - Quản lý nội dung: Cập nhật siêu dữ liệu phim qua giao diện web.
  - Quản lý người dùng: Xem thông tin, khóa tài khoản, phân tích hành vi.
  - Tạo báo cáo doanh thu và quản lý thanh toán.

#### Yêu Cầu Phi Chức Năng
- **Khả năng mở rộng**: Hỗ trợ hàng triệu người dùng đồng thời.
- **Hiệu suất**: Độ trễ khởi tạo video dưới 2 giây, chuyển đổi bitrate mượt mà.
- **Độ tin cậy**: Đạt 99.99% thời gian hoạt động.
- **Bảo mật**: Bảo vệ dữ liệu, giao dịch, nội dung bản quyền.
- **Tiết kiệm chi phí**: Lưu trữ cục bộ.

## 2. Kiến Trúc Hệ Thống

### 2.1 Kiến Trúc Tổng Quan
Hệ thống sử dụng kiến trúc **microservices**, kết hợp **kiến trúc hướng sự kiện** (Kafka) và **kiến trúc hướng dịch vụ** (gRPC, REST). Các thành phần chính bao gồm **Kong Gateway**, **microservices**, **Nginx/Cloudflare**, **Kafka**, **RabbitMQ**, và **Chord**, triển khai trên **Windows Server** với **Docker Desktop** và **Kubernetes**. Video lưu cục bộ, xử lý bởi **FFmpeg**, phân phối qua **Nginx**. Thanh toán chỉ qua **VNPay-QR**.

```
[Người dùng] --> [Internet]
                |
                v
[ELB] --> [Kong Gateway]
                |
                v
[Microservices] <--> [Cơ sở dữ liệu] <--> [Redis/RabbitMQ/Chord]
       |                   |                   |
       v                   v                   v
[Nginx/Cloudflare] <---- [Lưu trữ cục bộ] <--> [Kafka]
       |
       v
[FFmpeg]
```

### 2.2 Các Thành Phần Chi Tiết

#### 2.2.1 Giao Diện Người Dùng (Frontend)
- **Công nghệ**: React.js, Tailwind CSS, hỗ trợ trình duyệt web (Chrome, Edge, Firefox).
- **Chi tiết**:
  - Ứng dụng một trang (SPA) với prefetching siêu dữ liệu phim.
  - Trình phát video hỗ trợ HLS/DASH, tích hợp DRM cục bộ.
  - WebSocket cho thông báo thời gian thực (phim mới, hết hạn gói).
  - Tài nguyên tĩnh (hình ảnh, CSS, JS) lưu cục bộ, phân phối qua Nginx/Cloudflare.
  - **Người dùng khách**:
    - Hiển thị danh mục phim, nhãn "Premium" cho phim yêu cầu gói.
    - Màn hình chờ 10 giây (đồng hồ đếm ngược/quảng cáo) trước khi phát.
    - Thông báo nếu vượt giới hạn 5 phim/ngày: "Vui lòng đăng nhập để xem thêm."
  - **Người dùng đăng nhập**:
    - Hiển thị lịch sử xem, danh sách yêu thích, nhãn "Premium".
    - Phim premium: Hiển thị nút "Mua gói tháng/năm" và mã QR nếu chưa có gói.
    - Thanh toán qua VNPay-QR (quét mã QR, thời hạn 15 phút).
- **Luồng**:
  - **Khách**:
    1. Chọn phim, chờ 10 giây, xem nếu dưới giới hạn 5 phim/ngày.
    2. Vượt giới hạn: Yêu cầu đăng nhập.
  - **Đăng nhập**:
    1. Chọn phim miễn phí: Xem ngay, lưu lịch sử.
    2. Chọn phim premium: Kiểm tra gói, thanh toán nếu cần, lưu lịch sử.
  - Thanh toán: Gọi API `/api/payment/vnpay`, hiển thị mã QR.
- **Giao thức**: TCP (HTTP, WebSocket).
- **Định danh**:
  - UUID cho phiên người dùng (ví dụ: `123e4567-e89b-12d3-a456-426614174000`).
  - DNS phân giải `www.example.com`.
- **Lợi ích**:
  - Giao diện thân thiện, hỗ trợ khách và người dùng đăng nhập.
  - Tăng chuyển đổi qua giới hạn khách và phim premium.

#### 2.2.2 Kong Gateway (API Gateway)
- **Vai trò**:
  - Định tuyến yêu cầu từ frontend đến microservices.
  - Xác thực qua JWT và OAuth 2.0 (tích hợp Keycloak) cho người dùng đăng nhập.
  - Không yêu cầu JWT cho API khách (`/api/stream/guest`).
  - Giới hạn tỷ lệ (10 yêu cầu/giây, 1000 yêu cầu/giờ).
  - Giám sát với Prometheus, ghi log qua ELK Stack.
- **Giao thức**: HTTP/TCP.
- **Luồng**:
  - Thread-per-connection cho WebSocket (thông báo).
  - Thread-per-request cho REST API.
- **Định danh**:
  - DNS phân giải `api.example.com`.
  - JWT chứa `user_id` (ví dụ: `{"user_id": "12345", "role": "user"}`).
- **Cấu hình**:
  - Chạy trên Kubernetes với Docker Desktop trên Windows Server.
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
            - /api/watch_history
            - /api/favorites
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
            - /api/stream/guest
          plugins:
            - name: rate-limiting
              config:
                second: 10
                hour: 1000
    - name: payment-service
      url: http://payment-service/api
      routes:
        - name: payment-route
          paths:
            - /api/payment
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
  - Quản lý API tập trung, hỗ trợ khách và người dùng đăng nhập.
  - Bảo mật cao với JWT và rate limiting.

#### 2.2.3 Microservices
Mỗi microservice chạy trong container Docker trên Windows Server, sử dụng **tiến trình nhẹ (LWP)**, giao tiếp qua REST, gRPC, hoặc Kafka.
- **Dịch vụ Người dùng**:
  - **Chức năng**:
    - Quản lý đăng ký, đăng nhập, hồ sơ, tùy chọn.
    - Lưu lịch sử xem và danh sách yêu thích cho người dùng đăng nhập.
    - Theo dõi giới hạn 5 phim/ngày cho khách (Redis).
  - **Công nghệ**: Node.js/Express (REST), gRPC.
  - **Cơ sở dữ liệu**: PostgreSQL (tài khoản), MongoDB (hồ sơ, lịch sử, yêu thích).
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP (REST, gRPC).
- **Dịch vụ Danh mục**:
  - **Chức năng**: Quản lý siêu dữ liệu phim, gắn nhãn "premium", hỗ trợ tìm kiếm.
  - **Công nghệ**: Python/FastAPI (REST), gRPC.
  - **Cơ sở dữ liệu**: MongoDB, Elasticsearch.
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP.
- **Dịch vụ Phát trực tuyến**:
  - **Chức năng**:
    - Quản lý phiên phát, tạo URL ký số.
    - Người dùng khách: Chờ 10 giây, kiểm tra giới hạn 5 phim/ngày (Redis).
    - Người dùng đăng nhập: Kiểm tra quyền truy cập phim premium (PostgreSQL).
  - **Công nghệ**: Go.
  - **Tích hợp**: Nginx/Cloudflare, Kafka, Chord.
  - **Luồng**: Thread-per-connection cho HLS.
  - **Giao thức**: UDP (HLS/DASH), TCP (REST/gRPC).
- **Dịch vụ Thanh toán**:
  - **Chức năng**: Xử lý thanh toán gói tháng/năm qua VNPay-QR.
  - **Công nghệ**: Node.js, gRPC, VNPay SDK.
  - **Cơ sở dữ liệu**: PostgreSQL (bảng `transactions`, `subscriptions`).
  - **Luồng**:
    1. Nhận yêu cầu (`POST /api/payment/vnpay`) với `plan_type` (monthly/yearly).
    2. Tạo mã QR, trả về frontend.
    3. Xử lý webhook (`POST /api/payment/vnpay/callback`), cập nhật `subscriptions`.
    4. Gửi thông báo qua WebSocket.
  - **Giao thức**: TCP.
  - **Tích hợp VNPay-QR**:
    - VNPay SDK (Node.js) tạo mã QR.
    - Xác minh webhook bằng chữ ký HMAC-SHA512.
    - Thời hạn giao dịch: 15 phút.
  - **Ví dụ mã Node.js (VNPay-QR)**:
    ```javascript
    const crypto = require('crypto');
    const QRCode = require('qrcode');

    async function createVNPayQR({ user_id, amount, plan_type }) {
      const orderId = `txn_${Date.now()}_${user_id}`;
      const params = {
        vnp_TmnCode: process.env.VNPAY_TMN_CODE,
        vnp_Amount: amount * 100, // VND, multiply by 100
        vnp_Command: 'pay',
        vnp_CreateDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
        vnp_CurrCode: 'VND',
        vnp_IpAddr: '127.0.0.1',
        vnp_Locale: 'vn',
        vnp_OrderInfo: `Thanh toan goi ${plan_type} cho user ${user_id}`,
        vnp_OrderType: '250000',
        vnp_ReturnUrl: 'https://api.example.com/api/payment/vnpay/callback',
        vnp_TxnRef: orderId,
        vnp_Version: '2.1.0',
      };

      const sortedParams = Object.keys(params).sort().reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {});

      const signData = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      const secureHash = crypto
        .createHmac('sha512', process.env.VNPAY_SECRET_KEY)
        .update(signData)
        .digest('hex');

      params.vnp_SecureHash = secureHash;

      const paymentUrl = `https://pay.vnpay.vn/vpcpay.html?${new URLSearchParams(params).toString()}`;
      const qrCode = await QRCode.toDataURL(paymentUrl);

      return { qr_code: qrCode };
    }

    async function handleVNPayCallback(req) {
      const { vnp_TxnRef, vnp_TransactionNo, vnp_ResponseCode } = req.body;
      const secureHash = req.body.vnp_SecureHash;

      // Verify signature
      const signData = Object.keys(req.body)
        .filter(key => key !== 'vnp_SecureHash')
        .sort()
        .map(key => `${key}=${req.body[key]}`)
        .join('&');
      const computedHash = crypto
        .createHmac('sha512', process.env.VNPAY_SECRET_KEY)
        .update(signData)
        .digest('hex');

      if (computedHash !== secureHash) {
        throw new Error('Invalid signature');
      }

      if (vnp_ResponseCode === '00') {
        // Update transaction and subscription
        await db.query(
          'UPDATE transactions SET status = $1, vnpay_transaction_id = $2 WHERE order_id = $3',
          ['completed', vnp_TransactionNo, vnp_TxnRef]
        );
        await db.query(
          'INSERT INTO subscriptions (id, user_id, plan_type, status, start_date, end_date, vnpay_transaction_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [uuidv4(), user_id, plan_type, 'active', new Date(), new Date(Date.now() + (plan_type === 'monthly' ? 30*24*60*60*1000 : 365*24*60*60*1000)), vnp_TransactionNo]
        );
        // Notify user via WebSocket
        notifyUser(vnp_TxnRef, 'Payment successful');
      }
      return { status: 'success' };
    }
    ```
- **Dịch vụ Quản lý Nội dung**:
  - **Chức năng**: Quản lý siêu dữ liệu phim, gắn nhãn "premium".
  - **Công nghệ**: Django.
  - **Cơ sở dữ liệu**: PostgreSQL.
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP.
- **Dịch vụ Xử lý Video**:
  - **Chức năng**: Mã hóa video (H.264, H.265), tạo HLS/DASH, áp dụng DRM.
  - **Công nghệ**: FFmpeg (Windows build).
  - **Luồng**: Thread-per-request.
  - **Giao thức**: TCP.
- **Dịch vụ Thông báo**:
  - **Chức năng**: Gửi thông báo qua WebSocket và Kafka (phim mới, hết hạn gói).
  - **Công nghệ**: Node.js.
  - **Luồng**: Thread-per-connection.
  - **Giao thức**: TCP (WebSocket).

#### 2.2.4 Cơ Sở Dữ Liệu
- **PostgreSQL**: Lưu tài khoản, giao dịch, gói đăng ký, siêu dữ liệu phim.
  - Bảng `transactions`:
    ```sql
    CREATE TABLE transactions (
      id UUID PRIMARY KEY,
      user_id UUID,
      amount DECIMAL(15,2),
      plan_type VARCHAR(20),
      vnpay_transaction_id VARCHAR(50),
      status VARCHAR(20),
      created_at TIMESTAMP
    );
    ```
  - Bảng `subscriptions`:
    ```sql
    CREATE TABLE subscriptions (
      id UUID PRIMARY KEY,
      user_id UUID,
      plan_type VARCHAR(20),
      status VARCHAR(20),
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      vnpay_transaction_id VARCHAR(50)
    );
    ```
- **MongoDB**: Lưu hồ sơ, lịch sử xem, danh sách yêu thích.
  - Collection `watch_history`:
    ```json
    {
      "user_id": "12345",
      "movie_id": "movie_123",
      "position": 300,
      "title": "Movie A",
      "last_watched": "2025-05-05T10:00:00Z"
    }
    ```
  - Collection `favorites`:
    ```json
    {
      "user_id": "12345",
      "movie_id": "movie_123",
      "title": "Movie A",
      "added_at": "2025-05-05T10:00:00Z"
    }
    ```
- **Elasticsearch**: Tìm kiếm phim theo thuộc tính (ví dụ: `genre:action AND year>2020`).
- **Redis**: Quản lý phiên, giới hạn khách, hàng đợi.
  - Key `guest:<ip>:<date>`: Lưu số phim xem (TTL: 24 giờ).

#### 2.2.5 Lưu Trữ
- **Lưu trữ cục bộ**:
  - Lưu video, hình ảnh, phụ đề với UUID (ví dụ: `storage/videos/123e4567-e89b-12d3-a456-426614174000/`).
  - Hỗ trợ SFTP/API từ nhà cung cấp nội dung.
  - Mã hóa tại rest bằng **BitLocker**.
  - Quyền truy cập qua **NTFS permissions**.
- **PostgreSQL**: Lưu siêu dữ liệu phim.

#### 2.2.6 CDN
- **Công nghệ**: Nginx (Windows) + Cloudflare.
- **Chi tiết**:
  - Nginx phục vụ video từ `storage/videos/`, caching tại local.
  - Cloudflare cache video tại edge, giảm độ trễ.
  - UDP cho HLS/DASH.
  - Tra cứu UUID qua Chord.
  - DNS: `cdn.example.com`.
- **Cấu hình Nginx**:
  ```nginx
  server {
      listen 80;
      server_name cdn.example.com;
      location /videos/ {
          root storage/videos;
          add_header Access-Control-Allow-Origin "*";
      }
  }
  ```

#### 2.2.7 Cân Bằng Tải
- **Công nghệ**: Elastic Load Balancer (HAProxy).
- **Chi tiết**: Thuật toán least connections, health check.

#### 2.2.8 Kafka
- **Vai trò**: Xử lý sự kiện (Publish-Subscribe).
- **Topic**:
  - `user-events`: Hành vi người dùng.
  - `guest-streaming`: Phim xem bởi khách.
  - `streaming-logs`: Log phiên phát.
  - `notifications`: Thông báo.
  - `content-updates`: Cập nhật nội dung.
  - `payment-logs`: Giao dịch VNPay-QR.
- **Định danh**: UUID.

#### 2.2.9 RabbitMQ
- **Vai trò**: Message Queue cho xử lý bất đồng bộ (thanh toán, mã hóa video).
- **Giao thức**: AMQP (TCP).
- **Cấu hình**:
  ```yaml
  queue:
    name: payment-queue
    durable: true
    exchange:
      name: payment-exchange
      type: direct
  ```

#### 2.2.10 Chord
- **Vai trò**: Tra cứu phân tán UUID (video).
- **Cơ chế**: Vòng tròn định danh, Finger Table, tra cứu \(O(\log N)\).
- **Ví dụ**:
  - Mạng 8 nút: 0, 1, 4, 7, 9, 11, 12, 14.
  - UUID video "Movie A" (khóa 3) lưu tại nút ID 4.

### 2.3 Luồng Dữ Liệu
- **Phát video (khách)**:
  1. Frontend gửi yêu cầu (`GET /api/stream/guest/{movie_id}`).
  2. Kong Gateway định tuyến (không cần JWT).
  3. Dịch vụ Phát trực tuyến kiểm tra giới hạn (Redis), thêm độ trễ 10 giây.
  4. Tạo URL ký số (HLS/DASH), phục vụ qua Nginx/Cloudflare.
  5. Kafka ghi log (`guest-streaming`).
- **Phát video (đăng nhập)**:
  1. Frontend gửi yêu cầu (`GET /api/stream/{movie_id}`) với JWT.
  2. Kong Gateway xác thực, định tuyến.
  3. Dịch vụ Phát trực tuyến kiểm tra quyền (PostgreSQL: `subscriptions`).
  4. Tạo URL ký số, phục vụ qua Nginx/Cloudflare.
  5. MongoDB lưu lịch sử (`watch_history`), Kafka ghi log.
- **Thanh toán**:
  1. Frontend gửi yêu cầu (`POST /api/payment/vnpay`).
  2. Kong Gateway định tuyến.
  3. Dịch vụ Thanh toán tạo mã QR, trả về frontend.
  4. Người dùng quét mã QR, VNPay gửi webhook (`POST /api/payment/vnpay/callback`).
  5. Cập nhật `subscriptions`, `transactions`, thông báo qua WebSocket.
- **Quản lý nội dung**:
  1. Nhà cung cấp gửi video qua API/SFTP.
  2. Dịch vụ Xử lý Video (FFmpeg) mã hóa, lưu vào `storage/videos/`.
  3. Webhook thông báo admin, admin nhập siêu dữ liệu qua Django.
  4. Lưu vào PostgreSQL, chỉ mục trong Elasticsearch, Kafka ghi log.

**Sơ đồ luồng (Phát video khách)**:
```
[Guest] --> [GET /api/stream/guest] --> [Kong Gateway] --> [Streaming Service]
   |                                                   |
   v                                                   v
[Wait 10s] <-------------------------------- [Check Limit (Redis)]
   |                                                   |
   v                                                   v
[Play Video] <----------------------------- [Generate Signed URL]
```

**Sơ đồ luồng (Thanh toán gói)**:
```
[User] --> [POST /api/payment/vnpay] --> [Kong Gateway] --> [Payment Service]
   |                                                     |
   v                                                     v
[Display QR] <--------------------------------- [Create QR Code]
   |                                                     |
   v                                                     v
[Scan QR] ----------------------------------> [Webhook /api/payment/vnpay/callback]
                                                     |
                                                     v
                                                 [Update subscriptions]
                                                     |
                                                     v
                                                 [Notify via WebSocket]
```

### 2.4 Quy Trình Quản Lý Nội Dung
Quản lý nội dung do **admin (dưới quyền account)** thực hiện qua **Dịch vụ Quản lý Nội dung** (Django). Tải video tự động, admin chỉ quản lý siêu dữ liệu.

#### 2.4.1 Nguồn Gốc Video
- **Phương thức**: Lưu trữ cục bộ (`storage/videos/`) qua **API** hoặc **SFTP**.
  - **Cơ chế**:
    - Nhà cung cấp gửi video qua **REST API** (`POST /api/content/upload`) hoặc **SFTP**.
    - Gán **UUID** (ví dụ: `123e4567-e89b-12d3-a456-426614174000`).
    - Dịch vụ Xử lý Video (FFmpeg) mã hóa (H.264, H.265), tạo HLS/DASH, áp dụng DRM.
    - Lưu video vào `storage/videos/`, gửi webhook cho admin:
      ```json
      {
        "event": "video_uploaded",
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "source": "provider_x",
        "timestamp": "2025-05-05T10:00:00Z"
      }
      ```
  - **Lợi ích**:
    - Tự động hóa, tích hợp linh hoạt, tiết kiệm chi phí.

#### 2.4.2 Cập Nhật Siêu Dữ Liệu
- **Quy trình**:
  - Admin nhận webhook, đăng nhập Django, nhập siêu dữ liệu (tên, thể loại, nhãn "premium", v.v.).
  - Liên kết siêu dữ liệu với UUID, lưu vào **PostgreSQL**.
  - **Elasticsearch** lập chỉ mục để tìm kiếm.
- **Giao diện**: Django cung cấp form nhập liệu và danh sách phim.
- **API**:
  - `POST /api/content/movies`: Tạo/cập nhật siêu dữ liệu.
    - Request: `{"uuid": "123e4567-e89b-12d3-a456-426614174000", "title": "Movie A", "genre": "Action", "is_premium": true}`
    - Response: `{"status": "success", "movie_id": "movie_123"}`
  - `GET /api/content/movies/{uuid}`: Lấy siêu dữ liệu.
  - `POST /api/content/upload`: Tải video (nhà cung cấp).

#### 2.4.3 Luồng Quản Lý Nội Dung
1. Nhà cung cấp gửi video qua API/SFTP.
2. Dịch vụ Xử lý Video mã hóa, gán UUID, lưu vào `storage/videos/`.
3. Webhook thông báo admin.
4. Admin nhập siêu dữ liệu qua Django.
5. Lưu vào PostgreSQL, chỉ mục trong Elasticsearch, Kafka ghi log (`content-updates`).

**Sơ đồ**:
```
[Nhà cung cấp] --> [API/SFTP] --> [Lưu trữ cục bộ]
   |                                |
   v                                v
[Webhook] --> [Admin (Django)] --> [Nhập Metadata] --> [PostgreSQL/Elasticsearch]
                                      |
                                      v
                                    [Kafka: content-updates]
```

### 2.5 Cấu Trúc Thư Mục Phát Triển
Dự án được tổ chức trong thư mục gốc `movie-streaming-app`, hỗ trợ phát triển, triển khai, và bảo trì trên Windows Server. Cấu trúc tách biệt frontend, microservices, lưu trữ, cơ sở dữ liệu, hạ tầng, và tài liệu, phù hợp với kiến trúc microservices.

#### Cấu Trúc Thư Mục
```
movie-streaming-app/
├── frontend/                           # Frontend (React.js, Tailwind CSS)
│   ├── src/                            # Mã nguồn React.js
│   │   ├── components/                 # Component (Player, QRCode, WaitScreen)
│   │   │   ├── Player.js               # Trình phát video (HLS/DASH)
│   │   │   ├── QRCode.js               # Mã QR VNPay
│   │   │   ├── WaitScreen.js           # Màn hình chờ 10 giây
│   │   ├── pages/                      # Trang (Home, Catalog, Payment)
│   │   ├── redux/                      # Quản lý trạng thái
│   │   ├── App.js                      # Component chính
│   │   └── index.js                    # Entry point
│   ├── public/                         # Tài nguyên tĩnh (logo, favicon)
│   ├── Dockerfile                      # Dockerfile
│   ├── package.json                    # Dependencies
│   └── kubernetes/                     # Kubernetes manifests
│       ├── deployment.yaml             # Deployment
│       └── service.yaml                # Service
├── microservices/                      # Microservices
│   ├── user-service/                   # Dịch vụ Người dùng (Node.js)
│   │   ├── src/                        # Mã nguồn
│   │   │   ├── routes/                 # API (auth, watch_history, favorites)
│   │   │   ├── controllers/            # Logic
│   │   │   ├── models/                 # Mô hình
│   │   │   └── index.js                # Entry point
│   │   ├── Dockerfile                  # Dockerfile
│   │   ├── package.json                # Dependencies
│   │   └── kubernetes/                 # Kubernetes manifests
│   ├── catalog-service/                # Dịch vụ Danh mục (Python/FastAPI)
│   │   ├── src/                        # Mã nguồn
│   │   │   ├── routes/                 # API (movies, search)
│   │   │   ├── models/                 # Mô hình
│   │   │   └── main.py                 # Entry point
│   │   ├── Dockerfile                  # Dockerfile
│   │   ├── requirements.txt             # Dependencies
│   │   └── kubernetes/                 # Kubernetes manifests
│   ├── streaming-service/              # Dịch vụ Phát trực tuyến (Go)
│   │   ├── src/                        # Mã nguồn
│   │   │   ├── handlers/               # API (stream, guest)
│   │   │   ├── models/                 # Mô hình
│   │   │   └── main.go                 # Entry point
│   │   ├── Dockerfile                  # Dockerfile
│   │   ├── go.mod                      # Dependencies
│   │   └── kubernetes/                 # Kubernetes manifests
│   ├── payment-service/                # Dịch vụ Thanh toán (Node.js, VNPay-QR)
│   │   ├── src/                        # Mã nguồn
│   │   │   ├── routes/                 # API (vnpay, callback)
│   │   │   ├── controllers/            # Logic VNPay-QR
│   │   │   ├── models/                 # Mô hình
│   │   │   └── index.js                # Entry point
│   │   ├── Dockerfile                  # Dockerfile
│   │   ├── package.json                # Dependencies
│   │   └── kubernetes/                 # Kubernetes manifests
│   ├── content-service/                # Dịch vụ Quản lý Nội dung (Django)
│   │   ├── src/                        # Mã nguồn
│   │   │   ├── movies/                 # App quản lý phim
│   │   │   ├── manage.py               # Django CLI
│   │   │   └── settings.py             # Cấu hình
│   │   ├── Dockerfile                  # Dockerfile
│   │   ├── requirements.txt             # Dependencies
│   │   └── kubernetes/                 # Kubernetes manifests
│   ├── video-service/                  # Dịch vụ Xử lý Video (FFmpeg)
│   │   ├── src/                        # Mã nguồn (Python)
│   │   │   ├── scripts/                # Script FFmpeg
│   │   │   └── main.py                 # Entry point
│   │   ├── Dockerfile                  # Dockerfile
│   │   ├── requirements.txt             # Dependencies
│   │   └── kubernetes/                 # Kubernetes manifests
│   └── notification-service/           # Dịch vụ Thông báo (Node.js)
│       ├── src/                        # Mã nguồn
│       │   ├── routes/                 # API (notifications)
│       │   ├── controllers/            # Logic WebSocket
│       │   └── index.js                # Entry point
│       ├── Dockerfile                  # Dockerfile
│       ├── package.json                # Dependencies
│       └── kubernetes/                 # Kubernetes manifests
├── storage/                            # Lưu trữ video và tài nguyên
│   ├── videos/                         # Video cục bộ
│   │   ├── <uuid>/                     # Thư mục UUID
│   │   │   ├── movie.m3u8             # HLS playlist
│   │   │   ├── movie.mpd              # DASH manifest
│   │   │   └── segments/              # Đoạn video
│   ├── thumbnails/                     # Hình ảnh phim
│   └── subtitles/                      # Phụ đề
├── databases/                          # Cấu hình cơ sở dữ liệu
│   ├── postgresql/                     # PostgreSQL
│   │   ├── init.sql                   # Script (users, transactions, subscriptions)
│   │   ├── pg_hba.conf                # Cấu hình xác thực
│   │   └── postgresql.conf            # Cấu hình server
│   ├── mongodb/                        # MongoDB
│   │   ├── mongod.conf                # Cấu hình server
│   │   └── init.js                    # Script (watch_history, favorites)
│   ├── elasticsearch/                  # Elasticsearch
│   │   ├── elasticsearch.yml           # Cấu hình server
│   │   └── mappings/                  # Chỉ mục phim
│   └── redis/                          # Redis
│       ├── redis.conf                 # Cấu hình server
│       └── init.lua                   # Script (guest limits)
├── infrastructure/                     # Cấu hình hạ tầng
│   ├── kong/                           # Kong Gateway
│   │   ├── kong.yml                   # Cấu hình dịch vụ, routes, plugins
│   │   ├── Dockerfile                 # Dockerfile
│   │   └── kubernetes/                # Kubernetes manifests
│   ├── nginx/                          # Nginx (CDN)
│   │   ├── nginx.conf                 # Cấu hình server
│   │   ├── Dockerfile                 # Dockerfile
│   │   └── kubernetes/                # Kubernetes manifests
│   ├── kafka/                          # Kafka
│   │   ├── server.properties          # Cấu hình server
│   │   ├── Dockerfile                 # Dockerfile
│   │   └── kubernetes/                # Kubernetes manifests
│   ├── rabbitmq/                       # RabbitMQ
│   │   ├── rabbitmq.conf              # Cấu hình server
│   │   ├── Dockerfile                 # Dockerfile
│   │   └── kubernetes/                # Kubernetes manifests
│   └── chord/                          # Chord (tra cứu UUID)
│       ├── src/                        # Mã nguồn (Go)
│       ├── Dockerfile                 # Dockerfile
│       └── kubernetes/                # Kubernetes manifests
├── scripts/                            # Script tiện ích
│   ├── backup.bat                     # Sao lưu
│   ├── deploy.bat                     # Triển khai
│   ├── encode_video.py                # Mã hóa video
│   └── monitor.bat                    # Giám sát
├── docs/                               # Tài liệu
│   ├── design.md                      # Thiết kế hệ thống
│   ├── api.md                         # Tài liệu API
│   ├── setup.md                       # Hướng dẫn cài đặt
│   └── changelog.md                   # Lịch sử thay đổi
├── .gitignore                         # Loại trừ file
├── docker-compose.yml                 # Cấu hình phát triển
├── kubernetes/                        # Kubernetes toàn cục
│   ├── namespace.yaml                 # Namespace
│   └── ingress.yaml                   # Ingress
└── README.md                          # Mô tả dự án
```

#### Mô Tả
- **frontend/**: Mã nguồn React.js, xử lý màn hình chờ 10 giây, mã QR VNPay, lịch sử xem.
- **microservices/**: Tách biệt từng dịch vụ (user, catalog, streaming, payment, content, video, notification).
- **storage/**: Lưu video tại `storage/videos/`, phục vụ bởi Nginx.
- **databases/**: Script khởi tạo cho PostgreSQL, MongoDB, Elasticsearch, Redis.
- **infrastructure/**: Cấu hình Kong, Nginx, Kafka, RabbitMQ, Chord.
- **scripts/**: Script Windows (.bat, .py) cho sao lưu, triển khai, mã hóa video.
- **docs/**: Tài liệu thiết kế, API, cài đặt.
- **kubernetes/**: Cấu hình triển khai toàn cục.

#### Lợi ích
- **Tổ chức rõ ràng**: Tách biệt thành phần, dễ quản lý trên Windows.
- **Hỗ trợ triển khai**: Dockerfile và Kubernetes manifests sẵn sàng.
- **Tính linh hoạt**: Không phụ thuộc đường dẫn tuyệt đối.
- **Bảo trì dễ dàng**: Script tiện ích và tài liệu hỗ trợ.

## 3. Trao Đổi Thông Tin

### 3.1 Giao Thức
- **TCP** (REST, WebSocket, gRPC, SFTP): Đăng nhập, thanh toán, thông báo, tải video.
  - **Cấu trúc gói tin**:
    ```
    | Source Port | Destination Port |
    | Sequence Number                  |
    | Acknowledgment Number            |
    | Header Length | Flags | Window   |
    | Checksum      | Urgent Pointer   |
    | Options | Data                   |
    ```
- **UDP** (HLS/DASH): Streaming video.
  - **Cấu trúc gói tin**:
    ```
    | Source Port | Destination Port |
    | Length      | Checksum         |
    | Data                             |
    ```

### 3.2 gRPC
- **Ứng dụng**: Giao tiếp nội bộ microservices.
- **Công nghệ**: HTTP/2, Protocol Buffers.
- **Ví dụ**:
  ```proto
  service StreamingService {
    rpc CheckAccess (AccessRequest) returns (AccessResponse);
  }
  message AccessRequest {
    string user_id = 1;
    string movie_id = 2;
  }
  message AccessResponse {
    bool allowed = 1;
    bool is_premium = 2;
  }
  ```

### 3.3 Mô Hình Thông Điệp
- **Publish-Subscribe (Kafka)**: Ghi log, thông báo, sự kiện.
- **Message Queues (RabbitMQ)**: Thanh toán, mã hóa video.

## 4. Tiến Trình và Luồng

### 4.1 Tiến Trình Nhẹ (LWP)
- **Cơ chế**: Mỗi microservice là tiến trình, sinh nhiều LWP.
- **Ứng dụng**: Tối ưu CPU trên Windows Server.

### 4.2 Luồng
- **Client**: Tách luồng giao diện (React) và API/WebSocket.
- **Server**:
  - Kong Gateway: Thread-per-connection (WebSocket), thread-per-request (REST).
  - Dịch vụ Thanh toán: Thread-per-request (VNPay-QR).
  - Dịch vụ Phát trực tuyến: Thread-per-connection (HLS).
  - Dịch vụ Danh mục: Thread-per-request.
- **Dispatcher**: Nhận yêu cầu, xếp hàng đợi, chuyển đến worker threads.

## 5. Định Danh và Không Gian Tên

### 5.1 UUID
- **Ứng dụng**: Định danh người dùng, video, giao dịch, phiên.
- **Ví dụ**: `123e4567-e89b-12d3-a456-426614174000` (v4).
- **Lợi ích**: Duy nhất, ngăn xung đột.

### 5.2 Chord
- **Ứng dụng**: Tra cứu UUID (video).
- **Cơ chế**: Vòng tròn định danh, Finger Table, tra cứu \(O(\log N)\).

### 5.3 DNS
- **Ứng dụng**: Phân giải `www.example.com`, `api.example.com`, `cdn.example.com`.

### 5.4 Elasticsearch
- **Ứng dụng**: Tìm kiếm (ví dụ: `genre:action AND year>2020`).

## 6. Đồng Bộ Hóa

### 6.1 Distributed Locking
- **Công cụ**: Redis Redlock.
- **Ứng dụng**: Khóa khi cập nhật lịch sử xem, giao dịch.
- **Cơ chế**: TTL 5 giây, tránh deadlock.

### 6.2 Message Queues
- **Công cụ**: Kafka, RabbitMQ.
- **Ứng dụng**: Kafka ghi log, RabbitMQ xử lý thanh toán/mã hóa.

### 6.3 Optimistic Locking
- **Ứng dụng**: Cập nhật lịch sử xem, giao dịch.
- **Cơ chế**: Kiểm tra `version` trước khi ghi.

## 7. Sao Lưu

### 7.1 Database Backup
- **Công cụ**: pg_dump (PostgreSQL), mongodump (MongoDB).
- **Ứng dụng**: Sao lưu tài khoản, giao dịch, gói, lịch sử xem.
- **Cơ chế**: Snapshot hàng ngày vào `backup/`.
- **Ví dụ**:
  ```cmd
  pg_dump -U postgres dbname > backup/db-%DATE:~-4%%DATE:~4,2%%DATE:~7,2%.sql
  mongodump --out backup/mongodb-%DATE:~-4%%DATE:~4,2%%DATE:~7,2%
  ```

### 7.2 Incremental Backup
- **Công cụ**: robocopy.
- **Ứng dụng**: Sao lưu video, log.
- **Ví dụ**:
  ```cmd
  robocopy storage/videos backup/videos /MIR /Z
  ```

### 7.3 Local Storage
- **Công cụ**: Lưu trữ cục bộ phụ.
- **Ứng dụng**: Lưu bản sao lưu.

### 7.4 Data Replication
- **Công cụ**: MongoDB Replica Set, PostgreSQL Streaming Replication.
- **Ứng dụng**: Sao chép thời gian thực.

### 7.5 Automated Backup
- **Công cụ**: Windows Task Scheduler.
- **Ví dụ**:
  ```cmd
  schtasks /create /sc daily /tn "BackupDB" /tr "pg_dump -U postgres dbname > backup/db-%DATE:~-4%%DATE:~4,2%%DATE:~7,2%.sql" /st 02:00
  ```

**Sơ đồ**:
```
[PostgreSQL] --> [pg_dump] --> [backup/]
[MongoDB] --> [mongodump] --> [backup/]
[Video] --> [robocopy] --> [backup/]
[Task Scheduler] --> [Automate Schedule]
```

## 8. Tính Chịu Lỗi
- **MongoDB Replica Set**: Failover tự động.
- **Hystrix**: Circuit Breaking.
- **Prometheus/Grafana**: Giám sát.
- **ELK Stack**: Quản lý log.
- **HAProxy**: Cân bằng tải.
- **Kubernetes**: Auto-scaling, rolling updates.
- **Chord**: Tự định tuyến khi nút thất bại.
- **LWP**: Giới hạn blocking calls.

## 9. Khả Năng Mở Rộng
- **Auto-scaling**: Kubernetes điều chỉnh tài nguyên.
- **Phân vùng dữ liệu**: PostgreSQL, MongoDB, Kafka, Chord.
- **Hàng đợi**: Redis Queue, RabbitMQ.
- **CDN**: Cloudflare giảm độ trễ.
- **Luồng**: LWP, thread-per-connection/request.

## 10. Bảo Mật
- **Xác thực**:
  - JWT, OAuth 2.0, Keycloak cho người dùng đăng nhập.
  - Không yêu cầu xác thực cho khách (API `/api/stream/guest`).
- **Mã hóa**: HTTPS (Let’s Encrypt), BitLocker, DRM, HMAC-SHA512 (VNPay).
- **Thanh toán**: VNPay-QR (chữ ký, thời hạn 15 phút).
- **Chống tấn công**: Rate Limiting, Windows Firewall.
- **Kiểm soát truy cập**: Kiểm tra `subscriptions` cho phim premium.

## 11. Triển Khai
- **Container hóa**: Docker Desktop.
- **Điều phối**: Kubernetes trên Windows Server với Hyper-V.
- **CI/CD**: GitHub Actions.
- **Phần cứng**: Windows Server với lưu trữ cục bộ.
- **Cấu trúc thư mục**: Tổ chức tại `movie-streaming-app/`.

## 12. API Endpoints
- `POST /api/auth/login`: Trả JWT.
- `GET /api/catalog/movies?region={region}`: Lấy danh mục phim.
- `GET /api/stream/guest/{movie_id}`: Xem phim cho khách.
- `GET /api/stream/{movie_id}`: Xem phim cho người dùng đăng nhập.
- `POST /api/watch_history`: Lưu vị trí xem.
- `GET /api/watch_history`: Lấy lịch sử xem.
- `POST /api/favorites`: Thêm phim yêu thích.
- `GET /api/favorites`: Lấy danh sách yêu thích.
- `POST /api/payment/vnpay`: Tạo mã QR cho gói tháng/năm.
- `POST /api/payment/vnpay/callback`: Xử lý webhook VNPay.
- `POST /api/notifications`: Gửi thông báo.
- `POST /api/content/movies`: Tạo/cập nhật siêu dữ liệu phim.
- `GET /api/content/movies/{uuid}`: Lấy siêu dữ liệu.
- `POST /api/content/upload`: Tải video (nhà cung cấp).

## 13. Thách Thức và Giải Pháp
- **Độ trễ streaming**:
  - Giải pháp: UDP, Cloudflare, Chord, thread-per-connection.
- **Tải cao**:
  - Giải pháp: Kubernetes, RabbitMQ, LWP.
- **Bản quyền**:
  - Giải pháp: DRM, URL ký số.
- **Xung đột dữ liệu**:
  - Giải pháp: Redlock, Optimistic Locking.
- **Mất dữ liệu**:
  - Giải pháp: pg_dump, mongodump, robocopy.
- **Tích hợp nội dung**:
  - Giải pháp: API/SFTP, webhook.
- **Giới hạn khách**:
  - Giải pháp: Redis, IP-based tracking.
- **Phim premium**:
  - Giải pháp: PostgreSQL (`subscriptions`), VNPay-QR.
- **Quản lý mã nguồn**:
  - Giải pháp: Cấu trúc thư mục `movie-streaming-app/`.

## 14. Kế Hoạch Phát Triển
- Tối ưu streaming với QUIC.
- Triển khai Chord đầy đủ cho CDN.
- Tích hợp Redis Pub/Sub cho thông báo.
- Hỗ trợ đa ngôn ngữ cho phụ đề/giao diện.
- Nâng cấp lưu trữ với RAID.
- Thêm quảng cáo động cho màn hình chờ 10 giây.

## 15. Kết Luận
Hệ thống trang web xem phim trực tuyến là nền tảng microservices mạnh mẽ, tích hợp **Kong Gateway**, **Kafka**, **RabbitMQ**, **Nginx/Cloudflare**, và **Chord** để cung cấp dịch vụ phát trực tuyến hiệu quả. **Người dùng khách** xem phim với giới hạn 5 phim/ngày và chờ 10 giây. **Người dùng đăng nhập** theo dõi phim, xem phim premium qua gói tháng/năm với **VNPay-QR**. Lưu trữ cục bộ tại `movie-streaming-app/storage/videos/`, tích hợp nội dung qua **API/SFTP**, admin quản lý siêu dữ liệu qua Django. **Cấu trúc thư mục** tại `movie-streaming-app/` tổ chức rõ ràng, không phụ thuộc đường dẫn tuyệt đối, hỗ trợ phát triển và triển khai trên Windows Server. **Tiến trình nhẹ (LWP)** và **thread-per-connection/request** tối ưu hiệu suất. **Đồng bộ hóa** với Redlock và Optimistic Locking đảm bảo nhất quán. **Sao lưu** với pg_dump, robocopy bảo vệ dữ liệu. Triển khai trên Windows Server với Docker Desktop và Kubernetes, hệ thống đạt độ tin cậy 99.99%, khả năng mở rộng, và trải nghiệm người dùng mượt mà.