# Thiết Kế Hệ Thống Trang Web Xem Phim Trực Tuyến (Bản Cập Nhật)

## 1. Tổng Quan

Hệ thống trang web xem phim trực tuyến là một nền tảng phát trực tuyến video chất lượng cao, hỗ trợ hàng triệu người dùng qua trình duyệt web. Người dùng truy cập web để xem phim mà không cần đăng nhập hay xác thực. Nhà cung cấp nội dung lưu trữ video trên **Amazon S3**, quản trị viên quản lý nội dung qua giao diện web. Hệ thống sử dụng kiến trúc **microservices**, tích hợp **ELB**, **Kong Gateway**, và **AWS Elemental MediaConvert**, triển khai trên **Windows Server**, đạt độ tin cậy 99.99%. Nội dung được phân phối qua **AWS CloudFront** với presigned URL.

### 1.1 Mục Tiêu
- Cung cấp dịch vụ phát trực tuyến video với độ trễ khởi tạo dưới 2 giây.
- Cho phép nhà cung cấp nội dung lưu trữ video trên Amazon S3.
- Hỗ trợ quản trị viên quản lý video và siêu dữ liệu phim.
- Cho phép người dùng xem phim trực tiếp qua web.
- Bảo vệ nội dung bản quyền.

### 1.2 Ứng Dụng và Lý Do Triển Khai
- **Ứng dụng**:
  - Phát trực tuyến phim theo yêu cầu qua web.
  - Quản lý nội dung phim.
- **Lý do triển khai**:
  - **Khả năng mở rộng**: Microservices và ELB đáp ứng tải lớn.
  - **Hiệu suất cao**: AWS CloudFront giảm độ trễ.
  - **Độ tin cậy**: ELB đảm bảo chịu lỗi.
  - **Bảo mật**: DRM và presigned URL bảo vệ nội dung.
  - **Tích hợp bên thứ ba**: AWS Elemental MediaConvert và CloudFront.

### 1.3 Yêu Cầu Hệ Thống
#### Yêu Cầu Chức Năng
- **Người dùng**:
  - Duyệt danh mục phim, tìm kiếm và xem phim trực tiếp.
  - Phát video ở các độ phân giải (480p, 720p, 1080p, 4K) với bitrate thích ứng (HLS/DASH).
  - Hỗ trợ phụ đề đa ngôn ngữ, nhiều bản âm thanh, điều chỉnh chất lượng.
- **Quản trị viên**:
  - Nhận video từ nhà cung cấp qua API/SFTP.
  - Đẩy video lên Amazon S3, sử dụng AWS Elemental MediaConvert để mã hóa.
  - Quản lý siêu dữ liệu phim qua giao diện web.
- **Nhà cung cấp nội dung**:
  - Lưu trữ video trên Amazon S3 qua presigned URL.

#### Yêu Cầu Phi Chức Năng
- **Khả năng mở rộng**: Hỗ trợ hàng triệu người dùng đồng thời.
- **Hiệu suất**: Độ trễ khởi tạo video dưới 2 giây, chuyển đổi bitrate mượt mà.
- **Độ tin cậy**: Đạt 99.99% thời gian hoạt động.
- **Bảo mật**: Bảo vệ nội dung bản quyền.

## 2. Kiến Trúc Hệ Thống

### 2.1 Kiến Trúc Tổng Quan
Hệ thống sử dụng kiến trúc **microservices**, triển khai trên **Windows Server** với **Docker Desktop** và **Kubernetes**. Các thành phần chính bao gồm **ELB**, **Kong Gateway**, **microservices**, **AWS CloudFront**, và **AWS Elemental MediaConvert**. Video và tài nguyên lưu trên **Amazon S3**, mã hóa bởi **AWS Elemental MediaConvert**, phân phối qua **AWS CloudFront** với presigned URL.

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
- **Công nghệ**: React.js, Tailwind CSS, hỗ trợ trình duyệt web (Chrome, Edge, Firefox).
- **Chi tiết**:
  - Ứng dụng một trang (SPA) với prefetching siêu dữ liệu phim.
  - Trình phát video hỗ trợ HLS/DASH, tích hợp DRM.
  - Tài nguyên tĩnh (hình ảnh, CSS, JS) lưu trên Amazon S3, phân phối qua AWS CloudFront.
  - Người dùng: Duyệt danh mục phim, tìm kiếm, và xem phim trực tiếp qua presigned URL.
- **Luồng**:
  - Người dùng vào web, chọn phim, nhận presigned URL để xem.
- **Giao thức**: HTTPS.

#### 2.2.2 ELB (Elastic Load Balancer)
- **Vai trò**: Cân bằng tải, chuyển tiếp yêu cầu từ người dùng/quản trị viên đến Kong Gateway.
- **Giao thức**: HTTPS.

#### 2.2.3 Kong Gateway (API Gateway)
- **Vai trò**: Định tuyến yêu cầu từ frontend đến microservices.
- **Giao thức**: HTTPS.
- **Cấu hình**: Chạy trên Kubernetes với Docker Desktop.

#### 2.2.4 Microservices
- **Search Service**:
  - **Chức năng**: Tìm kiếm nội dung, truy vấn PostgreSQL.
  - **Công nghệ**: Python/FastAPI.
- **Streaming Service**:
  - **Chức năng**: Quản lý phát video, tạo presigned URL từ key S3 (`s3://bucket/videos/{movie_id}/`).
  - **Công nghệ**: Go.
  - **Tích hợp**: AWS CloudFront, S3.
- **ContentVideo Service**:
  - **Chức năng**: Tải lên video, gán key S3, gọi AWS Elemental MediaConvert, quản lý metadata.
  - **Công nghệ**: Python/Django.
  - **Tích hợp**: S3, AWS Elemental MediaConvert, PostgreSQL.

