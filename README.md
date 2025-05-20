# Thiết Kế Hệ Thống Trang Web Xem Phim Trực Tuyến

## 1. Tổng Quan

Hệ thống trang web xem phim trực tuyến là một nền tảng phát trực tuyến video, hỗ trợ người dùng xem phim qua trình duyệt web mà không cần đăng nhập hay xác thực. Nhà cung cấp nội dung lưu trữ video trên **Amazon S3**, hệ thống sử dụng kiến trúc **microservices**, tích hợp **AWS Elemental MediaConvert** và **AWS CloudFront** với presigned URL để bảo vệ nội dung. Hệ thống được triển khai trên **Windows Server** hoặc máy cục bộ sử dụng **Docker Desktop** và **Kubernetes**, với **Kong Ingress Controller** để định tuyến và **ngrok** để expose ra Internet.

### 1.1 Mục Tiêu
- Cung cấp dịch vụ phát trực tuyến video chất lượng cao (hỗ trợ HLS, 1080p).
- Cho phép nhà cung cấp nội dung lưu trữ video trên Amazon S3.
- Hỗ trợ quản trị viên upload video qua API và lưu metadata vào cơ sở dữ liệu.
- Cho phép người dùng duyệt danh sách phim, tìm kiếm và xem phim trực tiếp qua web.
- Bảo vệ nội dung bản quyền bằng presigned URL từ AWS CloudFront.

### 1.2 Ứng Dụng và Lý Do Triển Khai
- **Ứng dụng**:
  - Phát trực tuyến phim theo yêu cầu qua trình duyệt web.
  - Quản lý nội dung phim (tải lên, mã hóa, lưu trữ metadata).
- **Lý do triển khai**:
  - **Khả năng mở rộng**: Kiến trúc microservices dễ dàng mở rộng để đáp ứng tải lớn.
  - **Hiệu suất cao**: AWS CloudFront giảm độ trễ khi phát video.
  - **Bảo mật**: Presigned URL bảo vệ nội dung, ngăn chặn truy cập trái phép.
  - **Dễ triển khai**: Sử dụng Docker Desktop và Kubernetes trên môi trường cục bộ hoặc Windows Server để phát triển và kiểm thử.

### 1.3 Yêu Cầu Hệ Thống
#### Yêu Cầu Chức Năng
- **Người dùng**:
  - Duyệt danh mục phim, tìm kiếm theo từ khóa, phân trang, và xem chi tiết phim.
  - Xem phim trực tiếp qua trình phát video (hỗ trợ HLS, 1080p).
- **Quản trị viên**:
  - Tải video lên qua API (`POST /api/content/upload`).
  - Đẩy video lên Amazon S3, sử dụng AWS Elemental MediaConvert để mã hóa (HLS, 1080p).
  - Quản lý siêu dữ liệu phim (lưu vào PostgreSQL).

#### Yêu Cầu Phi Chức Năng
- **Khả năng mở rộng**: Hệ thống microservices có thể mở rộng để đáp ứng tải lớn (chưa kiểm tra quy mô hàng triệu người dùng).
- **Hiệu suất**: Độ trễ khởi tạo video cần dưới 5 giây (chưa đo lường chính thức).
- **Độ tin cậy**: Đảm bảo uptime 99% (chưa kiểm tra thực tế).
- **Bảo mật**:
  - Sử dụng presigned URL để bảo vệ video.
  - Lưu trữ thông tin nhạy cảm (mật khẩu, AWS credentials) trong Kubernetes Secrets.
- **Tương thích**: Hỗ trợ các trình duyệt hiện đại (Chrome, Firefox, Safari).

## 2. Kiến Trúc Hệ Thống

### 2.1 Kiến Trúc Tổng Quan
Hệ thống sử dụng kiến trúc **microservices**, triển khai trên **Windows Server** hoặc máy cục bộ với **Docker Desktop** và **Kubernetes**. Định tuyến yêu cầu được thực hiện bởi **Kong Ingress Controller**, và hệ thống được expose ra Internet bằng **ngrok free**.

#### Kiến Trúc Hiện Tại
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

### 2.2 Các Thành Phần Chi Tiết

#### 2.2.1 Giao Diện Người Dùng (Frontend)
- **Công nghệ**: React.js, Tailwind CSS v4.
- **Chi tiết**:
  - Ứng dụng một trang (SPA) với các tính năng: danh sách phim, tìm kiếm, phân trang, chi tiết phim.
  - Trình phát video hỗ trợ HLS (1080p), sử dụng thư viện như `hls.js`.
  - Tài nguyên tĩnh (CSS, JS) chạy local, phục vụ qua Nginx.
