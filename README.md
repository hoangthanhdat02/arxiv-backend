# 🚀 arXiv Mobile Backend Gateway (ExpressJS) - Topic 28

> **Dịch vụ Gateway & Middleware trung gian cho Ứng dụng Di động arXiv Client**  
> Môn học: **Phát triển Ứng dụng Di động (Mobile Application Development)**  
> Hình thức nghiệm thu: Live Demo trực tiếp từ mã nguồn trên Máy giả lập Android (AVD).

---

## 👥 Phân công trách nhiệm Backend (Theo Kế hoạch & Đặc tả dự án)

* **Thành viên 2 (Backend Lead - DatCao):**
  * Thiết lập server ExpressJS, CORS, Logging.
  * Tích hợp gọi arXiv API qua HTTP (`axios`) với chuyên mục `cs.AI`, `cs.LG`.
  * Bộ giải mã XML Atom 1.0 sang JSON (`fast-xml-parser`).
  * Thuật toán Rate Limiting (1 request / 3s) và Cache bộ đệm Memory (10 phút).
  * Đóng gói REST API `/api/papers` và `/api/search`.
* **Thành viên 7 (Backend Helper - Hiếu Bigh):**
  * Lập trình endpoint `/api/bibtex/:paperId` sinh trích dẫn học thuật chuẩn BibTeX `@misc` và APA.
  * Phối hợp kết nối dữ liệu SQLite với Android Client.
* **Thành viên 1 (Leader - Đạt_con):** Giám sát API contract và tích hợp hệ thống.

---

## 🛠️ Công nghệ sử dụng
* **Runtime:** Node.js (v18+)
* **Framework:** ExpressJS 4.x
* **Thư viện chính:**
  * `axios`: Giao tiếp HTTP với máy chủ arXiv.
  * `fast-xml-parser`: Parse dữ liệu XML Atom 1.0 sang JSON cực nhanh.
  * `cors`: Cho phép kết nối an toàn từ Android Emulator và Web.
  * `dotenv`: Quản lý biến môi trường (`PORT`, `RATE_LIMIT_DELAY_MS`, `CACHE_TTL_MS`).

---

## 📡 Danh sách RESTful API cho Android Client

| Phương thức | Đường dẫn API | Tham số | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/papers` | `category=cs.AI` hoặc `cs.LG`<br>`page=0`<br>`limit=10` | Lấy danh sách bài báo mới nhất theo chuyên mục (Feed trang chủ). |
| `GET` | `/api/papers/:id` | `id` (e.g. `2401.12345`) | Lấy thông tin chi tiết bài báo (Abstract, tác giả, link PDF). |
| `GET` | `/api/search` | `q={từ_khóa}`<br>`category={cs.AI/cs.LG}`<br>`sortBy=relevance/submittedDate`<br>`page=0` | Tìm kiếm bài báo đa tiêu chí có hỗ trợ debounce. |
| `GET` | `/api/bibtex/:paperId` | `paperId` | Trả về chuỗi trích dẫn học thuật chuẩn BibTeX và định dạng APA. |
| `GET` | `/api/health` | Không | Kiểm tra trạng thái hoạt động của server và kết nối. |

---

## 📱 Hướng dẫn cấu hình kết nối Android Emulator (AVD)

Khi chạy ứng dụng Android trên **Máy giả lập Android (AVD)**, để gọi về máy tính đang chạy Backend:
* **Địa chỉ gọi từ máy tính:** `http://localhost:3001`
* **Địa chỉ gọi từ Máy giả lập AVD:** 👉 **`http://10.0.2.2:3001`** *(10.0.2.2 là địa chỉ IP alias đặc biệt của máy ảo trỏ về localhost máy tính)*.

---

## 🚀 Hướng dẫn khởi chạy Backend

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Chạy Server
* **Chế độ phát triển / Demo:**
```bash
npm start
# hoặc
npm run dev
```

Server sẽ lắng nghe tại `http://localhost:3001` (và `http://10.0.2.2:3001` trên máy ảo).

### 3. Kiểm tra nhanh API bằng trình duyệt hoặc Postman
* Kiểm tra Feed: [http://localhost:3001/api/papers?category=cs.AI](http://localhost:3001/api/papers?category=cs.AI)
* Kiểm tra Search: [http://localhost:3001/api/search?q=transformer](http://localhost:3001/api/search?q=transformer)
* Kiểm tra BibTeX: [http://localhost:3001/api/bibtex/2401.12345](http://localhost:3001/api/bibtex/2401.12345)
