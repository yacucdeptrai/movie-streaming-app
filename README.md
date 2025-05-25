# Báo Cáo Hệ Thống Trang Web Xem Phim Trực Tuyến

## 1. Giới Thiệu Hệ Thống

Hệ thống trang web xem phim trực tuyến là một nền tảng phát trực tuyến video, cho phép người dùng xem phim qua trình duyệt web mà không cần đăng nhập hay xác thực. Hệ thống được thiết kế dựa trên kiến trúc microservices, tích hợp các dịch vụ của AWS như Amazon S3, AWS Elemental MediaConvert, và AWS CloudFront để quản lý và phân phối nội dung video. Nhà cung cấp nội dung lưu trữ video trên Amazon S3, trong khi quản trị viên quản lý metadata phim thông qua API. Hệ thống được triển khai trên Kubernetes tích hợp trong Docker Desktop, sử dụng Kong Ingress Controller để định tuyến và ngrok để expose ra Internet. Code hệ thống đã được đẩy lên GitHub và triển khai thành công trên nhiều máy khác nhau.

### 1.1 Mục Tiêu
- Cung cấp dịch vụ phát trực tuyến video chất lượng cao với định dạng HLS (1080p).
- Cho phép nhà cung cấp nội dung lưu trữ video trên Amazon S3.
- Hỗ trợ quản trị viên upload video qua API và lưu metadata vào cơ sở dữ liệu.
- Cho phép người dùng duyệt danh sách phim, tìm kiếm theo từ khóa, và xem phim trực tiếp trên web.
- Bảo vệ nội dung bản quyền bằng presigned URL từ AWS CloudFront.

### 1.2 Ứng Dụng và Lý Do Triển Khai
- **Ứng dụng**: Hệ thống phục vụ việc phát trực tuyến phim theo yêu cầu qua trình duyệt web và quản lý nội dung phim (tải lên, mã hóa, lưu trữ metadata).
- **Lý do triển khai**:
  - Kiến trúc microservices giúp hệ thống dễ mở rộng để đáp ứng tải lớn.
  - AWS CloudFront giảm độ trễ khi phát video, nâng cao hiệu suất.
  - Presigned URL bảo vệ nội dung, ngăn chặn truy cập trái phép.
  - Triển khai trên Docker Desktop và Kubernetes thuận tiện cho phát triển, kiểm thử, và triển khai trên nhiều máy.

## 2. Kiến Trúc Hệ Thống

Hệ thống được xây dựng dựa trên kiến trúc microservices, triển khai trên môi trường cục bộ sử dụng Docker Desktop và Kubernetes. Kong Ingress Controller đảm nhiệm định tuyến yêu cầu, và ngrok được sử dụng để expose hệ thống ra Internet.

### 2.1 Sơ Đồ Kiến Trúc
```
[Người Dùng] --> [Internet]
                |
                v
[ngrok] --> [Kong Ingress Controller]
                |
                v
[Microservices] <--> [Amazon RDS PostgreSQL]
       |                   |
       v                   v
[AWS CloudFront] <---- [Amazon S3] <--> [AWS Elemental MediaConvert]
```

### 2.2 Các Thành Phần Chính

#### 2.2.1 Giao Diện Người Dùng (Frontend)
- **Công nghệ**: React.js, Tailwind CSS v4.
- **Chức năng**:
  - Ứng dụng một trang (SPA) hỗ trợ người dùng duyệt danh sách phim, tìm kiếm theo từ khóa, phân trang, xem chi tiết phim.
  - Trình phát video hỗ trợ định dạng HLS (1080p), sử dụng thư viện `hls.js`.
  - Tài nguyên tĩnh (CSS, JS) được phục vụ qua Nginx.
- **Luồng xử lý**:
  - Người dùng truy cập giao diện qua `http://localhost:8080` hoặc URL ngrok.
  - Tìm kiếm phim thông qua API `/api/search`.
  - Xem phim bằng presigned URL từ API `/api/stream/{movie_id}`.
- **Giao thức**: HTTPS (qua ngrok).

#### 2.2.2 Kong Ingress Controller
- **Vai trò**: Định tuyến các yêu cầu từ giao diện người dùng đến các microservices.
- **Giao thức**: HTTPS.
- **Triển khai**: Được cài đặt trên Kubernetes, sử dụng `ingressClassName: kong`.

#### 2.2.3 Microservices
- **Search Service**:
  - **Chức năng**: Tìm kiếm nội dung phim từ RDS PostgreSQL, hỗ trợ tìm kiếm theo từ khóa và phân trang.
  - **Công nghệ**: Python/FastAPI.
  - **CORS**: Cho phép origin `http://localhost:8080` và URL ngrok.
  - **Cổng**: 8001.
- **Streaming Service**:
  - **Chức năng**: Quản lý phát video, tạo presigned URL từ S3 (`s3://movie-streaming-dest/{movie_id}/hls/`).
  - **Công nghệ**: Go.
  - **Tích hợp**: AWS CloudFront, Amazon S3.
  - **CORS**: Cho phép origin `http://localhost:8080` và URL ngrok.
  - **Cổng**: 8002.
- **ContentVideo Service**:
  - **Chức năng**: Xử lý upload video lên S3, gọi AWS Elemental MediaConvert để mã hóa, và quản lý metadata phim.
  - **Công nghệ**: Python/Django.
  - **Tích hợp**: Amazon S3, AWS Elemental MediaConvert, RDS PostgreSQL.
  - **CORS**: Cho phép origin `http://localhost:8080` và URL ngrok.
  - **Cổng**: 8003.

