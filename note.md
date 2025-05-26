# TRANG WEB XEM PHIM TRỰC TUYẾN

## MÔN HỌC: ỨNG DỤNG PHÂN TÁN


## Chức Năng Chính

- Hiển thị danh sách phim  
- Tìm kiếm phim theo từ khóa  
- Xem phim trực tuyến  
- Quản trị viên upload phim qua API  

**Chi tiết:**  
- **Hiển thị danh sách phim**:  
  - Giao diện web (Frontend) hiển thị danh sách phim dưới dạng danh sách hoặc lưới, lấy dữ liệu từ API `GET /api/search`.  
  - Dữ liệu phim bao gồm tiêu đề, mô tả ngắn, hình ảnh đại diện, thể loại, và năm phát hành.  
  - Hỗ trợ phân trang (pagination) để tránh tải toàn bộ dữ liệu cùng lúc, cải thiện hiệu suất.  
- **Tìm kiếm phim theo từ khóa**:  
  - Người dùng nhập từ khóa (ví dụ: "action", "2023") vào thanh tìm kiếm trên giao diện.  
  - Frontend gửi yêu cầu `GET /api/search?query={keyword}&page={page}&limit={limit}` đến `Search Service`.  
  - Kết quả trả về là danh sách phim khớp với từ khóa, hỗ trợ lọc theo thể loại hoặc năm phát hành nếu cần.  
- **Xem phim trực tuyến**:  
  - Người dùng nhấp vào một phim để xem chi tiết, sau đó nhấn nút "Xem phim".  
  - Frontend gọi API `GET /api/stream/{movie_id}` để lấy presigned URL từ `Streaming Service`.  
  - Video được phát qua trình phát HLS (sử dụng thư viện `hls.js`), đảm bảo chất lượng cao (1080p).  
- **Quản trị viên upload phim qua API**:  
  - Quản trị viên sử dụng lệnh (như `curl`) để gọi API `POST /api/content/upload`.  
  - API hỗ trợ hai định dạng:  
    - `multipart/form-data`: Upload file video thực tế lên Amazon S3, sau đó mã hóa bằng AWS Elemental MediaConvert.  
    - `application/json`: Chỉ lưu metadata phim (không upload file).  
  - Metadata phim (tiêu đề, mô tả, thể loại, năm phát hành) được lưu vào Amazon RDS PostgreSQL.

---

## Yêu Cầu Hệ Thống và Giải Pháp

**Yêu Cầu Hệ Thống**  
- Đáp ứng lượng truy cập cao  
- Tìm kiếm, phát phim nhanh, chính xác  
- Hệ thống dễ mở rộng, bảo mật  

**Giải Pháp**  
- Kiến trúc microservices: chia thành các dịch vụ độc lập  
- Dễ quản lý, mở rộng, tăng tính sẵn sàng  

**Chi tiết:**  
- **Yêu Cầu Hệ Thống**:  
  - **Đáp ứng lượng truy cập cao**:  
    - Hệ thống phải xử lý được hàng nghìn người dùng truy cập đồng thời, đặc biệt trong giờ cao điểm (ví dụ: khi một phim mới được phát hành).  
    - Đảm bảo thời gian phản hồi (response time) dưới 1 giây cho các yêu cầu tìm kiếm và phát phim.  
  - **Tìm kiếm, phát phim nhanh, chính xác**:  
    - Tìm kiếm phim phải trả về kết quả trong vòng 500ms, kể cả với dữ liệu lớn (hàng triệu bản ghi).  
    - Phát phim không bị giật lag, đảm bảo video tải nhanh nhờ định dạng HLS và AWS CloudFront.  
    - Kết quả tìm kiếm phải chính xác, khớp với từ khóa người dùng nhập (hỗ trợ tìm kiếm mờ nếu cần).  
  - **Hệ thống dễ mở rộng, bảo mật**:  
    - Dễ dàng thêm tính năng mới (ví dụ: đề xuất phim, bình luận) mà không ảnh hưởng đến các thành phần hiện tại.  
    - Bảo mật nội dung video bằng presigned URL, ngăn truy cập trái phép.  
    - Dữ liệu người dùng (nếu có trong tương lai) phải được mã hóa và bảo vệ.  