- **Luồng**:
  - Người dùng truy cập web qua `http://localhost:8080` hoặc URL ngrok.
  - Tìm kiếm phim qua API `/api/search`.
  - Xem chi tiết phim và phát video qua presigned URL từ API `/api/stream/{movie_id}`.
- **Giao thức**: HTTPS (qua ngrok).

#### 2.2.2 Kong Ingress Controller
- **Vai trò**: Định tuyến yêu cầu từ frontend đến các microservices.
- **Giao thức**: HTTPS.
- **Cấu hình**:
  - Được cài đặt trên Kubernetes bằng Helm.
  - Sử dụng `ingressClassName: kong` để định tuyến.
- **Expose trong môi trường local**:
  - Port-forward: `kubectl port-forward svc/kong-kong-proxy 8080:80 -n kong`.
  - Sử dụng ngrok free để expose: `ngrok http 8080`.

#### 2.2.3 Microservices
- **Search Service**:
  - **Chức năng**: Tìm kiếm nội dung phim, truy vấn RDS PostgreSQL, hỗ trợ tìm kiếm theo từ khóa và phân trang.
  - **Công nghệ**: Python/FastAPI.
  - **CORS**: Cho phép origin `http://localhost:8080` và URL ngrok.
  - **Cổng**: 8001.
- **Streaming Service**:
  - **Chức năng**: Quản lý phát video, tạo presigned URL từ key S3 (`s3://movie-streaming-dest/{movie_id}/hls/`).
  - **Công nghệ**: Go.
  - **Tích hợp**: AWS CloudFront, S3.
  - **CORS**: Cho phép origin `http://localhost:8080` và URL ngrok.
  - **Cổng**: 8002.
- **ContentVideo Service**:
  - **Chức năng**: Tải video lên S3, gọi AWS Elemental MediaConvert để mã hóa, quản lý metadata phim.
  - **Công nghệ**: Python/Django.
  - **Tích hợp**: S3, AWS Elemental MediaConvert, RDS PostgreSQL.
  - **CORS**: Cho phép origin `http://localhost:8080` và URL ngrok.
  - **Cổng**: 8003.

#### 2.2.4 Cơ Sở Dữ Liệu
- **Amazon RDS PostgreSQL**:
  - Lưu siêu dữ liệu phim (tên, mô tả, thể loại, v.v.).
  - Endpoint: `movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com`.
  - Database: `movie_db`.
  - User: `admindb`.

#### 2.2.5 Lưu Trữ
- **Amazon S3**:
  - Bucket `movie-streaming-origin`: Lưu video gốc (`{movie_id}/`).
  - Bucket `movie-streaming-dest`: Lưu video đã mã hóa (`{movie_id}/hls/`).
  - Quyền truy cập: Sử dụng AWS credentials (lưu trong Kubernetes Secrets).

#### 2.2.6 AWS CloudFront
- **Vai trò**: Phân phối video từ S3, sử dụng presigned URL để bảo vệ nội dung.
- **Distribution Domain**: `d1henbbhjbyad4.cloudfront.net`.
- **Key Pair**: Sử dụng private key và key pair ID để tạo presigned URL.

#### 2.2.7 AWS Elemental MediaConvert
- **Vai trò**: Mã hóa video thành HLS (1080p).
- **Tích hợp**: ContentVideo Service gọi API MediaConvert để xử lý video.

### 2.3 Luồng Dữ Liệu
- **Xem phim**:
  1. Người dùng truy cập web → Frontend gọi `GET /api/search?query={query}&page={page}&limit={limit}` → Kong Ingress Controller → Search Service → RDS PostgreSQL → Trả danh sách phim.
  2. Người dùng chọn phim → Frontend gọi `GET /api/stream/{movie_id}` → Kong Ingress Controller → Streaming Service → Trả presigned URL.
  3. Frontend sử dụng presigned URL để gọi CloudFront và phát video qua trình phát HLS.