#### 2.2.4 Cơ Sở Dữ Liệu
- **Amazon RDS PostgreSQL**:
  - Lưu trữ metadata phim (tên, mô tả, thể loại, năm phát hành, v.v.).
  - Endpoint: `movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com`.
  - Database: `movie_db`.
  - User: `admindb`.

#### 2.2.5 Lưu Trữ
- **Amazon S3**:
  - Bucket `movie-streaming-origin`: Lưu video gốc (`{movie_id}/input/`).
  - Bucket `movie-streaming-dest`: Lưu video đã mã hóa (`{movie_id}/hls/`).
  - Quyền truy cập: Sử dụng AWS credentials (lưu trong Kubernetes Secrets).

#### 2.2.6 AWS CloudFront
- **Vai trò**: Phân phối video từ S3, sử dụng presigned URL để bảo vệ nội dung.
- **Distribution Domain**: `d1henbbhjbyad4.cloudfront.net`.
- **Key Pair**: Sử dụng private key và key pair ID để tạo presigned URL.

#### 2.2.7 AWS Elemental MediaConvert
- **Vai trò**: Mã hóa video thành định dạng HLS (1080p).
- **Tích hợp**: Được gọi bởi `ContentVideo Service` để xử lý video.

### 2.3 Luồng Dữ Liệu
- **Xem phim**:
  1. Người dùng truy cập giao diện web, Frontend gửi yêu cầu `GET /api/search?query={query}&page={page}&limit={limit}` qua Kong Ingress Controller đến `Search Service`.
  2. `Search Service` truy vấn RDS PostgreSQL và trả về danh sách phim.
  3. Người dùng chọn phim, Frontend gửi yêu cầu `GET /api/stream/{movie_id}` qua Kong đến `Streaming Service`.
  4. `Streaming Service` tạo presigned URL từ CloudFront và trả về cho Frontend.
  5. Frontend sử dụng presigned URL để phát video qua trình phát HLS từ CloudFront.
- **Quản lý nội dung**:
  1. Quản trị viên gửi video qua API `POST /api/content/upload` đến `ContentVideo Service` thông qua Kong.
  2. `ContentVideo Service` tải video lên S3 (`movie-streaming-origin/{movie_id}/input/`), gọi AWS Elemental MediaConvert.
  3. MediaConvert mã hóa video thành HLS (1080p) và lưu vào S3 (`movie-streaming-dest/{movie_id}/hls/`).
  4. `ContentVideo Service` lưu metadata vào RDS PostgreSQL.

## 3. API Endpoints
- **GET `/api/search?query={query}&page={page}&limit={limit}`**:
  - Tìm kiếm phim theo từ khóa, hỗ trợ phân trang.
- **GET `/api/stream/{movie_id}`**:
  - Lấy presigned URL để xem phim.
- **POST `/api/content/upload`**:
  - Tải video lên và lưu metadata.
  - **Hỗ trợ 2 định dạng**:
    - **multipart/form-data**:
      - Payload: Form-data với các trường:
        - `video`: File video.
        - `title`: Tiêu đề phim.
        - `description`: Mô tả phim.
        - `genre`: Thể loại phim (không bắt buộc).
        - `release_year`: Năm phát hành (không bắt buộc).
    - **application/json** (chỉ lưu metadata):
      - Payload: JSON với các trường:
        - `title`: Tiêu đề phim.
        - `description`: Mô tả phim.
        - `video_file`: Tên file video (không upload file thực tế).
        - `genre`: Thể loại phim (không bắt buộc).
        - `release_year`: Năm phát hành (không bắt buộc).

## 4. Kết Quả Đạt Được
Hệ thống trang web xem phim trực tuyến đã được triển khai thành công trên Kubernetes tích hợp trong Docker Desktop, sử dụng Kong Ingress Controller để định tuyến và ngrok để expose ra Internet. Code hệ thống đã được đẩy lên GitHub và triển khai trên nhiều máy khác nhau. Các tính năng chính đã hoạt động:
- Người dùng có thể truy cập giao diện web, tìm kiếm phim, và xem phim trực tiếp qua trình phát HLS với chất lượng 1080p.
- Quản trị viên có thể upload video qua API `POST /api/content/upload`:
  - Hỗ trợ `multipart/form-data` để upload file thực tế lên S3 và mã hóa bằng MediaConvert.
  - Hỗ trợ `application/json` để lưu metadata mà không upload file.
  - Metadata phim (bao gồm `title`, `description`, `genre`, `release_year`) được lưu vào RDS PostgreSQL.
- Nội dung video được bảo vệ bằng presigned URL từ AWS CloudFront, đảm bảo ngăn chặn truy cập trái phép.
- Hệ thống sử dụng kiến trúc microservices với các dịch vụ độc lập (`Search Service`, `Streaming Service`, `ContentVideo Service`), giao tiếp qua REST APIs (HTTPS).

## 5. Kết Luận
Hệ thống trang web xem phim trực tuyến là một nền tảng microservices tích hợp AWS Elemental MediaConvert và AWS CloudFront để cung cấp dịch vụ phát video chất lượng cao. Người dùng có thể xem phim trực tiếp thông qua presigned URL, nhà cung cấp nội dung lưu trữ video trên Amazon S3, và quản trị viên quản lý nội dung qua API. Hệ thống đã được triển khai thành công trên môi trường cục bộ trên nhiều máy, với code được quản lý trên GitHub, đáp ứng các mục tiêu đề ra về phát trực tuyến, bảo mật, và quản lý nội dung. Các bước tiếp theo có thể bao gồm triển khai trên cloud (như AWS EKS) để hỗ trợ tải lớn và kiểm tra hiệu suất thực tế.