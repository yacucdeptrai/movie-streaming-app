# TRANG WEB XEM PHIM TRỰC TUYẾN

## MÔN HỌC: ỨNG DỤNG PHÂN TÁN

## Chức Năng Chính

- Hiển thị danh sách phim  
- Tìm kiếm phim theo từ khóa  
- Xem phim trực tuyến  
- Quản trị viên upload phim qua API  

**Chi tiết:**  
- **Hiển thị danh sách phim**:  
  - Giao diện web hiển thị danh sách phim đơn giản (tiêu đề, mô tả ngắn, thể loại).  
  - Lấy dữ liệu từ API `GET /api/search`, không cần phân trang vì dữ liệu nhỏ.  
- **Tìm kiếm phim theo từ khóa**:  
  - Người dùng nhập từ khóa (ví dụ: "Drama") vào thanh tìm kiếm.  
  - Giao diện gửi yêu cầu đến API để lấy danh sách phim khớp với từ khóa.  
- **Xem phim trực tuyến**:  
  - Người dùng chọn phim và xem trực tiếp trên giao diện qua trình phát video.  
  - Video được phát bằng URL từ AWS CloudFront, chất lượng cơ bản (không cần 1080p).  
- **Quản trị viên upload phim qua API**:  
  - Quản trị viên dùng lệnh (như `curl`) để gọi API `POST /api/content/upload`.  
  - API cho phép upload file video hoặc chỉ lưu metadata (tiêu đề, mô tả, thể loại).  

---

## Yêu Cầu Hệ Thống và Giải Pháp

**Yêu Cầu Hệ Thống**  
- Chạy được trên máy local  
- Hỗ trợ xem phim và tìm kiếm cơ bản  
- Quản lý nội dung đơn giản  

**Giải Pháp**  
- Kiến trúc microservices: chia thành các dịch vụ nhỏ  
- Dễ phát triển và học hỏi  

**Chi tiết:**  
- **Yêu Cầu Hệ Thống**:  
  - **Chạy được trên máy local**:  
    - Hệ thống triển khai trên máy cá nhân, không cần xử lý lượng truy cập lớn.  
    - Chỉ cần chạy được trên môi trường Docker Desktop với Kubernetes.  
  - **Hỗ trợ xem phim và tìm kiếm cơ bản**:  
    - Tìm kiếm phim dựa trên từ khóa, không cần tính năng nâng cao (lọc, phân trang).  
    - Xem phim trực tuyến với chất lượng video cơ bản, không cần tối ưu quá mức.  
  - **Quản lý nội dung đơn giản**:  
    - Quản trị viên có thể thêm phim mới qua API, không cần giao diện phức tạp.  
    - Chỉ cần lưu trữ và truy xuất metadata phim cơ bản.  
- **Giải Pháp**:  
  - **Kiến trúc microservices**:  
    - Chia hệ thống thành các dịch vụ nhỏ: tìm kiếm, phát phim, quản lý nội dung.  
    - Mỗi dịch vụ chạy độc lập, dễ hiểu và học hỏi cách triển khai microservices.  
  - **Dễ phát triển và học hỏi**:  
    - Sử dụng các công nghệ quen thuộc (React, Python, Go) để dễ phát triển.  
    - Tích hợp AWS cơ bản (S3, CloudFront) để học cách dùng dịch vụ cloud.

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
  - Xây dựng bằng React.js và Tailwind CSS, giao diện đơn giản, dễ sử dụng.  
  - Hiển thị danh sách phim, có thanh tìm kiếm và trình phát video cơ bản.  
  - Gọi API để lấy dữ liệu phim và URL phát video.  
- **Search Service**:  
  - Dùng Python/FastAPI, xử lý yêu cầu tìm kiếm phim.  
  - Truy vấn cơ sở dữ liệu để tìm phim theo từ khóa (ví dụ: tìm phim có từ "Drama").  
  - Trả về danh sách phim khớp với từ khóa, không cần tối ưu phức tạp.  
- **Streaming Service**:  
  - Dùng Go, tạo URL để phát phim từ AWS CloudFront.  
  - URL có thời hạn (ví dụ: 1 giờ), đảm bảo bảo mật cơ bản.  
  - Không cần xử lý tải lớn, chỉ cần chạy được trên local.  
- **ContentVideo Service**:  
  - Dùng Python/Django, xử lý API upload phim.  
  - Lưu file video lên Amazon S3, gọi AWS Elemental MediaConvert để mã hóa.  
  - Lưu metadata phim (tiêu đề, mô tả, thể loại) vào cơ sở dữ liệu.  
- **Amazon RDS PostgreSQL**:  
  - Lưu trữ metadata phim trong bảng `movies`.  
  - Dùng cơ sở dữ liệu nhỏ, không cần cấu hình phức tạp.  
  - Đảm bảo dữ liệu được lưu và truy xuất đúng.  
