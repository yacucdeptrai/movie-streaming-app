# Báo Cáo Hệ Thống Trang Web Xem Phim Trực Tuyến

## 1. Giới Thiệu Hệ Thống

Hệ thống trang web xem phim trực tuyến là một nền tảng phát trực tuyến video, cho phép người dùng xem phim qua trình duyệt web mà không cần đăng nhập hay xác thực. Hệ thống được thiết kế dựa trên kiến trúc microservices, tích hợp các dịch vụ của AWS như Amazon S3, AWS Elemental MediaConvert, và AWS CloudFront để quản lý và phân phối nội dung video. Quản trị viên quản lý nội dung phim bằng cách gọi API trực tiếp, trong khi người dùng truy cập giao diện web để tìm kiếm và xem phim. Hệ thống được triển khai trên Kubernetes tích hợp trong Docker Desktop, sử dụng Kong Ingress Controller để định tuyến và ngrok để expose ra Internet.

### 1.1 Mục Tiêu
- Cung cấp dịch vụ phát trực tuyến video chất lượng cao với định dạng HLS.
- Hỗ trợ quản trị viên upload video và quản lý metadata thông qua API.
- Cho phép người dùng duyệt danh sách phim, tìm kiếm theo từ khóa, và xem phim trực tiếp trên web.
- Bảo vệ nội dung bản quyền bằng presigned URL từ AWS CloudFront.

### 1.2 Ứng Dụng và Lý Do Triển Khai
- **Ứng dụng**: Hệ thống phục vụ việc phát trực tuyến phim theo yêu cầu qua trình duyệt web và quản lý nội dung phim.
- **Lý do triển khai**:
  - Kiến trúc microservices giúp hệ thống dễ mở rộng để đáp ứng tải lớn.
  - AWS CloudFront giảm độ trễ khi phát video, nâng cao hiệu suất.
  - Presigned URL bảo vệ nội dung, ngăn chặn truy cập trái phép.
  - Triển khai trên Docker Desktop và Kubernetes thuận tiện cho phát triển và kiểm thử.

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
  - Ứng dụng một trang hỗ trợ người dùng duyệt danh sách phim, tìm kiếm theo từ khóa, phân trang, xem chi tiết phim.
  - Trình phát video hỗ trợ định dạng HLS, sử dụng thư viện `hls.js`.
  - Tài nguyên tĩnh được phục vụ qua Nginx.
- **Luồng xử lý**:
  - Người dùng truy cập giao diện qua ngrok.
  - Tìm kiếm phim thông qua API `/api/search`.
  - Xem phim bằng presigned URL từ API `/api/stream/{movie_id}`.

#### 2.2.2 Kong Ingress Controller
- **Vai trò**: Định tuyến các yêu cầu từ giao diện người dùng đến các microservices.
- **Triển khai**: Được cài đặt trên Kubernetes, sử dụng `ingressClassName: kong`.

#### 2.2.3 Microservices
- **Search Service**:
  - **Chức năng**: Tìm kiếm nội dung phim từ RDS PostgreSQL, hỗ trợ tìm kiếm theo từ khóa và phân trang.
  - **Công nghệ**: Python/FastAPI.
  - **CORS**: Cho phép origin `http://localhost:8080` và URL ngrok.
  - **Cổng**: 8001.
- **Streaming Service**:
  - **Chức năng**: Quản lý phát video, tạo presigned URL từ S3.
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
  - Lưu trữ metadata phim.
  - Endpoint: `movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com`.
  - Database: `movie_db`.
  - User: `admindb`.

#### 2.2.5 Lưu Trữ
- **Amazon S3**:
  - Bucket `movie-streaming-origin`: Lưu video gốc.
  - Bucket `movie-streaming-dest`: Lưu video đã mã hóa.
  - Quyền truy cập: Sử dụng AWS credentials.

#### 2.2.6 AWS CloudFront
- **Vai trò**: Phân phối video từ S3, sử dụng presigned URL để bảo vệ nội dung.
- **Distribution Domain**: `d1henbbhjbyad4.cloudfront.net`.
- **Key Pair**: Sử dụng private key và key pair ID để tạo presigned URL.

