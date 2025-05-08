# Thiết Kế Hệ Thống Trang Web Xem Phim Trực Tuyến

## 1. Tổng Quan

Hệ thống trang web xem phim trực tuyến là một nền tảng phát trực tuyến video, hỗ trợ người dùng xem phim qua trình duyệt web mà không cần đăng nhập hay xác thực. Nhà cung cấp nội dung lưu trữ video trên **Amazon S3**, hệ thống sử dụng kiến trúc **microservices**, tích hợp **AWS Elemental MediaConvert** và **AWS CloudFront** với presigned URL, triển khai trên **Windows Server** với **Docker Desktop** và **Kubernetes**.

### 1.1 Mục Tiêu
- Cung cấp dịch vụ phát trực tuyến video.
- Cho phép nhà cung cấp nội dung lưu trữ video trên Amazon S3.
- Hỗ trợ quản trị viên upload video qua API và lưu metadata.
- Cho phép người dùng xem phim trực tiếp qua web.
- Bảo vệ nội dung bản quyền bằng presigned URL.

### 1.2 Ứng Dụng và Lý Do Triển Khai
- **Ứng dụng**:
  - Phát trực tuyến phim theo yêu cầu qua web.
  - Quản lý nội dung phim.
- **Lý do triển khai**:
  - **Khả năng mở rộng**: Microservices đáp ứng tải lớn.
  - **Hiệu suất cao**: AWS CloudFront giảm độ trễ.
  - **Bảo mật**: Presigned URL bảo vệ nội dung.

### 1.3 Yêu Cầu Hệ Thống
#### Yêu Cầu Chức Năng
- **Người dùng**:
  - Duyệt danh mục phim, tìm kiếm và xem phim trực tiếp (hỗ trợ 1080p, sử dụng HLS).
- **Quản trị viên**:
  - Nhận video từ nhà cung cấp qua API.
  - Đẩy video lên Amazon S3, sử dụng AWS Elemental MediaConvert để mã hóa (HLS, 1080p).
  - Quản lý siêu dữ liệu phim qua API.

#### Yêu Cầu Phi Chức Năng
- **Khả năng mở rộng**: Đáp ứng tải lớn (chưa kiểm tra quy mô hàng triệu người dùng).
- **Hiệu suất**: Độ trễ khởi tạo video chưa đo lường.
- **Độ tin cậy**: Chưa kiểm tra.

## 2. Kiến Trúc Hệ Thống

### 2.1 Kiến Trúc Tổng Quan
Hệ thống sử dụng kiến trúc **microservices**, triển khai trên **Windows Server** với **Docker Desktop** và **Kubernetes**. Đã triển khai production với Kong Ingress Controller, sử dụng ngrok free để expose hệ thống ra ngoài Internet.

#### Kiến Trúc Hiện Tại
```
[Người Dùng] --> [Internet]
                |
                v
[ngrok] --> [Kong Ingress Controller]
                |
                v
[Microservices] <--> [PostgreSQL]
       |                   |
       v                   v
[AWS CloudFront] <---- [Amazon S3] <--> [AWS Elemental MediaConvert]
```

### 2.2 Các Thành Phần Chi Tiết

#### 2.2.1 Giao Diện Người Dùng (Frontend)
- **Công nghệ**: React.js, Tailwind CSS v4, hỗ trợ trình duyệt web.
- **Chi tiết**:
  - Ứng dụng một trang (SPA) với danh sách phim, tìm kiếm, phân trang, và chi tiết phim.
  - Trình phát video hỗ trợ HLS (1080p).
  - Tài nguyên tĩnh (CSS, JS) chạy local.
- **Luồng**:
  - Người dùng vào web, tìm kiếm phim, xem chi tiết, và phát video qua presigned URL.
- **Giao thức**: HTTPS.

#### 2.2.2 Kong Ingress Controller
- **Vai trò**: Định tuyến yêu cầu từ frontend đến microservices.
- **Giao thức**: HTTPS.
- **Cấu hình**: Đã triển khai trên Kubernetes bằng Helm, sử dụng `ingressClassName: kong` để định tuyến.
- **Expose trong môi trường local**: Sử dụng ngrok free để expose `kong-kong-proxy` (port-forward 8080 hoặc NodePort 30479).

#### 2.2.3 Microservices
- **Search Service**:
  - **Chức năng**: Tìm kiếm nội dung, truy vấn PostgreSQL, hỗ trợ tìm kiếm theo từ khóa và phân trang.
  - **Công nghệ**: Python/FastAPI.
  - **CORS**: Đã cấu hình để cho phép origin `http://localhost:8080`.