- **Giải Pháp**:  
  - **Kiến trúc microservices**:  
    - Hệ thống chia thành các dịch vụ độc lập: `Search Service`, `Streaming Service`, `ContentVideo Service`.  
    - Mỗi dịch vụ chạy trên một container riêng trong Kubernetes, có thể mở rộng độc lập (scale horizontally).  
    - Các dịch vụ giao tiếp qua REST API (HTTPS), đảm bảo tính độc lập và dễ bảo trì.  
  - **Dễ quản lý, mở rộng, tăng tính sẵn sàng**:  
    - Kubernetes tự động mở rộng số lượng pod khi tải tăng (dựa trên CPU/memory usage).  
    - Kong Ingress Controller định tuyến yêu cầu, tránh quá tải cho một dịch vụ cụ thể.  
    - Dễ dàng thêm microservices mới (ví dụ: dịch vụ đề xuất phim) mà không cần dừng hệ thống.

---

## Các Thành Phần Chính

- Frontend: Hiển thị giao diện, tìm kiếm, phát phim  
- Search Service: Tìm kiếm phim từ cơ sở dữ liệu  
- Streaming Service: Tạo URL phát phim  
- ContentVideo Service: Quản lý upload phim, mã hóa video  
- Amazon RDS PostgreSQL: Lưu metadata phim  
- Amazon S3: Lưu trữ video  
- AWS CloudFront: Phân phối video  
- AWS Elemental MediaConvert: Mã hóa video  

**Chi tiết:**  
- **Frontend**:  
  - Xây dựng bằng React.js và Tailwind CSS, tạo giao diện người dùng thân thiện.  
  - Chức năng chính: hiển thị danh sách phim, hỗ trợ tìm kiếm, phát phim qua trình phát HLS.  
  - Tài nguyên tĩnh (CSS, JS, hình ảnh) được phục vụ qua Nginx, giảm tải cho backend.  
  - Giao tiếp với backend qua API (HTTPS), sử dụng CORS để cho phép truy cập từ origin `http://localhost:8080` và URL ngrok.  
- **Search Service**:  
  - Xây dựng bằng Python/FastAPI, xử lý yêu cầu tìm kiếm phim.  
  - Truy vấn Amazon RDS PostgreSQL để lấy danh sách phim dựa trên từ khóa.  
  - Hỗ trợ phân trang (page, limit) và lọc (theo thể loại, năm phát hành).  
  - Tối ưu truy vấn bằng cách sử dụng index trên các cột như `title`, `genre`.  
- **Streaming Service**:  
  - Xây dựng bằng Go, tạo presigned URL để phát phim.  
  - Tích hợp với AWS CloudFront để phân phối video từ Amazon S3.  
  - Đảm bảo bảo mật nội dung bằng presigned URL, giới hạn thời gian truy cập (ví dụ: 1 giờ).  
  - Hỗ trợ CORS cho giao diện web.  
- **ContentVideo Service**:  
  - Xây dựng bằng Python/Django, xử lý upload phim và quản lý metadata.  
  - Hỗ trợ API `POST /api/content/upload` với hai định dạng:  
    - `multipart/form-data`: Upload file video lên Amazon S3, gọi AWS Elemental MediaConvert để mã hóa.  
    - `application/json`: Chỉ lưu metadata vào Amazon RDS PostgreSQL.  
  - Lưu metadata phim vào bảng `movies` với các cột: `movie_id`, `title`, `description`, `genre`, `release_year`, `created_at`.  