#### 2.2.7 AWS Elemental MediaConvert
- **Vai trò**: Mã hóa video thành định dạng HLS.
- **Tích hợp**: Được gọi bởi `ContentVideo Service` để xử lý video.

### 2.3 Luồng Dữ Liệu
- **Xem phim**:
  1. Người dùng truy cập giao diện web, Frontend gửi yêu cầu `GET /api/search?query={query}&page={page}&limit={limit}` qua Kong Ingress Controller đến `Search Service`.
  2. `Search Service` truy vấn RDS PostgreSQL và trả về danh sách phim.
  3. Người dùng chọn phim, Frontend gửi yêu cầu `GET /api/stream/{movie_id}` qua Kong đến `Streaming Service`.
  4. `Streaming Service` tạo presigned URL từ CloudFront và trả về cho Frontend.
  5. Frontend sử dụng presigned URL để phát video qua trình phát HLS từ CloudFront.
- **Quản lý nội dung**:
  1. Quản trị viên gọi API `POST /api/content/upload` qua Kong đến `ContentVideo Service` bằng lệnh.
  2. `ContentVideo Service` tải video lên S3, gọi AWS Elemental MediaConvert.
  3. MediaConvert mã hóa video thành HLS và lưu vào S3.
  4. `ContentVideo Service` lưu metadata vào RDS PostgreSQL.

## 3. API Endpoints
- **GET `/api/search?query={query}&page={page}&limit={limit}`**:
  - Tìm kiếm phim theo từ khóa, hỗ trợ phân trang.
- **GET `/api/stream/{movie_id}`**:
  - Lấy presigned URL để xem phim.
- **POST `/api/content/upload`**:
  - Tải video lên và lưu metadata, chỉ hỗ trợ gọi qua lệnh.
  - **Hỗ trợ 2 định dạng**:
    - **multipart/form-data**:
      - Payload: Form-data với các trường:
        - `video`: File video.
        - `title`: Tiêu đề phim.
        - `description`: Mô tả phim.
        - `genre`: Thể loại phim.
        - `release_year`: Năm phát hành.
    - **application/json**:
      - Payload: JSON với các trường:
        - `title`: Tiêu đề phim.
        - `description`: Mô tả phim.
        - `video_file`: Tên file video.
        - `genre`: Thể loại phim.
        - `release_year`: Năm phát hành.

## 4. Kết Quả Đạt Được
Hệ thống trang web xem phim trực tuyến đã được triển khai thành công trên Kubernetes tích hợp trong Docker Desktop, sử dụng Kong Ingress Controller để định tuyến và ngrok để expose ra Internet. Các tính năng chính đã hoạt động:
- Người dùng có thể truy cập giao diện web, tìm kiếm phim, và xem phim trực tiếp qua trình phát HLS.
- Quản trị viên có thể upload video qua API `POST /api/content/upload` bằng lệnh:
  - Hỗ trợ `multipart/form-data` để upload file thực tế lên S3 và mã hóa bằng MediaConvert.
  - Hỗ trợ `application/json` để lưu metadata mà không upload file.
  - Metadata phim được lưu vào RDS PostgreSQL.
- Nội dung video được bảo vệ bằng presigned URL từ AWS CloudFront, đảm bảo ngăn chặn truy cập trái phép.
- Hệ thống sử dụng kiến trúc microservices với các dịch vụ độc lập, giao tiếp qua REST APIs.

## 5. Kết Luận
Hệ thống trang web xem phim trực tuyến là một nền tảng microservices tích hợp AWS Elemental MediaConvert và AWS CloudFront để cung cấp dịch vụ phát video chất lượng cao. Người dùng có thể xem phim trực tiếp thông qua presigned URL, và quản trị viên quản lý nội dung qua API bằng lệnh. Hệ thống đã được triển khai thành công trên môi trường cục bộ, đáp ứng các mục tiêu đề ra về phát trực tuyến, bảo mật, và quản lý nội dung. Các bước tiếp theo có thể bao gồm triển khai trên cloud để hỗ trợ tải lớn và kiểm tra hiệu suất thực tế.