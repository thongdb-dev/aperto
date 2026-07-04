# Aperto

Nền tảng đặt lịch & quản lý dự án chụp ảnh — kết nối Photographer và Khách hàng, quản lý toàn bộ vòng đời của một photoshoot từ booking đến bàn giao ảnh.

> **Core concept:** Booking chỉ là điểm bắt đầu. Mỗi booking được xác nhận tạo ra một **Project Workspace** — không gian làm việc chung gồm: Conversation, Moodboard, Checklist, RAW Gallery, Photo Selection, Edited Gallery, Delivery, Payment, Review.

## Bài toán

Thị trường chụp ảnh hiện tại vận hành rời rạc: booking qua Facebook/Zalo, chốt giá qua chat, chuyển khoản tay, gửi ảnh qua Drive. Hệ quả là thiếu minh bạch về đặt cọc/hoàn tiền, không có công cụ quản lý tiến độ dự án, và không có hệ thống uy tín đáng tin cậy để khách hàng lựa chọn photographer. Aperto giải quyết trọn vẹn chuỗi giá trị này trên một nền tảng duy nhất.

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, TypeScript, MUI, React Query |
| Backend | NestJS, MongoDB, Redis, Socket.IO |
| Storage | Amazon S3 / Cloudflare R2 |
| Payments | Stripe (quốc tế), MoMo, VNPay (nội địa) |

## Tài liệu

| File | Nội dung |
|---|---|
| [docs/01-overview.md](./docs/01-overview.md) | Tổng quan: vision, vai trò, luồng nghiệp vụ |
| [docs/02-functional-requirements.md](./docs/02-functional-requirements.md) | Yêu cầu chức năng chi tiết theo module (FR-ID) |
| [docs/03-non-functional-requirements.md](./docs/03-non-functional-requirements.md) | Yêu cầu phi chức năng |
| [docs/04-data-model.md](./docs/04-data-model.md) | Mô hình dữ liệu — 15 collections |
| [docs/05-architecture.md](./docs/05-architecture.md) | Kiến trúc hệ thống |
| [docs/06-business-model-and-trust.md](./docs/06-business-model-and-trust.md) | Business model, Trust Score & Search Score |
| [docs/07-mvp-scope.md](./docs/07-mvp-scope.md) | Phạm vi MVP v1.0 vs. Phase 2+ |
| [docs/08-open-questions.md](./docs/08-open-questions.md) | Các quyết định sản phẩm (đã chốt) |
| [ROADMAP.md](./ROADMAP.md) | Kế hoạch triển khai theo milestone |

## Chạy local

Yêu cầu: Node.js 22 (`.nvmrc`), Docker.

```bash
nvm use                        # Node 22
npm install                    # cài dependencies cho cả 2 workspace
docker compose up -d           # MongoDB + Redis
cp apps/api/.env.example apps/api/.env
npm run dev:api                # API tại http://localhost:4000/api/v1
npm run dev:web                # Web tại http://localhost:3000
```

Kiểm tra hạ tầng: `curl http://localhost:4000/api/v1/health` → `{"status":"ok","dependencies":{"mongo":"up","redis":"up"}}`.

Chạy API trong container (không cần Node trên host): `docker compose --profile full up`.

Cấu trúc monorepo (npm workspaces):

```
apps/
  web/   # Next.js 15 + TypeScript + MUI + React Query
  api/   # NestJS 11 + Mongoose + Redis (ioredis)
docs/    # SRS và tài liệu sản phẩm
```

## Workflow tổng thể

```
Search → Portfolio → Booking → (Optional Deposit) → Project → Shoot
  → RAW Upload → Photo Selection → Editing → Final Delivery → Payment → Review
```

## Mô hình doanh thu

Commission trên giao dịch · Photographer Subscription · Featured Photographer · Ads · Marketplace (Phase 2+). Chi tiết tại [docs/06-business-model-and-trust.md](./docs/06-business-model-and-trust.md).

## Trạng thái

🚧 **Pre-development** — tài liệu đặc tả (SRS) hoàn thiện, các quyết định sản phẩm đã được Product Owner chốt tại [docs/08-open-questions.md](./docs/08-open-questions.md). Sẵn sàng khởi động Milestone 0 ([ROADMAP.md](./ROADMAP.md)).