- **Quản lý nội dung**:
  1. Quản trị viên gửi video qua `POST /api/content/upload` → Kong Ingress Controller → ContentVideo Service.
  2. ContentVideo Service tải video lên S3 (`movie-streaming-origin/{movie_id}/`), gọi AWS Elemental MediaConvert.
  3. MediaConvert mã hóa video (HLS, 1080p) và lưu vào S3 (`movie-streaming-dest/{movie_id}/hls/`).
  4. ContentVideo Service lưu metadata vào RDS PostgreSQL.

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
│       └── deployment.yaml
├── microservices/
│   ├── search-service/
│   │   ├── main.py
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── kubernetes/
│   │       └── deployment.yaml
│   ├── streaming-service/
│   │   ├── main.go
│   │   ├── Dockerfile
│   │   └── kubernetes/
│   │       └── deployment.yaml
│   ├── contentvideo-service/
│   │   ├── contentvideo_service/
│   │   ├── api/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── kubernetes/
│   │       └── deployment.yaml
├── kubernetes/
└── README.md
```

## 4. Hướng Dẫn Thiết Lập Môi Trường

### 4.1 Cài Đặt Công Cụ Cần Thiết
1. **Docker Desktop**:
   - Tải và cài đặt Docker Desktop trên Windows Server hoặc máy cục bộ.
   - Bật Kubernetes trong Docker Desktop: **Settings** → **Kubernetes** → **Enable Kubernetes**.
   - Đặt tài nguyên: **Settings** → **Resources** → Cấp ít nhất 4 CPU, 8GB RAM, 50GB disk.

2. **kubectl**:
   - Cài đặt `kubectl` để quản lý Kubernetes: [Hướng dẫn cài đặt](https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/).
   - Đặt context: `kubectl config use-context docker-desktop`.

3. **Helm**:
   - Cài đặt Helm để triển khai Kong Ingress Controller: [Hướng dẫn cài đặt](https://helm.sh/docs/intro/install/).

4. **ngrok**:
   - Tải và cài đặt ngrok: [Hướng dẫn cài đặt](https://ngrok.com/download).
   - Dùng ngrok free để expose hệ thống ra Internet.

### 4.2 Thiết Lập AWS
1. **AWS Credentials**:
   - Tạo AWS Access Key trong AWS IAM.
   - Lưu trữ AWS credentials trong Kubernetes Secret:
     ```powershell
     kubectl create secret generic contentvideo-secrets --namespace default \
       --from-literal=AWS_ACCESS_KEY_ID=<your-access-key-id> \
       --from-literal=AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
     ```

2. **Amazon S3**:
   - Tạo 2 bucket:
     - `movie-streaming-origin`: Lưu video gốc.
     - `movie-streaming-dest`: Lưu video đã mã hóa.
   - Cấu hình IAM policy để cho phép truy cập từ microservices.

3. **AWS CloudFront**:
   - Tạo distribution với origin là bucket `movie-streaming-dest`.
   - Tạo key pair trong CloudFront, lưu private key và key pair ID.
   - Lưu private key vào Kubernetes Secret:
     ```powershell
     kubectl create secret generic streaming-secret --namespace default \
       --from-file=pk-APKAREOSHZ2RHFQO4IH5.pem=/path/to/pk-APKAREOSHZ2RHFQO4IH5.pem
     ```

4. **AWS Elemental MediaConvert**:
   - Tạo role IAM cho MediaConvert (ví dụ: `MediaConvert_Default_Role`).
   - Cấu hình ContentVideo Service để gọi API MediaConvert.

5. **Amazon RDS PostgreSQL**:
   - Tạo instance RDS PostgreSQL trên AWS.
   - Cấu hình Security Group để cho phép truy cập từ microservices.
   - Lưu thông tin kết nối (host, user, password) trong Kubernetes Secret:
     ```powershell
     kubectl create secret generic contentvideo-secrets --namespace default \
       --from-literal=DATABASE_PASSWORD=<your-db-password> \
       --from-literal=AWS_ACCESS_KEY_ID=<your-access-key-id> \
       --from-literal=AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
     ```

## 5. Triển Khai Hệ Thống

### 5.1 Container Hóa và Điều Phối
- **Container hóa**: Sử dụng Docker Desktop.
- **Điều phối**: Kubernetes tích hợp trong Docker Desktop.
- **Định tuyến**: Kong Ingress Controller.

### 5.2 Các Bước Triển Khai
1. **Cài Đặt Kong Ingress Controller**:
   ```powershell
   kubectl create namespace kong
   helm repo add kong https://charts.konghq.com
   helm repo update
   helm install kong kong/kong -n kong --set ingressController.installCRDs=false
   ```

2. **Triển Khai Microservices**:
   - Áp dụng các file Deployment:
     ```powershell
     kubectl apply -f microservices/contentvideo-service/kubernetes/deployment.yaml
     kubectl apply -f microservices/search-service/kubernetes/deployment.yaml
     kubectl apply -f microservices/streaming-service/kubernetes/deployment.yaml
     kubectl apply -f frontend/kubernetes/deployment.yaml
     ```

3. **Triển Khai Ingress Rules**:
   ```powershell
   kubectl apply -f infrastructure/kong/contentvideo-service-ingress.yaml
   kubectl apply -f infrastructure/kong/frontend-ingress.yaml
   kubectl apply -f infrastructure/kong/search-service-ingress.yaml
   kubectl apply -f infrastructure/kong/streaming-service-ingress.yaml
   ```

4. **Expose Hệ Thống**:
   - Port-forward Kong:
     ```powershell
     kubectl port-forward svc/kong-kong-proxy 8080:80 -n kong
     ```
   - Expose qua ngrok:
     ```powershell
     ngrok http 8080
     ```
     - Truy cập URL ngrok (ví dụ: `https://abc123.ngrok-free.app`).

