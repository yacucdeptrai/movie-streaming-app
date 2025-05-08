# Thiết Kế Hệ Thống Trang Web Xem Phim Trực Tuyến

## 1. Tổng Quan

Hệ thống trang web xem phim trực tuyến là một nền tảng phát trực tuyến video, hỗ trợ người dùng xem phim qua trình duyệt web mà không cần đăng nhập hay xác thực. Nhà cung cấp nội dung lưu trữ video trên **Amazon S3**, hệ thống sử dụng kiến trúc **microservices**, tích hợp **AWS Elemental MediaConvert** và **AWS CloudFront** với presigned URL, triển khai trên **Windows Server** với **Docker Desktop** và **Kubernetes**.

### 1.1 Mục Tiêu
- Cung cấp dịch vụ phát trực tuyến video (độ trễ khởi tạo chưa đo lường, mục tiêu dưới 2 giây).
- Cho phép nhà cung cấp nội dung lưu trữ video trên Amazon S3.
- Hỗ trợ quản trị viên upload video qua API và lưu metadata (chưa có giao diện web đầy đủ).
- Cho phép người dùng xem phim trực tiếp qua web.
- Bảo vệ nội dung bản quyền bằng presigned URL.

### 1.2 Ứng Dụng và Lý Do Triển Khai
- **Ứng dụng**:
  - Phát trực tuyến phim theo yêu cầu qua web.
  - Quản lý nội dung phim.
- **Lý do triển khai**:
  - **Khả năng mở rộng**: Microservices đáp ứng tải lớn (chưa kiểm tra quy mô hàng triệu người dùng).
  - **Hiệu suất cao**: AWS CloudFront giảm độ trễ.
  - **Bảo mật**: Presigned URL bảo vệ nội dung.

### 1.3 Yêu Cầu Hệ Thống
#### Yêu Cầu Chức Năng
- **Người dùng**:
  - Duyệt danh mục phim, tìm kiếm và xem phim trực tiếp (hiện hỗ trợ 1080p, chưa có ABR, phụ đề, điều chỉnh chất lượng).
  - Kế hoạch: Hỗ trợ các độ phân giải 480p, 720p, 4K với bitrate thích ứng (HLS/DASH), tích hợp phụ đề đa ngôn ngữ, điều chỉnh chất lượng.
- **Quản trị viên**:
  - Nhận video từ nhà cung cấp qua API (chưa có SFTP).
  - Đẩy video lên Amazon S3, sử dụng AWS Elemental MediaConvert để mã hóa (HLS, 1080p).
  - Quản lý siêu dữ liệu phim qua API (chưa có giao diện web).
  - Kế hoạch: Hỗ trợ upload qua SFTP, phát triển giao diện web quản trị viên để quản lý nội dung.

#### Yêu Cầu Phi Chức Năng
- **Khả năng mở rộng**: Chưa kiểm tra quy mô hàng triệu người dùng, mục tiêu hỗ trợ hàng triệu người dùng đồng thời.
- **Hiệu suất**: Độ trễ khởi tạo video chưa đo lường, mục tiêu dưới 2 giây.
- **Độ tin cậy**: Chưa kiểm tra, mục tiêu đạt 99.99% thời gian hoạt động.

## 2. Kiến Trúc Hệ Thống

### 2.1 Kiến Trúc Tổng Quan
Hệ thống sử dụng kiến trúc **microservices**, triển khai trên **Windows Server** với **Docker Desktop** và **Kubernetes**. Hiện tại dùng port forwarding để test, chưa triển khai ELB và Kong Gateway (kế hoạch triển khai production).

#### Trạng Thái Hiện Tại
```
[Người Dùng] --> [Internet]
                |
                v
[Port Forwarding]
                |
                v
[Microservices] <--> [PostgreSQL]
       |                   |
       v                   v
[AWS CloudFront] <---- [Amazon S3] <--> [AWS Elemental MediaConvert]
```

#### Kế Hoạch Triển Khai Production
```
[Người Dùng] --> [Internet]
                |
                v
[ELB] --> [Kong Gateway]
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
  - Trình phát video hỗ trợ HLS (1080p), chưa hỗ trợ DASH.
  - Tài nguyên tĩnh (CSS, JS) hiện chạy local, chưa lưu trên Amazon S3.
- **Luồng**:
  - Người dùng vào web, tìm kiếm phim, xem chi tiết, và phát video qua presigned URL.
- **Kế hoạch**:
  - Hỗ trợ DASH, tích hợp phụ đề đa ngôn ngữ, điều chỉnh chất lượng video.
  - Lưu tài nguyên tĩnh (CSS, JS) trên S3, phân phối qua CloudFront.
- **Giao thức**: HTTPS.

#### 2.2.2 ELB (Elastic Load Balancer) - Chưa Triển Khai
- **Vai trò**: Cân bằng tải, chuyển tiếp yêu cầu từ người dùng/quản trị viên đến Kong Gateway.
- **Giao thức**: HTTPS.
- **Kế hoạch**: Triển khai ELB để đảm bảo khả năng mở rộng và độ tin cậy.

#### 2.2.3 Kong Gateway (API Gateway) - Chưa Triển Khai
- **Vai trò**: Định tuyến yêu cầu từ frontend đến microservices.
- **Giao thức**: HTTPS.
- **Kế hoạch**: Triển khai trên Kubernetes, cấu hình định tuyến API.

#### 2.2.4 Microservices
- **Search Service**:
  - **Chức năng**: Tìm kiếm nội dung, truy vấn PostgreSQL, hỗ trợ tìm kiếm theo từ khóa và phân trang.
  - **Công nghệ**: Python/FastAPI.
  - **Kế hoạch**: Thêm tính năng lọc theo thể loại, năm sản xuất.
- **Streaming Service**:
  - **Chức năng**: Quản lý phát video, tạo presigned URL từ key S3 (`s3://movie-streaming-dest/{movie_id}/hls/`).
  - **Công nghệ**: Go.
  - **Tích hợp**: AWS CloudFront, S3.
  - **Kế hoạch**: Hỗ trợ nhiều độ phân giải (480p, 720p, 4K) và bitrate thích ứng.
