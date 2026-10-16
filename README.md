<div align="center">

# 🚀 arXiv Client - Backend API Service
### Topic 28: NestJS Microservice & arXiv Ingestion Pipeline

[![NestJS](https://img.shields.io/badge/NestJS-10.4-e0234e?style=flat-square&logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85ea2d?style=flat-square&logo=swagger)](http://localhost:3001/api/docs)
[![License](https://img.shields.io/badge/License-MIT-amber?style=flat-square)](LICENSE)

*High-performance, modular NestJS REST API with rate-limited arXiv data ingestion, full-text search, and automated BibTeX/APA citation generation.*

</div>

---

## 🎯 1. Tính năng Phía Backend

* **`PapersModule`:** Cung cấp danh sách bài báo arXiv phân trang theo chuyên mục (`cs.AI`, `cs.LG`, `cs.CV`).
* **`SearchModule`:** Tìm kiếm toàn văn (title, abstract, author) có hỗ trợ sắp xếp theo relevance / date.
* **`LibraryModule`:** Quản lý bookmark cá nhân, tự động format **BibTeX / APA** và export file `.bib`.
* **`HealthModule`:** Endpoint liveness probe `/api/health`.
* **Swagger OpenAPI:** Giao diện test API trực quan tại `http://localhost:3001/api/docs`.
* **arXiv Crawler Pipeline:** Script Python cào dữ liệu có **delay 3 giây** tuân thủ điều khoản arXiv.

---

## ⚡ 2. Cài đặt & Khởi chạy Nhanh

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy server ở chế độ phát triển (port 3001)
npm run start:dev
```

* **Swagger Docs:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
* **API Papers:** [http://localhost:3001/api/papers](http://localhost:3001/api/papers)
* **Health Check:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 👥 3. Phân công Thành viên Team Backend

* **TV 2 (Data & Crawler):** Phụ trách `notebooks/arxiv_crawler.py` và tối ưu pipeline cào dữ liệu arXiv Atom XML.
* **TV 3 (Core REST API):** Phụ trách `src/modules/papers/` (phân trang, category filter, cache).
* **TV 4 (Search & Citations):** Phụ trách `src/modules/search/` và `src/modules/library/` (sinh mã BibTeX, APA, export `.bib`).
* **TV 1 (Lead):** Review code, kiểm tra Swagger và quản lý Git.

---

## 📜 4. Điều khoản arXiv (Compliance)

> *"Thank you to arXiv for use of its open access interoperability."*
* Rate limit: Tối đa 1 request mỗi 3 giây.
* Không lưu trữ và phân phối lại file PDF bản quyền.