- **Amazon RDS PostgreSQL**:  
  - Lưu trữ metadata phim, đảm bảo tính toàn vẹn dữ liệu.  
  - Endpoint: `movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com`.  
  - Database: `movie_db`, user: `admindb`.  
  - Hỗ trợ Multi-AZ và sao lưu tự động để tránh mất dữ liệu.  
- **Amazon S3**:  
  - Bucket `movie-streaming-origin`: Lưu video gốc do quản trị viên upload.  
  - Bucket `movie-streaming-dest`: Lưu video đã mã hóa (HLS) sau khi xử lý bởi MediaConvert.  
  - Quyền truy cập được quản lý qua AWS IAM, sử dụng credentials từ Kubernetes Secrets.  
- **AWS CloudFront**:  
  - Phân phối video từ `movie-streaming-dest`, giảm độ trễ (latency) cho người dùng.  
  - Sử dụng presigned URL để bảo vệ nội dung, chỉ người dùng có URL hợp lệ mới truy cập được.  
  - Distribution domain: `d1henbbhjbyad4.cloudfront.net`.  
- **AWS Elemental MediaConvert**:  
  - Mã hóa video thành định dạng HLS (1080p), tối ưu cho phát trực tuyến.  
  - Được gọi bởi `ContentVideo Service` sau khi video được upload lên S3.  
  - Sử dụng template `MovieHLS` để tạo các đoạn video (segment) dài 6 giây, dễ dàng phát trên các thiết bị.

---

## Công Nghệ Sử Dụng

- Frontend: React.js, Tailwind CSS  
- Backend:  
  - Search Service: Python/FastAPI  
  - Streaming Service: Go  
  - ContentVideo Service: Python/Django  
- Database: Amazon RDS PostgreSQL  
- Storage: Amazon S3, AWS CloudFront  
- MediaConvert: AWS Elemental MediaConvert  
- Triển khai: Kubernetes, Kong Ingress Controller, ngrok  

**Chi tiết:**  
- **Frontend: React.js, Tailwind CSS**  
  - React.js: Xây dựng giao diện người dùng dạng SPA (Single Page Application), cải thiện trải nghiệm người dùng.  
  - Tailwind CSS: Tạo giao diện responsive, dễ tùy chỉnh, giảm thời gian phát triển.  
  - Trình phát video sử dụng thư viện `hls.js` để hỗ trợ định dạng HLS, tương thích với hầu hết trình duyệt.  
- **Backend:**  
  - **Search Service: Python/FastAPI**  
    - FastAPI là framework nhanh, nhẹ, hỗ trợ xử lý bất đồng bộ (async), lý tưởng cho các API hiệu suất cao.  
    - Sử dụng thư viện `psycopg2` để kết nối và truy vấn Amazon RDS PostgreSQL.  
    - Tối ưu hiệu suất bằng cách caching kết quả tìm kiếm phổ biến (có thể thêm Redis trong tương lai).  
  - **Streaming Service: Go**  
    - Go có hiệu suất cao, xử lý tốt các tác vụ đồng thời (concurrency) nhờ goroutines.  
    - Sử dụng AWS SDK for Go để tạo presigned URL từ CloudFront.  
    - Đảm bảo thời gian phản hồi dưới 100ms cho mỗi yêu cầu `GET /api/stream/{movie_id}`.  
  - **ContentVideo Service: Python/Django**  
    - Django cung cấp ORM (Object-Relational Mapping) để tương tác với Amazon RDS PostgreSQL, nhưng hiện tại sử dụng `psycopg2` để tối ưu hiệu suất.  
    - Sử dụng AWS SDK for Python (boto3) để upload file lên S3 và gọi MediaConvert.  
    - Hỗ trợ xử lý file lớn (multipart upload) để upload video dung lượng cao (hàng GB).  