- **ContentVideo Service**:
  - **Chức năng**: Tải lên video, gán key S3, gọi AWS Elemental MediaConvert, quản lý metadata.
  - **Công nghệ**: Python/Django.
  - **Tích hợp**: S3, AWS Elemental MediaConvert, PostgreSQL.
  - **Kế hoạch**: Hỗ trợ upload qua SFTP, thêm API để cập nhật/xóa metadata.

#### 2.2.5 Cơ Sở Dữ Liệu
- **PostgreSQL**: Lưu siêu dữ liệu phim, hỗ trợ tìm kiếm.
- **Kế hoạch**: Triển khai sao lưu tự động bằng `pg_dump`, lưu bản sao lên S3.

#### 2.2.6 Lưu Trữ
- **Amazon S3**:
  - Bucket `movie-streaming-origin`: Lưu video gốc.
  - Bucket `movie-streaming-dest`: Lưu video đã mã hóa (`{movie_id}/hls/`).
  - Quyền truy cập qua IAM policies.
- **Kế hoạch**: Triển khai S3 versioning và cross-region replication để sao lưu.

#### 2.2.7 AWS CloudFront
- **Vai trò**: Phân phối video từ S3, sử dụng presigned URL.

#### 2.2.8 AWS Elemental MediaConvert
- **Vai trò**: Mã hóa video thành HLS (1080p).
- **Tích hợp**: ContentVideo Service gọi API của MediaConvert.
- **Kế hoạch**: Cập nhật Job Template để hỗ trợ nhiều độ phân giải (480p, 720p, 4K) và bitrate thích ứng.

### 2.3 Luồng Dữ Liệu
#### Trạng Thái Hiện Tại
- **Xem phim**:
  1. `GET /api/search` → Port Forwarding → Search Service → PostgreSQL → Trả danh sách phim.
  2. `GET /api/stream/{movie_id}` → Port Forwarding → Streaming Service → Trả presigned URL.
  3. Người dùng gọi CloudFront với presigned URL để xem video.
- **Quản lý nội dung**:
  1. Nhà cung cấp gửi video qua `POST /api/content/upload`.
  2. ContentVideo Service tải lên S3 (`movie-streaming-origin/{movie_id}/`), gọi AWS Elemental MediaConvert.
  3. MediaConvert lưu video đã mã hóa vào S3 (`movie-streaming-dest/{movie_id}/hls/`).
  4. ContentVideo Service lưu metadata vào PostgreSQL.

#### Kế Hoạch Triển Khai Production
- **Xem phim**:
  1. `GET /api/search` → ELB → Kong Gateway → Search Service → PostgreSQL → Trả danh sách phim.
  2. `GET /api/stream/{movie_id}` → ELB → Kong Gateway → Streaming Service → Trả presigned URL.
  3. Người dùng gọi CloudFront với presigned URL để xem video.
- **Quản lý nội dung**:
  1. Nhà cung cấp gửi video qua `POST /api/content/upload` hoặc SFTP.
  2. ContentVideo Service xử lý upload, mã hóa, và lưu metadata.
  3. Quản trị viên quản lý nội dung qua giao diện web.

## 3. Cấu Trúc Thư Mục Phát Triển
```
movie-streaming-app/
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
- **Điều phối**: Kubernetes trên Windows Server (hiện dùng port forwarding để test).
- **Kế hoạch**:
  - Triển khai production với ELB và Kong Gateway.
  - Cấu hình domain thực tế (ví dụ: `https://your-movie-app.com`).
  - Lưu tài nguyên tĩnh của frontend (CSS, JS) trên S3, phân phối qua CloudFront.

## 5. Sao Lưu - Chưa Triển Khai
- **Database Backup**:
  - Sử dụng `pg_dump` (PostgreSQL).
  - Lưu bản sao vào S3.
  - Ví dụ:
    ```
    pg_dump -U postgres dbname > temp.sql
    aws s3 cp temp.sql s3://backup-bucket/db-%DATE:~-4%%DATE:~4,2%%DATE:~7,2%.sql
    ```
- **S3 Backup**:
  - Sử dụng S3 versioning và cross-region replication.
- **Automated Backup**:
  - Windows Task Scheduler chạy script sao lưu lên S3.

## 6. API Endpoints
### Đã Triển Khai
- `GET /api/search?query={query}&page={page}&limit={limit}`: Lấy danh sách phim với tìm kiếm và phân trang.
- `GET /api/stream/{movie_id}`: Lấy presigned URL để xem phim.
- `POST /api/content/upload`: Tải video và lưu metadata.

### Kế Hoạch Triển Khai
- `POST /api/content/movies`: Tạo/cập nhật siêu dữ liệu phim.
- `GET /api/content/movies/{movie_id}`: Lấy siêu dữ liệu phim.

## 7. Kết Luận
Hệ thống trang web xem phim trực tuyến hiện là nền tảng microservices đơn giản, tích hợp **AWS Elemental MediaConvert** và **AWS CloudFront**. **Người dùng** xem phim trực tiếp qua presigned URL. **Nhà cung cấp nội dung** lưu trữ trên **Amazon S3**, **quản trị viên** upload qua API (chưa có giao diện web). Hệ thống chạy trong môi trường development, cần triển khai production với ELB và Kong Gateway để đạt khả năng mở rộng và độ tin cậy.