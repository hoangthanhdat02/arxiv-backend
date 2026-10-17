# 🚀 arXiv Mobile Backend Gateway Service (Topic 28)

[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/Framework-ExpressJS-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Build-Passing-success.svg)]()

> **High-Performance Gateway & Middleware Service for Android Native arXiv Client**  
> **Course:** Mobile Application Development  
> **Defense Evaluation:** Live interactive demonstration running 100% from source code on Android Virtual Device (AVD).

---

## 📖 1. Project Overview

The **arXiv Mobile Backend Gateway** is a dedicated middleware service designed under the Backend-For-Frontend (BFF) paradigm. Rather than requiring mobile devices to parse heavyweight, bandwidth-intensive XML Atom feeds directly over cellular connections, this gateway acts as an intelligent proxy:

* **Atom XML to JSON Transformation:** Fast, zero-overhead conversion of arXiv Atom 1.0 XML feeds into lightweight, mobile-optimized JSON structures using `fast-xml-parser`.
* **API Compliance & Rate Limiting:** Strictly enforces arXiv's API policy (no more than 1 request per 3 seconds) through an asynchronous request queue.
* **Intelligent In-Memory Caching:** 10-minute TTL memory caching prevents duplicate upstream requests and ensures sub-millisecond response times for mobile queries.
* **Offline Resiliency:** Includes localized fallback datasets (`sample_papers.json`) so the mobile application never fails during evaluation even if external connectivity is restricted.
* **Academic Citation Engine:** Generates instant BibTeX (`@misc`) blocks and APA 7th edition strings for single-tap academic export.

---

## 👥 2. Team Member Responsibilities

| Role | Member | Responsibilities & Source Scope |
| :--- | :--- | :--- |
| **Team Leader / Base Architecture** | **Đạt_con** | Overall system coordination, API contract definition, and full-stack integration. |
| **Backend Lead** | **DatCao (TV2)** | Express server setup, CORS, HTTP networking (`axios`), Atom 1.0 XML parsing, 3-second rate limiter, and endpoints `GET /api/papers` & `GET /api/search`. |
| **Backend Helper** | **Hiếu Bigh (TV7)** | BibTeX (`@misc`) and APA citation generation service (`GET /api/bibtex/:paperId`), data synchronization with Android SQLite. |

---

## 🛠️ 3. Technology Stack

* **Runtime:** Node.js (v18.x / v20.x / v22.x)
* **Web Framework:** Express.js 4.x
* **Core Libraries:**
  * `axios`: Promise-based HTTP client for external arXiv query invocation.
  * `fast-xml-parser`: High-speed, memory-efficient XML Atom 1.0 parsing.
  * `cors`: Cross-Origin Resource Sharing middleware for mobile and desktop clients.
  * `dotenv`: Environment configuration manager.

---

## 📡 4. RESTful API Specification

Base URL: `http://localhost:3001/api` *(or `http://10.0.2.2:3001/api` from Android Virtual Device)*

### 4.1. Paper Feed by Category
```http
GET /api/papers?category=cs.AI&page=0&limit=10
```
* **Query Parameters:**
  * `category` (optional, string): arXiv subject category (default: `cs.AI`, supports `cs.LG`).
  * `page` (optional, integer): Zero-indexed page number (default: `0`).
  * `limit` (optional, integer): Maximum number of records per page (default: `10`, max: `30`).
* **Response Format (JSON):**
```json
{
  "status": "success",
  "category": "cs.AI",
  "totalResults": 2450,
  "page": 0,
  "limit": 10,
  "data": [
    {
      "id": "2401.12345",
      "title": "Scalable Diffusion Models for Large Language Understanding",
      "summary": "Recent advances in generative modeling demonstrate...",
      "authors": ["Alice Smith", "Bob Jones"],
      "published": "2024-01-15T08:00:00Z",
      "primaryCategory": "cs.AI",
      "pdfUrl": "https://arxiv.org/pdf/2401.12345.pdf",
      "arxivUrl": "https://arxiv.org/abs/2401.12345"
    }
  ]
}
```

### 4.2. Multi-Criteria Paper Search
```http
GET /api/search?q=transformer&category=cs.AI&sortBy=relevance&page=0&limit=10
```
* **Query Parameters:**
  * `q` (required, string): Search query keyword (title, abstract, authors).
  * `category` (optional, string): Scope search to specific category (e.g. `cs.AI`, `cs.LG`).
  * `sortBy` (optional, string): `relevance` (default) or `submittedDate`.

### 4.3. Academic Citation Generation (BibTeX & APA)
```http
GET /api/bibtex/:paperId
```
* **Sample Response:**
```json
{
  "status": "success",
  "paperId": "2401.12345",
  "title": "Scalable Diffusion Models for Large Language Understanding",
  "year": 2024,
  "bibtex": "@misc{arxiv:2401.12345,\n  title = {Scalable Diffusion Models for Large Language Understanding},\n  author = {Alice Smith and Bob Jones},\n  year = {2024},\n  eprint = {2401.12345},\n  archivePrefix = {arXiv},\n  primaryClass = {cs.AI},\n  url = {https://arxiv.org/abs/2401.12345}\n}",
  "apa": "Alice Smith & Bob Jones (2024). Scalable Diffusion Models for Large Language Understanding. arXiv preprint arXiv:2401.12345."
}
```

### 4.4. Service Health Check
```http
GET /api/health
```

---

## 📱 5. Android Virtual Device (AVD) Networking Guide

When communicating from an **Android Emulator (AVD)** to this host service:

* **Host Machine:** `http://localhost:3001`
* **Android Emulator (AVD):** 👉 **`http://10.0.2.2:3001`**
  *(The Android emulator uses `10.0.2.2` as a special alias loopback to the host development PC).*

---

## 🚀 6. Installation & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
A default `.env` is pre-configured. You can inspect or modify settings:
```ini
PORT=3001
ARXIV_BASE_URL=https://export.arxiv.org/api/query
CACHE_TTL_MS=600000
RATE_LIMIT_DELAY_MS=3000
```

### 3. Start Service
```bash
# Production mode
npm start

# Development mode with live reload
npm run dev
```

### 4. Execute Unit & Integration Tests
```bash
npm test
```

---

## 📜 7. Compliance & Attribution

In strict adherence to the [arXiv API Terms of Use](https://arxiv.org/help/api/tou):
1. **Rate Limiting:** Requests are buffered to maintain a 3-second delay between queries.
2. **Attribution:** *"Thank you to arXiv for use of its open access interoperability."*
3. **No Direct PDF Re-distribution:** Binary PDFs are referenced via canonical links and never hosted or modified on proxy storage.