- **Database: Amazon RDS PostgreSQL**  
  - PostgreSQL là cơ sở dữ liệu quan hệ mạnh mẽ, hỗ trợ truy vấn phức tạp và index hiệu quả.  
  - Cấu hình với Multi-AZ để sao lưu dữ liệu, đảm bảo tính sẵn sàng cao (high availability).  
  - Sử dụng SSL (`sslmode=verify-full`) để bảo mật kết nối từ microservices.  
- **Storage: Amazon S3, AWS CloudFront**  
  - Amazon S3: Lưu trữ video gốc và video đã mã hóa, hỗ trợ lưu trữ không giới hạn (scalable).  
  - AWS CloudFront: CDN (Content Delivery Network) phân phối video đến người dùng toàn cầu, giảm độ trễ.  
  - Sử dụng presigned URL để bảo mật nội dung, với thời gian hết hạn (expiration) có thể cấu hình.  
- **MediaConvert: AWS Elemental MediaConvert**  
  - Mã hóa video thành định dạng HLS (HTTP Live Streaming), hỗ trợ phát trên nhiều thiết bị (web, mobile).  
  - Tạo các đoạn video ngắn (6 giây) để tối ưu cho phát trực tuyến, giảm buffering.  
  - Tích hợp với Amazon S3 để đọc video gốc và lưu video đã mã hóa.  
- **Triển khai: Kubernetes, Kong Ingress Controller, ngrok**  
  - Kubernetes: Quản lý container, tự động mở rộng số lượng pod khi tải tăng.  
  - Kong Ingress Controller: Định tuyến yêu cầu đến các microservices, hỗ trợ load balancing.  
  - ngrok: Expose hệ thống cục bộ ra Internet, cho phép người dùng truy cập giao diện web từ bất kỳ đâu.

---

## Tiến Trình và Luồng Dữ Liệu

**Ví dụ quy trình xem phim**  
- Frontend: Người dùng tìm phim -> chọn phim -> xem phim  
- Backend: Kong Ingress Controller -> Search Service -> Streaming Service -> AWS CloudFront  

**Ví dụ quản lý nội dung**  
- Quản trị viên gọi API -> ContentVideo Service -> Amazon S3 -> AWS Elemental MediaConvert -> Amazon RDS PostgreSQL  

**Chi tiết:**  
- **Quy trình xem phim:**  
  - **Người dùng tìm phim**:  
    - Người dùng nhập từ khóa (ví dụ: "action") vào thanh tìm kiếm trên giao diện.  
    - Frontend gửi yêu cầu `GET /api/search?query=action&page=1&limit=10` qua ngrok.  
    - Yêu cầu được định tuyến qua Kong Ingress Controller đến `Search Service`.  
    - `Search Service` truy vấn bảng `movies` trong Amazon RDS PostgreSQL, trả về danh sách phim khớp từ khóa.  
  - **Người dùng chọn phim**:  
    - Giao diện hiển thị danh sách phim, người dùng nhấp vào một phim để xem chi tiết.  
    - Frontend gửi yêu cầu `GET /api/stream/{movie_id}` (ví dụ: `/api/stream/123`) qua Kong đến `Streaming Service`.  
  - **Người dùng xem phim**:  
    - `Streaming Service` tạo presigned URL từ AWS CloudFront, trả về cho Frontend.  
    - Frontend sử dụng presigned URL để phát video qua trình phát HLS (thư viện `hls.js`).  
    - AWS CloudFront lấy video từ Amazon S3 (bucket `movie-streaming-dest`) và truyền luồng video đến người dùng.  
