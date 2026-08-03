# Hướng Dẫn Triển Khai Hệ Thống CMS FaceID AI

Tài liệu này hướng dẫn chi tiết quy trình triển khai toàn bộ hệ thống **CMS FaceID Phòng Họp**. 

Toàn bộ quá trình build ứng dụng Web, đóng gói Desktop Electron, khởi tạo Database Postgres và cấu hình Nginx Reverse Proxy **ĐÃ ĐƯỢC TỰ ĐỘNG HÓA 100%** thông qua Docker Compose.

---

## 🛠️ 1. Yêu cầu Tiền đề (Prerequisites)

- **Docker Desktop** (Đã cài đặt trên máy Host & đang chạy)

---

## ⚙️ 2. Bước 1: Cấu hình Môi trường (`.env`)

1. Tạo file `.env` tại thư mục gốc từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Cập nhật các thông số cần thiết trong `.env`:
   - `HOST_IMAGE_PATH`: Đường dẫn tuyệt đối thư mục chứa ảnh sự kiện trên máy host Windows (VD: `C:\Program Files\DVMS System\DVMS Server\EventData`).
   - `CMS_WEBSERVER_DATABASE_URL`: Chuỗi kết nối PostgreSQL cho DB nội bộ.
   - `DVMS_DATABASE_URL` & `LCMS_DATABASE_URL`: Chuỗi kết nối tới DB của bên thứ 3.
   - `SHIFT_*`: Khung giờ làm việc và giờ đệm.
   - `LOVAD_*`: Cấu hình tích hợp API hệ thống LOVAD (LCMS & DVMS).
   - `VITE_WS_URL`: URL WebSocket/Backend API (mặc định Web Docker: `http://localhost:8082`).

---

## 🐳 3. Bước 2: Triển khai Hệ thống (Chỉ 1 lệnh duy nhất)

Chạy lệnh sau tại thư mục gốc của dự án:

```bash
docker compose up -d --build
```

## 📋 4. Kiểm tra Logs & Lệnh Quản trị

### 4.1 Kiểm tra trạng thái các Container
```bash
docker compose ps
```

### 4.2 Xem Log hệ thống
- Xem log toàn bộ container:
  ```bash
  docker compose logs -f
  ```
- Xem log riêng Backend:
  ```bash
  docker compose logs -f backend
  ```
- Xem log riêng Frontend:
  ```bash
  docker compose logs -f frontend
  ```

### 4.3 Dừng dịch vụ
- Dừng dịch vụ và giữ nguyên dữ liệu:
  ```bash
  docker compose down
  ```
- Dừng dịch vụ và **XÓA SẠCH** Volume dữ liệu Postgres (Cẩn trọng!):
  ```bash
  docker compose down -v
  ```