- **Amazon S3**:  
  - Lưu video gốc và video đã mã hóa.  
  - Dùng hai bucket: một cho video gốc, một cho video đã mã hóa.  
  - Quyền truy cập được quản lý qua AWS credentials.  
- **AWS CloudFront**:  
  - Phân phối video từ S3, giảm thời gian tải video.  
  - Sử dụng URL có thời hạn để bảo vệ nội dung.  
  - Chỉ cần cấu hình cơ bản để chạy trên local.  
- **AWS Elemental MediaConvert**:  
  - Mã hóa video thành định dạng HLS để phát trực tuyến.  
  - Tạo các đoạn video ngắn (6 giây) để dễ phát trên trình duyệt.  
  - Không cần tối ưu chất lượng cao, chỉ cần chạy được.

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
  - React.js: Tạo giao diện web đơn giản, dễ phát triển.  
  - Tailwind CSS: Thiết kế giao diện nhanh, không cần tùy chỉnh nhiều.  
  - Chỉ cần hiển thị danh sách phim, tìm kiếm, và phát video cơ bản.  
- **Backend:**  
  - **Search Service: Python/FastAPI**  
    - FastAPI nhẹ, dễ học, phù hợp cho dự án nhỏ.  
    - Dùng để gọi API tìm kiếm phim, trả về kết quả từ cơ sở dữ liệu.  
  - **Streaming Service: Go**  
    - Go đơn giản, dễ dùng để tạo URL phát phim.  
    - Gọi AWS CloudFront để tạo URL, không cần tối ưu hiệu suất.  
  - **ContentVideo Service: Python/Django**  
    - Django dễ dùng để xử lý API upload phim.  
    - Gọi AWS S3 và MediaConvert để lưu và mã hóa video.  
- **Database: Amazon RDS PostgreSQL**  
  - PostgreSQL là cơ sở dữ liệu quan hệ, dễ cấu hình.  
  - Lưu trữ metadata phim trong một bảng duy nhất, không cần phức tạp.  
- **Storage: Amazon S3, AWS CloudFront**  
  - Amazon S3: Lưu trữ video, dễ tích hợp với AWS.  
  - AWS CloudFront: Phân phối video, giảm thời gian tải.  
- **MediaConvert: AWS Elemental MediaConvert**  
  - Mã hóa video thành HLS, dễ phát trên trình duyệt.  
  - Chỉ cần cấu hình cơ bản để học cách dùng dịch vụ AWS.  
- **Triển khai: Kubernetes, Kong Ingress Controller, ngrok**  
  - Kubernetes: Học cách triển khai microservices trên local.  
  - Kong: Định tuyến yêu cầu đến các dịch vụ, không cần tối ưu tải.  
  - ngrok: Expose giao diện web ra ngoài để kiểm tra.

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
    - Người dùng nhập từ khóa vào thanh tìm kiếm trên giao diện.  
    - Giao diện gọi API `GET /api/search?query={keyword}` qua Kong.  
    - `Search Service` truy vấn cơ sở dữ liệu và trả về danh sách phim.  
  - **Người dùng chọn phim**:  
    - Người dùng chọn một phim từ danh sách để xem.  
    - Giao diện gọi API `GET /api/stream/{movie_id}` để lấy URL phát phim.  
  - **Người dùng xem phim**:  
    - `Streaming Service` tạo URL từ AWS CloudFront, trả về giao diện.  
    - Giao diện phát video bằng trình phát HLS cơ bản.  
- **Quản lý nội dung:**  
  - **Quản trị viên gọi API**:  
    - Quản trị viên dùng lệnh gọi API `POST /api/content/upload`.  
    - Gửi file video hoặc metadata (tiêu đề, mô tả, thể loại).  
  - **ContentVideo Service xử lý**:  
    - Lưu file video lên Amazon S3 (bucket gốc).  
    - Gọi AWS Elemental MediaConvert để mã hóa video.  
    - Lưu video đã mã hóa vào bucket khác.  
    - Lưu metadata vào cơ sở dữ liệu.  
  - **Kết quả**:  
    - Phim mới được thêm vào hệ thống, có thể tìm kiếm và xem ngay.

---

## Bảo Mật Với Presigned URL

**Vai trò của presigned URL**  
- Streaming Service tạo presigned URL qua AWS CloudFront  
- Ngăn truy cập trái phép vào video  
- Đảm bảo nội dung chỉ được truy cập bởi người dùng hợp lệ  

**Chi tiết:**  
- **Streaming Service tạo presigned URL qua AWS CloudFront**:  
  - `Streaming Service` tạo URL từ AWS CloudFront để phát video.  
  - URL có thời hạn (ví dụ: 1 giờ), sau đó không thể truy cập.  
- **Ngăn truy cập trái phép vào video**:  
  - Chỉ người dùng có URL hợp lệ mới xem được video.  
  - Không cho phép truy cập trực tiếp vào S3, bảo vệ nội dung.  