### 5.3 Kiểm Tra Hệ Thống
- Kiểm tra pod:
  ```powershell
  kubectl get pods -A
  ```
- Kiểm tra container:
  ```powershell
  docker ps
  ```
- Truy cập web: `http://localhost:8080` hoặc URL ngrok.
  - Giao diện hiển thị.
  - Tìm kiếm phim (API `/api/search`).
  - Phát video (API `/api/stream/{movie_id}`).
  - Tải video (API `/api/content`).

## 6. API Endpoints
- **GET `/api/search?query={query}&page={page}&limit={limit}`**:
  - Tìm kiếm phim theo từ khóa, hỗ trợ phân trang.
  - Ví dụ: `/api/search?query=avengers&page=1&limit=10`.
- **GET `/api/stream/{movie_id}`**:
  - Lấy presigned URL để xem phim.
  - Ví dụ: `/api/stream/123`.
- **POST `/api/content/upload`**:
  - Tải video lên và lưu metadata.
  - Payload: Form-data với file video và metadata (title, description, v.v.).

## 7. Khắc Phục Sự Cố
- **Pod ở trạng thái `ContainerCreating`**:
  - Kiểm tra image:
    ```powershell
    docker pull <image-name>
    ```
  - Kiểm tra Secret:
    ```powershell
    kubectl get secret <secret-name> -n default -o yaml
    ```
  - Kiểm tra tài nguyên: Mở Docker Desktop → **Settings** → **Resources**.
- **Lỗi 404 khi gọi API qua Kong**:
  - Đảm bảo `konghq.com/strip-path: "false"` trong các Ingress rules.
  - Kiểm tra log của Kong:
    ```powershell
    kubectl logs -n kong -l app.kubernetes.io/name=kong
    ```
- **Không kết nối được với RDS PostgreSQL**:
  - Kiểm tra Security Group của RDS (cho phép truy cập từ pod).
  - Kiểm tra kết nối từ máy cục bộ:
    ```powershell
    psql -h movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com -p 5432 -U admindb -d movie_db
    ```

## 8. Kiểm Tra Hiệu Suất và Tài Nguyên
- **Kiểm tra tài nguyên pod**:
  ```powershell
  kubectl top pods -n default
  ```
- **Kiểm tra tài nguyên máy**:
  - Mở Docker Desktop → **Settings** → **Resources**.
  - Đảm bảo cấp đủ CPU, RAM, disk (ít nhất 4 CPU, 8GB RAM, 50GB disk).

## 9. Kết Luận
Hệ thống trang web xem phim trực tuyến là một nền tảng microservices đơn giản, tích hợp **AWS Elemental MediaConvert** và **AWS CloudFront** để phát video chất lượng cao. **Người dùng** xem phim trực tiếp qua presigned URL. **Nhà cung cấp nội dung** lưu trữ video trên **Amazon S3**, và **quản trị viên** upload video qua API. Hệ thống đã triển khai thành công trên Kubernetes tích hợp trong Docker Desktop, sử dụng Kong Ingress Controller để định tuyến và ngrok free để expose ra Internet. Các bước tiếp theo có thể bao gồm triển khai trên cloud (AWS EKS) và kiểm tra hiệu suất với tải lớn.