- **Quản lý nội dung:**  
  - **Quản trị viên gọi API**:  
    - Quản trị viên sử dụng lệnh (như `curl`) để gọi API `POST /api/content/upload`.  
    - Định dạng `multipart/form-data`: Gửi file video và metadata (tiêu đề, mô tả, thể loại, năm phát hành).  
    - Yêu cầu được gửi qua ngrok, định tuyến qua Kong đến `ContentVideo Service`.  
  - **ContentVideo Service xử lý**:  
    - Upload file video lên Amazon S3 (bucket `movie-streaming-origin`).  
    - Gọi AWS Elemental MediaConvert để mã hóa video thành định dạng HLS (1080p).  
    - MediaConvert lưu video đã mã hóa vào bucket `movie-streaming-dest`.  
    - Lưu metadata phim vào bảng `movies` trong Amazon RDS PostgreSQL.  
  - **Kết quả**:  
    - Quản trị viên nhận phản hồi xác nhận (JSON) từ API, bao gồm `movie_id` của phim vừa upload.  
    - Phim mới có thể được tìm kiếm ngay lập tức bởi người dùng thông qua `Search Service`.

---

## Bảo Mật Với Presigned URL

**Vai trò của presigned URL**  
- Streaming Service tạo presigned URL qua AWS CloudFront  
- Ngăn truy cập trái phép vào video  
- Đảm bảo nội dung chỉ được truy cập bởi người dùng hợp lệ  

**Chi tiết:**  
- **Streaming Service tạo presigned URL qua AWS CloudFront**:  
  - Khi người dùng yêu cầu xem phim (`GET /api/stream/{movie_id}`), `Streaming Service` sử dụng AWS SDK for Go để tạo presigned URL.  
  - URL được tạo từ CloudFront distribution (`d1henbbhjbyad4.cloudfront.net`), trỏ đến video trong bucket `movie-streaming-dest`.  
  - URL có thời gian hết hạn (expiration) cấu hình (mặc định 1 giờ), sau thời gian này URL không thể truy cập được.  
- **Ngăn truy cập trái phép vào video**:  
  - Presigned URL yêu cầu chữ ký (signature) được tạo bằng private key của CloudFront Key Pair.  
  - Chỉ người dùng có URL hợp lệ (chưa hết hạn và chữ ký đúng) mới truy cập được video.  
  - Ngăn chặn các truy cập trực tiếp vào bucket S3 hoặc qua CloudFront mà không có URL hợp lệ.  
- **Đảm bảo nội dung chỉ được truy cập bởi người dùng hợp lệ**:  
  - Mỗi yêu cầu xem phim tạo một URL mới, đảm bảo tính duy nhất và bảo mật cho từng phiên xem.  
  - CloudFront kiểm tra chữ ký và thời gian hết hạn trước khi cho phép truy cập video.  
  - Nếu có lỗi (URL hết hạn, chữ ký sai), CloudFront trả về lỗi `403 Forbidden`, bảo vệ nội dung bản quyền.

---

## Đồng Bộ Dữ Liệu Với Amazon RDS PostgreSQL

**Vai trò của Amazon RDS PostgreSQL**  
- Lưu metadata phim (tiêu đề, mô tả, thể loại, năm phát hành)  
- Hỗ trợ truy vấn nhanh từ Search Service: dùng index để tối ưu  
- Đồng bộ dữ liệu giữa microservices: ContentVideo Service lưu, Search Service truy vấn  
- Đảm bảo tính toàn vẹn:  
  - Multi-AZ sao lưu tự động, tránh mất dữ liệu  
  - Point-in-Time Recovery khôi phục dữ liệu theo thời gian  
- Quản lý hiệu suất: transaction và connection pooling  

**Chi tiết:**  
- **Lưu metadata phim (tiêu đề, mô tả, thể loại, năm phát hành)**:  
  - `ContentVideo Service` lưu metadata vào bảng `movies` với các cột: `movie_id` (primary key), `title`, `description`, `genre`, `release_year`, `created_at`.  
  - Dữ liệu được lưu dưới dạng quan hệ (RDBMS), đảm bảo tính toàn vẹn (integrity) và dễ truy vấn.  
  - Ví dụ: Một bản ghi có thể là `{movie_id: "123", title: "Dung BKAV", description: "Toi muon duoc vao BKAV", genre: "Drama", release_year: 2025, created_at: "2025-05-26"}`.  