- **Đảm bảo nội dung chỉ được truy cập bởi người dùng hợp lệ**:  
  - Mỗi lần xem phim tạo một URL mới, đảm bảo bảo mật cơ bản.  
  - Không cần bảo mật phức tạp, chỉ cần chạy được trong dự án học tập.

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
  - `ContentVideo Service` lưu metadata vào bảng `movies` với các cột cơ bản: `movie_id`, `title`, `description`, `genre`, `release_year`.  
  - Dữ liệu nhỏ, không cần tối ưu phức tạp, chỉ cần lưu và đọc đúng.  
- **Hỗ trợ truy vấn nhanh từ Search Service: dùng index để tối ưu**:  
  - `Search Service` truy vấn đơn giản (ví dụ: `SELECT * FROM movies WHERE title LIKE '%keyword%'`).  
  - Dùng index trên cột `title` để tìm kiếm nhanh hơn, nhưng không cần tối ưu quá mức.  
- **Đồng bộ dữ liệu giữa microservices: ContentVideo Service lưu, Search Service truy vấn**:  
  - Cả hai dịch vụ truy cập cùng một cơ sở dữ liệu, dữ liệu luôn đồng bộ.  
  - Khi phim mới được thêm, `Search Service` có thể truy vấn ngay.  
- **Đảm bảo tính toàn vẹn**:  
  - **Multi-AZ sao lưu tự động, tránh mất dữ liệu**:  
    - RDS tự động sao lưu dữ liệu sang một vùng dự phòng, nhưng chỉ cần cấu hình cơ bản.  
    - Đảm bảo không mất dữ liệu nếu có lỗi nhỏ trên máy local.  
  - **Point-in-Time Recovery khôi phục dữ liệu theo thời gian**:  
    - Có thể khôi phục dữ liệu về thời điểm trước đó nếu cần, nhưng không cần dùng nhiều trong dự án nhỏ.  
- **Quản lý hiệu suất: transaction và connection pooling**:  
  - Dùng transaction để lưu dữ liệu an toàn (ví dụ: `BEGIN; INSERT INTO movies ...; COMMIT;`).  
  - Connection pooling giới hạn số kết nối, nhưng không cần tối ưu nhiều vì dữ liệu nhỏ.

---

## Chịu Lỗi và Load Balancing

- Kong Ingress Controller: Định tuyến yêu cầu, tránh quá tải  
- Kubernetes: Tự động mở rộng số lượng pod  
- Health Check: Đảm bảo các dịch vụ hoạt động ổn định  

**Chi tiết:**  
- **Kong Ingress Controller: Định tuyến yêu cầu, tránh quá tải**:  
  - Kong định tuyến yêu cầu đến các dịch vụ (ví dụ: `/api/search` -> `Search Service`).  
  - Tránh quá tải bằng cách chia đều yêu cầu, nhưng không cần tối ưu vì chỉ chạy local.  
- **Kubernetes: Tự động mở rộng số lượng pod**:  
  - Kubernetes tự động tạo thêm pod nếu dịch vụ bị chậm, nhưng chỉ cần 1-2 pod cho dự án nhỏ.  
  - Học cách triển khai container trên Kubernetes, không cần mở rộng lớn.  
- **Health Check: Đảm bảo các dịch vụ hoạt động ổn định**:  
  - Kubernetes kiểm tra dịch vụ có chạy không (qua `/health` endpoint).  
  - Nếu dịch vụ lỗi, Kubernetes khởi động lại, đảm bảo hệ thống không dừng.

---

## Kết Luận

- Hệ thống đáp ứng yêu cầu phát video cơ bản  
- Người dùng dễ dàng tìm kiếm và xem phim qua giao diện web  
- Quản trị viên quản lý nội dung qua API bằng lệnh  
- Tích hợp AWS giúp học hỏi dịch vụ cloud  

**Chi tiết:**  
- **Hệ thống đáp ứng yêu cầu phát video cơ bản**:  
  - Video được phát qua trình phát HLS, chất lượng cơ bản, chạy tốt trên local.  
  - Không cần tối ưu cho hàng nghìn người dùng, chỉ cần chạy được.  
- **Người dùng dễ dàng tìm kiếm và xem phim qua giao diện web**:  
  - Giao diện web đơn giản, dễ dùng, phù hợp cho học tập.  
  - Tìm kiếm và xem phim hoạt động ổn trên dữ liệu nhỏ.  
- **Quản trị viên quản lý nội dung qua API bằng lệnh**:  
  - API upload phim dễ dùng, phù hợp để học cách gọi API.  
  - Quản lý nội dung cơ bản, không cần tính năng phức tạp.  
- **Tích hợp AWS giúp học hỏi dịch vụ cloud**:  
  - Học cách dùng S3, CloudFront, MediaConvert, RDS trong dự án nhỏ.  
  - Hiểu cách tích hợp các dịch vụ AWS với microservices.

---