import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import psycopg2
import requests
from requests.exceptions import RequestException
import boto3
from botocore.exceptions import ClientError
import os

# Cấu hình kết nối database
DB_HOST = "movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com"
DB_USER = "admindb"
DB_NAME = "movie_db"
DB_PASS = "admin123"
API_URL = "http://localhost:8080/api/content/upload"
ADMIN_PASSWORD = "admin123"

# Cấu hình AWS S3
AWS_ACCESS_KEY = "YOUR_AWS_ACCESS_KEY"
AWS_SECRET_KEY = "YOUR_AWS_SECRET_KEY"
AWS_REGION = "us-east-1"
S3_ORIGIN_BUCKET = "movie-streaming-origin"
S3_DEST_BUCKET = "movie-streaming-dest"

class AdminApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Admin App - Quản Lý Phim")
        self.root.geometry("360x170")  # Kích thước giao diện đăng nhập

        # Biến lưu trữ
        self.current_movie_id = None
        self.conn = None
        self.cursor = None
        self.s3_client = None
        self.movie_id_map = {}  # Lưu ánh xạ giữa số thứ tự hiển thị và movie_id thực tế

        # Giao diện đăng nhập
        self.login_frame = ttk.Frame(self.root)
        self.login_frame.pack(pady=20)

        ttk.Label(self.login_frame, text="Nhập mật khẩu admin:").pack(pady=5)
        self.password_entry = ttk.Entry(self.login_frame, show="*")
        self.password_entry.pack(pady=5)
        ttk.Button(self.login_frame, text="Đăng nhập", command=self.login).pack(pady=5)

    def login(self):
        password = self.password_entry.get()
        if password == ADMIN_PASSWORD:
            self.login_frame.destroy()
            self.root.geometry("1028x770")  # Kích thước giao diện chính
            self.connect_db()
            self.connect_s3()
            self.create_main_interface()
        else:
            messagebox.showerror("Lỗi", "Mật khẩu sai!")

    def connect_db(self):
        try:
            self.conn = psycopg2.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASS,
                database=DB_NAME
            )
            self.cursor = self.conn.cursor()
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể kết nối database: {e}")
            self.root.destroy()

    def connect_s3(self):
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=AWS_ACCESS_KEY,
                aws_secret_access_key=AWS_SECRET_KEY,
                region_name=AWS_REGION
            )
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể kết nối AWS S3: {e}")
            self.root.destroy()

    def create_main_interface(self):
        # Giao diện chính
        self.main_frame = ttk.Frame(self.root)
        self.main_frame.pack(pady=10, padx=10, fill="both", expand=True)

        # Danh sách phim
        self.tree_frame = ttk.Frame(self.main_frame)
        self.tree_frame.pack(fill="both", expand=True)

        self.tree = ttk.Treeview(self.tree_frame, columns=("DisplayID", "Title", "Description", "Genre", "Year"), show="headings")
        self.tree.heading("DisplayID", text="Movie ID")
        self.tree.heading("Title", text="Tiêu đề")
        self.tree.heading("Description", text="Mô tả")
        self.tree.heading("Genre", text="Thể loại")
        self.tree.heading("Year", text="Năm phát hành")
        self.tree.pack(fill="both", expand=True)

        # Sự kiện chọn phim để tự động điền thông tin vào form chỉnh sửa
        self.tree.bind("<<TreeviewSelect>>", self.on_tree_select)

        # Nút xóa
        self.button_frame = ttk.Frame(self.main_frame)
        self.button_frame.pack(pady=5)

        ttk.Button(self.button_frame, text="Xóa phim", command=self.delete_movie).pack(side="left", padx=5)

        # Form upload phim
        self.upload_frame = ttk.LabelFrame(self.main_frame, text="Upload Phim Mới")
        self.upload_frame.pack(pady=10, fill="x")

        ttk.Label(self.upload_frame, text="File video:").grid(row=0, column=0, padx=5, pady=5)
        self.file_path = tk.StringVar()
        ttk.Entry(self.upload_frame, textvariable=self.file_path, width=50).grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(self.upload_frame, text="Chọn file", command=self.choose_file).grid(row=0, column=2, padx=5, pady=5)

        ttk.Label(self.upload_frame, text="Tiêu đề:").grid(row=1, column=0, padx=5, pady=5)
        self.title_entry = ttk.Entry(self.upload_frame)
        self.title_entry.grid(row=1, column=1, padx=5, pady=5)

        ttk.Label(self.upload_frame, text="Mô tả:").grid(row=2, column=0, padx=5, pady=5)
        self.description_entry = ttk.Entry(self.upload_frame)
        self.description_entry.grid(row=2, column=1, padx=5, pady=5)

        ttk.Label(self.upload_frame, text="Thể loại:").grid(row=3, column=0, padx=5, pady=5)
        self.genre_entry = ttk.Entry(self.upload_frame)
        self.genre_entry.grid(row=3, column=1, padx=5, pady=5)

        ttk.Label(self.upload_frame, text="Năm phát hành:").grid(row=4, column=0, padx=5, pady=5)
        self.year_entry = ttk.Entry(self.upload_frame)
        self.year_entry.grid(row=4, column=1, padx=5, pady=5)

        ttk.Button(self.upload_frame, text="Upload", command=self.upload_movie).grid(row=5, column=1, pady=10)

        # Form chỉnh sửa phim
        self.edit_frame = ttk.LabelFrame(self.main_frame, text="Chỉnh Sửa Phim")
        self.edit_frame.pack(pady=10, fill="x")

        ttk.Label(self.edit_frame, text="Tiêu đề:").grid(row=0, column=0, padx=5, pady=5)
        self.edit_title_entry = ttk.Entry(self.edit_frame)
        self.edit_title_entry.grid(row=0, column=1, padx=5, pady=5)

        ttk.Label(self.edit_frame, text="Mô tả:").grid(row=1, column=0, padx=5, pady=5)
        self.edit_description_entry = ttk.Entry(self.edit_frame)
        self.edit_description_entry.grid(row=1, column=1, padx=5, pady=5)

        ttk.Label(self.edit_frame, text="Thể loại:").grid(row=2, column=0, padx=5, pady=5)
        self.edit_genre_entry = ttk.Entry(self.edit_frame)
        self.edit_genre_entry.grid(row=2, column=1, padx=5, pady=5)

        ttk.Label(self.edit_frame, text="Năm phát hành:").grid(row=3, column=0, padx=5, pady=5)
        self.edit_year_entry = ttk.Entry(self.edit_frame)
        self.edit_year_entry.grid(row=3, column=1, padx=5, pady=5)

        ttk.Button(self.edit_frame, text="Cập nhật", command=self.update_movie).grid(row=4, column=1, pady=10)

        # Load danh sách phim
        self.load_movies()

    def load_movies(self):
        # Xóa danh sách hiện tại
        for item in self.tree.get_children():
            self.tree.delete(item)
        self.movie_id_map.clear()

        # Lấy danh sách phim từ database, sắp xếp theo movie_id tăng dần
        try:
            self.cursor.execute("SELECT movie_id, title, description, genre, release_year FROM movies ORDER BY movie_id ASC")
            movies = self.cursor.fetchall()
            # Hiển thị số thứ tự liên tục, lưu ánh xạ với movie_id thực tế
            for index, movie in enumerate(movies, start=1):
                real_movie_id = movie[0]
                display_values = (index, movie[1], movie[2], movie[3], movie[4])
                item_id = self.tree.insert("", "end", values=display_values)
                # Lưu ánh xạ giữa số thứ tự hiển thị và movie_id thực tế
                self.movie_id_map[item_id] = real_movie_id
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể tải danh sách phim: {e}")

    def choose_file(self):
        file_path = filedialog.askopenfilename(filetypes=[("Video files", "*.mp4 *.avi *.mkv")])
        if file_path:
            self.file_path.set(file_path)

    def upload_movie(self):
        file_path = self.file_path.get()
        title = self.title_entry.get()
        description = self.description_entry.get()
        genre = self.genre_entry.get()
        year = self.year_entry.get()

        if not title or not description or not genre or not year:
            messagebox.showerror("Lỗi", "Vui lòng nhập đầy đủ thông tin!")
            return

        # Lấy tên file video để lưu vào database
        video_file = os.path.basename(file_path) if file_path else None

        # Upload phim qua API
        try:
            files = {'video': open(file_path, 'rb')} if file_path else None
            data = {
                'title': title,
                'description': description,
                'genre': genre,
                'release_year': year
            }
            response = requests.post(API_URL, files=files, data=data)
            response.raise_for_status()

            # Lấy movie_id từ phản hồi API (giả sử API trả về movie_id trong JSON)
            movie_id = response.json().get('movie_id')
            if movie_id and video_file:
                # Cập nhật cột video_file trong database
                self.cursor.execute(
                    """
                    UPDATE movies
                    SET video_file = %s
                    WHERE movie_id = %s
                    """,
                    (video_file, movie_id)
                )
                self.conn.commit()

            messagebox.showinfo("Thành công", "Upload phim thành công!")
            self.load_movies()
            # Xóa form
            self.file_path.set("")
            self.title_entry.delete(0, tk.END)
            self.description_entry.delete(0, tk.END)
            self.genre_entry.delete(0, tk.END)
            self.year_entry.delete(0, tk.END)
        except RequestException as e:
            messagebox.showerror("Lỗi", f"Không thể upload phim: {e}")
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể cập nhật video_file: {e}")

    def on_tree_select(self, event):
        selected_item = self.tree.selection()
        if not selected_item:
            return

        item = self.tree.item(selected_item)
        values = item['values']
        # Lấy movie_id thực tế từ ánh xạ
        self.current_movie_id = self.movie_id_map.get(selected_item[0])

        # Tự động điền thông tin vào form chỉnh sửa
        self.edit_title_entry.delete(0, tk.END)
        self.edit_title_entry.insert(0, values[1])
        self.edit_description_entry.delete(0, tk.END)
        self.edit_description_entry.insert(0, values[2])
        self.edit_genre_entry.delete(0, tk.END)
        self.edit_genre_entry.insert(0, values[3])
        self.edit_year_entry.delete(0, tk.END)
        self.edit_year_entry.insert(0, values[4])

    def update_movie(self):
        if not self.current_movie_id:
            messagebox.showerror("Lỗi", "Vui lòng chọn một phim để cập nhật!")
            return

        title = self.edit_title_entry.get()
        description = self.edit_description_entry.get()
        genre = self.edit_genre_entry.get()
        year = self.edit_year_entry.get()

        if not title or not description or not genre or not year:
            messagebox.showerror("Lỗi", "Vui lòng nhập đầy đủ thông tin!")
            return

        # Cập nhật phim trong database
        try:
            self.cursor.execute(
                """
                UPDATE movies
                SET title = %s, description = %s, genre = %s, release_year = %s
                WHERE movie_id = %s
                """,
                (title, description, genre, year, self.current_movie_id)
            )
            self.conn.commit()
            messagebox.showinfo("Thành công", "Cập nhật phim thành công!")
            self.load_movies()
            self.current_movie_id = None
            # Xóa form
            self.edit_title_entry.delete(0, tk.END)
            self.edit_description_entry.delete(0, tk.END)
            self.edit_genre_entry.delete(0, tk.END)
            self.edit_year_entry.delete(0, tk.END)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể cập nhật phim: {e}")

    def delete_movie(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showerror("Lỗi", "Vui lòng chọn một phim để xóa!")
            return

        # Lấy movie_id thực tế từ ánh xạ
        movie_id = self.movie_id_map.get(selected_item[0])
        if not movie_id:
            messagebox.showerror("Lỗi", "Không tìm thấy movie_id!")
            return

        # Lấy tên file video trước khi xóa
        video_file = None
        try:
            self.cursor.execute("SELECT video_file FROM movies WHERE movie_id = %s", (movie_id,))
            result = self.cursor.fetchone()
            if result:
                video_file = result[0]
        except Exception as e:
            messagebox.showwarning("Cảnh báo", f"Không thể lấy thông tin video_file (cột có thể không tồn tại): {e}")

        # Xóa file trên S3 nếu có thông tin video_file
        if video_file:
            try:
                # Xóa file gốc trong bucket movie-streaming-origin
                self.s3_client.delete_object(Bucket=S3_ORIGIN_BUCKET, Key=video_file)

                # Xóa thư mục HLS trong bucket movie-streaming-dest
                # Sử dụng movie_id thực tế để giữ nguyên cấu trúc trên S3
                hls_prefix = f"{movie_id}/hls/"
                response = self.s3_client.list_objects_v2(Bucket=S3_DEST_BUCKET, Prefix=hls_prefix)
                if 'Contents' in response:
                    objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
                    if objects_to_delete:
                        self.s3_client.delete_objects(
                            Bucket=S3_DEST_BUCKET,
                            Delete={'Objects': objects_to_delete}
                        )
            except ClientError as e:
                messagebox.showerror("Lỗi", f"Không thể xóa file trên S3: {e}")
                return

        # Xóa phim khỏi database
        try:
            self.cursor.execute("DELETE FROM movies WHERE movie_id = %s", (movie_id,))
            self.conn.commit()
            messagebox.showinfo("Thành công", "Xóa phim thành công!")
            self.load_movies()
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể xóa phim khỏi database: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = AdminApp(root)
    root.mainloop()