- **Hỗ trợ truy vấn nhanh từ Search Service: dùng index để tối ưu**:  
  - `Search Service` sử dụng truy vấn SQL như `SELECT * FROM movies WHERE title ILIKE '%keyword%' OR description ILIKE '%keyword%' LIMIT 10 OFFSET 0`.  
  - Index được tạo trên các cột `title` và `genre` (ví dụ: `CREATE INDEX idx_movies_title ON movies (title)`), giúp truy vấn nhanh hơn, giảm thời gian từ vài giây xuống dưới 500ms.  
  - Hỗ trợ phân trang (LIMIT và OFFSET) để chỉ lấy dữ liệu cần thiết, giảm tải cho cơ sở dữ liệu.  
- **Đồng bộ dữ liệu giữa microservices: ContentVideo Service lưu, Search Service truy vấn**:  
  - Cả `ContentVideo Service` và `Search Service` truy cập cùng một cơ sở dữ liệu Amazon RDS PostgreSQL.  
  - Khi `ContentVideo Service` lưu metadata phim mới, `Search Service` có thể ngay lập tức truy vấn để hiển thị phim mới cho người dùng.  
  - Không cần cơ chế đồng bộ phức tạp (như message queue) vì dữ liệu được lưu tập trung trong RDS, đảm bảo tính nhất quán (consistency).  
- **Đảm bảo tính toàn vẹn**:  
  - **Multi-AZ sao lưu tự động, tránh mất dữ liệu**:  
    - Amazon RDS PostgreSQL được cấu hình với Multi-AZ, tự động sao lưu dữ liệu sang một Availability Zone dự phòng (ví dụ: từ us-east-1a sang us-east-1b).  
    - Nếu có lỗi phần cứng hoặc mất kết nối ở zone chính, hệ thống tự động chuyển sang zone dự phòng (failover) mà không mất dữ liệu.  
  - **Point-in-Time Recovery khôi phục dữ liệu theo thời gian**:  
    - RDS hỗ trợ Point-in-Time Recovery (PITR), cho phép khôi phục cơ sở dữ liệu về một thời điểm cụ thể (ví dụ: 5 phút trước khi xảy ra lỗi).  
    - Dữ liệu được sao lưu hàng ngày và lưu trữ transaction logs để hỗ trợ PITR, đảm bảo an toàn dữ liệu.  
- **Quản lý hiệu suất: transaction và connection pooling**:  
  - **Transaction**: PostgreSQL sử dụng transaction (ACID) để tránh xung đột khi nhiều microservices cùng truy cập. Ví dụ: `ContentVideo Service` lưu metadata trong một transaction (`BEGIN; INSERT INTO movies ...; COMMIT;`), đảm bảo dữ liệu không bị ghi đè hoặc mất mát.  
  - **Connection Pooling**: Các microservices sử dụng connection pool (thông qua `psycopg2`) để quản lý kết nối, giới hạn số kết nối đồng thời đến RDS (ví dụ: tối đa 100 kết nối), giảm tải cho cơ sở dữ liệu.

---

## Chịu Lỗi và Load Balancing

- Kong Ingress Controller: Định tuyến yêu cầu, tránh quá tải  
- Kubernetes: Tự động mở rộng số lượng pod  
- Health Check: Đảm bảo các dịch vụ hoạt động ổn định  

**Chi tiết:**  
- **Kong Ingress Controller: Định tuyến yêu cầu, tránh quá tải**:  
  - Kong hoạt động như một API Gateway, định tuyến yêu cầu từ người dùng đến các microservices dựa trên đường dẫn (path).  
  - Ví dụ: `/api/search` -> `Search Service`, `/api/stream` -> `Streaming Service`, `/api/content` -> `ContentVideo Service`.  
  - Kong hỗ trợ load balancing bằng cách phân phối yêu cầu đến các pod của microservices (round-robin), tránh quá tải cho một pod cụ thể.  
  - Hỗ trợ retry và circuit breaker để xử lý lỗi (nếu một pod không phản hồi, Kong sẽ thử pod khác).  