- **Streaming Service**:
  - **Chức năng**: Quản lý phát video, tạo presigned URL từ key S3 (`s3://movie-streaming-dest/{movie_id}/hls/`).
  - **Công nghệ**: Go.
  - **Tích hợp**: AWS CloudFront, S3.
  - **CORS**: Đã cấu hình để cho phép origin `http://localhost:8080`.
- **ContentVideo Service**:
  - **Chức năng**: Tải lên video, gán key S3, gọi AWS Elemental MediaConvert, quản lý metadata.
  - **Công nghệ**: Python/Django.
  - **Tích hợp**: S3, AWS Elemental MediaConvert, PostgreSQL.
  - **CORS**: Đã cấu hình để cho phép origin `http://localhost:8080`.

#### 2.2.4 Cơ Sở Dữ Liệu
- **PostgreSQL**: Lưu siêu dữ liệu phim, hỗ trợ tìm kiếm.

#### 2.2.5 Lưu Trữ
- **Amazon S3**:
  - Bucket `movie-streaming-origin`: Lưu video gốc.
  - Bucket `movie-streaming-dest`: Lưu video đã mã hóa (`{movie_id}/hls/`).
  - Quyền truy cập qua IAM policies.

#### 2.2.6 AWS CloudFront
- **Vai trò**: Phân phối video từ S3, sử dụng presigned URL.

#### 2.2.7 AWS Elemental MediaConvert
- **Vai trò**: Mã hóa video thành HLS (1080p).
- **Tích hợp**: ContentVideo Service gọi API của MediaConvert.

### 2.3 Luồng Dữ Liệu
- **Xem phim**:
  1. `GET /api/search` → ngrok → Kong Ingress Controller → Search Service → PostgreSQL → Trả danh sách phim.
  2. `GET /api/stream/{movie_id}` → ngrok → Kong Ingress Controller → Streaming Service → Trả presigned URL.
  3. Người dùng gọi CloudFront với presigned URL để xem video.
- **Quản lý nội dung**:
  1. Nhà cung cấp gửi video qua `POST /api/content/upload`.
  2. ContentVideo Service tải lên S3 (`movie-streaming-origin/{movie_id}/`), gọi AWS Elemental MediaConvert.
  3. MediaConvert lưu video đã mã hóa vào S3 (`movie-streaming-dest/{movie_id}/hls/`).
  4. ContentVideo Service lưu metadata vào PostgreSQL.

## 3. Cấu Trúc Thư Mục Phát Triển
```
movie-streaming-app/
├── infrastructure/
│   ├── kong/
│   │   ├── search-service-ingress.yaml
│   │   ├── streaming-service-ingress.yaml
│   │   ├── contentvideo-service-ingress.yaml
│   │   └── frontend-ingress.yaml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── kubernetes/
├── microservices/
│   ├── search-service/
│   │   ├── main.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── kubernetes/
│   ├── streaming-service/
│   │   ├── main.go
│   │   ├── Dockerfile
│   │   └── kubernetes/
│   ├── contentvideo-service/
│   │   ├── contentvideo_service/
│   │   ├── api/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── kubernetes/
├── kubernetes/
└── README.md
```

## 4. Triển Khai
- **Container hóa**: Docker Desktop.
- **Điều phối**: Kubernetes trên Windows Server.
- **Định tuyến**: Kong Ingress Controller, sử dụng `ingressClassName: kong`.
- **Expose ra Internet**: Sử dụng ngrok free để expose `kong-kong-proxy`. Chạy `kubectl port-forward svc/kong-kong-proxy 8080:80 -n kong`, sau đó chạy `ngrok http 8080` để lấy URL công khai (ví dụ: `https://abc123.ngrok-free.app`).
- **Khắc phục sự cố**:
  - Nếu gặp lỗi 404 khi gọi API qua Kong proxy, đảm bảo `konghq.com/strip-path: "false"` trong các Ingress rules để giữ nguyên URL khi định tuyến đến microservices.

## 5. API Endpoints
- `GET /api/search?query={query}&page={page}&limit={limit}`: Lấy danh sách phim với tìm kiếm và phân trang.
- `GET /api/stream/{movie_id}`: Lấy presigned URL để xem phim.
- `POST /api/content/upload`: Tải video và lưu metadata.

## 6. Kết Luận
Hệ thống trang web xem phim trực tuyến hiện là nền tảng microservices đơn giản, tích hợp **AWS Elemental MediaConvert** và **AWS CloudFront**. **Người dùng** xem phim trực tiếp qua presigned URL. **Nhà cung cấp nội dung** lưu trữ trên **Amazon S3**, **quản trị viên** upload qua API. Hệ thống đã triển khai production với Kong Ingress Controller và sử dụng ngrok free để expose ra Internet.