#### 2.2.5 Cơ Sở Dữ Liệu
- **PostgreSQL**: Lưu siêu dữ liệu phim, hỗ trợ tìm kiếm.

#### 2.2.6 Lưu Trữ
- **Amazon S3**:
  - Lưu video, hình ảnh, phụ đề, tài nguyên tĩnh với key dựa trên `movie_id` (ví dụ: `s3://bucket/videos/{movie_id}/`).
  - Tích hợp API/SFTP từ nhà cung cấp nội dung qua presigned URL.
  - Mã hóa tại rest bằng AWS KMS.
  - Quyền truy cập qua IAM policies.

#### 2.2.7 AWS CloudFront
- **Vai trò**: Phân phối nội dung (video, hình ảnh, tài nguyên tĩnh) từ S3, giảm độ trễ.
- **Tích hợp**: Lấy nội dung từ S3 với presigned URL, caching tại edge.

#### 2.2.8 AWS Elemental MediaConvert
- **Vai trò**: Mã hóa video thành định dạng HLS/DASH, áp dụng DRM.
- **Tích hợp**: ContentVideo Service gọi API của MediaConvert để xử lý video.

### 2.3 Luồng Dữ Liệu
- **Xem phim**:
  1. `GET /api/stream/{movie_id}` → ELB → Kong Gateway → Streaming Service.
  2. Streaming Service tạo presigned URL từ key S3 (`s3://bucket/videos/{movie_id}/`).
  3. Người dùng gọi CloudFront với presigned URL để xem video.
- **Quản lý nội dung**:
  1. Nhà cung cấp gửi video qua API/SFTP đến S3.
  2. ContentVideo Service tải lên S3 (bucket gốc, `s3://bucket/origin/{movie_id}/`), gọi AWS Elemental MediaConvert.
  3. MediaConvert lưu video đã mã hóa vào S3 (bucket đích, `s3://bucket/dest/{movie_id}/`).
  4. ContentVideo Service lưu metadata vào PostgreSQL.

### 2.4 Quy Trình Quản Lý Nội Dung
- **Nguồn Gốc Video**:
  - Phương thức: Nhà cung cấp lưu trữ video trên Amazon S3 qua presigned URL (API/SFTP).
  - Cơ chế:
    1. Nhà cung cấp gửi video qua `POST /api/content/upload` hoặc SFTP.
    2. ContentVideo Service gán key S3 (`s3://bucket/origin/{movie_id}/`).
    3. ContentVideo Service tải video lên S3 (bucket gốc).
    4. ContentVideo Service gọi AWS Elemental MediaConvert để mã hóa (HLS/DASH, DRM).
    5. MediaConvert lưu video đã mã hóa vào S3 (bucket đích).
    6. Gửi thông báo cho quản trị viên.
- **Cập Nhật Siêu Dữ Liệu**:
  - Quản trị viên nhập siêu dữ liệu qua Django.
  - Lưu vào PostgreSQL.

## 3. Cấu Trúc Thư Mục Phát Triển
```
movie-streaming-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── kubernetes/
├── microservices/
│   ├── search-service/
│   ├── streaming-service/
│   ├── contentvideo-service/
│   │   ├── src/
│   │   │   ├── aws-mediaconvert.js  # Tích hợp AWS Elemental MediaConvert
│   │   │   └── main.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── kubernetes/
├── storage/
│   ├── s3-config/  # Cấu hình S3 (IAM, bucket policies)
│   ├── s3-backup/  # Script sao lưu lên S3
├── databases/
│   ├── postgresql/
├── infrastructure/
│   ├── elb/
│   ├── kong/
├── scripts/
├── docs/
├── .gitignore
├── docker-compose.yml
├── kubernetes/
└── README.md
```

## 4. Triển Khai
- **Container hóa**: Docker Desktop.
- **Điều phối**: Kubernetes trên Windows Server.
- **Phần cứng**: Windows Server với kết nối S3 và AWS Elemental MediaConvert.

## 5. Sao Lưu
- **Database Backup**:
  - Sử dụng `pg_dump` (PostgreSQL).
  - Lưu bản sao vào S3.
  - Ví dụ:
    ```cmd
    pg_dump -U postgres dbname > temp.sql
    aws s3 cp temp.sql s3://backup-bucket/db-%DATE:~-4%%DATE:~4,2%%DATE:~7,2%.sql
    ```
- **S3 Backup**:
  - Sử dụng S3 versioning và cross-region replication.
- **Automated Backup**:
  - Windows Task Scheduler chạy script sao lưu lên S3.

## 6. API Endpoints
- `GET /api/stream/{movie_id}`: Lấy presigned URL để xem phim.
- `POST /api/content/movies`: Tạo/cập nhật siêu dữ liệu phim.
- `GET /api/content/movies/{movie_id}`: Lấy siêu dữ liệu.
- `POST /api/content/upload`: Tải video.

## 7. Kết Luận
Hệ thống trang web xem phim trực tuyến là nền tảng microservices đơn giản, tích hợp **ELB**, **Kong Gateway**, **AWS Elemental MediaConvert**, và **AWS CloudFront**. **Người dùng** xem phim trực tiếp qua presigned URL. **Nhà cung cấp nội dung** lưu trữ trên **Amazon S3**, **quản trị viên** quản lý qua Django. **Cấu trúc thư mục** tại `movie-streaming-app/` hỗ trợ phát triển và triển khai trên Windows Server. Việc sử dụng key S3 dựa trên `movie_id` và presigned URL giúp đơn giản hóa kiến trúc, giảm độ trễ và chi phí.