- **Kubernetes: Tự động mở rộng số lượng pod**:  
  - Kubernetes được cấu hình với Horizontal Pod Autoscaler (HPA), tự động mở rộng số lượng pod dựa trên tải (CPU/memory usage).  
  - Ví dụ: Nếu `Search Service` đạt 80% CPU, Kubernetes tự động tạo thêm pod (tối đa 5 pod), đảm bảo hệ thống không bị chậm.  
  - Khi tải giảm, Kubernetes tự động giảm số pod để tiết kiệm tài nguyên.  
  - Mỗi pod chạy trong một container Docker, được triển khai từ image (`yadeptrai/contentvideo-service`, `yadeptrai/search-service`, v.v.).  
- **Health Check: Đảm bảo các dịch vụ hoạt động ổn định**:  
  - Kubernetes sử dụng liveness và readiness probes để kiểm tra trạng thái của các pod.  
  - **Liveness Probe**: Kiểm tra xem pod có đang chạy không (ví dụ: kiểm tra `/health` endpoint của microservice). Nếu không phản hồi, pod sẽ được khởi động lại.  
  - **Readiness Probe**: Kiểm tra xem pod có sẵn sàng nhận yêu cầu không. Nếu không sẵn sàng (ví dụ: đang khởi động), Kong sẽ không gửi yêu cầu đến pod đó.  
  - Ví dụ: Nếu một pod của `Streaming Service` gặp lỗi, Kubernetes khởi động lại pod và Kong định tuyến yêu cầu đến pod khác, đảm bảo dịch vụ không bị gián đoạn.

---

## Kết Luận

- Hệ thống đáp ứng yêu cầu phát video chất lượng cao  
- Người dùng dễ dàng tìm kiếm và xem phim qua giao diện web  
- Quản trị viên quản lý nội dung qua API bằng lệnh  
- Tích hợp AWS đảm bảo hiệu suất và bảo mật  

**Chi tiết:**  
- **Hệ thống đáp ứng yêu cầu phát video chất lượng cao**:  
  - Video được mã hóa ở định dạng HLS (1080p), đảm bảo chất lượng hình ảnh tốt.  
  - AWS CloudFront giảm độ trễ, cho phép phát video mượt mà trên toàn cầu.  
  - Trình phát HLS (`hls.js`) hỗ trợ phát trên nhiều thiết bị, từ trình duyệt web đến mobile.  
- **Người dùng dễ dàng tìm kiếm và xem phim qua giao diện web**:  
  - Giao diện web (React.js, Tailwind CSS) thân thiện, dễ sử dụng, hỗ trợ tìm kiếm nhanh và phát phim trực tiếp.  
  - Tìm kiếm phim có thời gian phản hồi dưới 500ms, xem phim không bị giật lag nhờ định dạng HLS và CloudFront.  
- **Quản trị viên quản lý nội dung qua API bằng lệnh**:  
  - API `POST /api/content/upload` cho phép quản trị viên upload phim dễ dàng qua lệnh `curl`.  
  - Hỗ trợ cả `multipart/form-data` (upload file) và `application/json` (lưu metadata), linh hoạt cho nhiều trường hợp.  
  - Metadata được lưu trữ an toàn trong Amazon RDS PostgreSQL, có thể truy vấn ngay lập tức để hiển thị phim mới.  
- **Tích hợp AWS đảm bảo hiệu suất và bảo mật**:  
  - Amazon S3 và AWS CloudFront đảm bảo hiệu suất lưu trữ và phân phối video.  
  - Presigned URL từ CloudFront bảo vệ nội dung, ngăn truy cập trái phép.  
  - Amazon RDS PostgreSQL với Multi-AZ và PITR đảm bảo dữ liệu an toàn, không bị mất mát.

---