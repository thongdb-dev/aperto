# Roadmap — Kế hoạch triển khai MVP v1.0

Kế hoạch chia theo milestone, sắp xếp theo nguyên tắc: mỗi milestone bàn giao một nhóm tính năng chạy được end-to-end và có thể demo/kiểm thử độc lập. Các milestone phụ thuộc tuần tự — không khởi động milestone sau khi milestone trước chưa đạt tiêu chí nghiệm thu.

**Tổng tiến độ dự kiến:** 14–18 tuần cho M0–M8 (một đội nhỏ fullstack).

---

## M0 — Hạ tầng & khung dự án (1 tuần)

**Mục tiêu:** môi trường phát triển thống nhất cho cả đội, CI chạy từ commit đầu tiên.

- [ ] Khởi tạo monorepo: `web` (Next.js + TypeScript + MUI + React Query) và `api` (NestJS)
- [ ] Docker Compose cho môi trường local: MongoDB + Redis + API
- [ ] Chuẩn hoá ESLint/Prettier, quản lý biến môi trường, cấu trúc module NestJS
- [ ] CI cơ bản (lint + build) trên GitHub Actions

**Nghiệm thu:** dev mới clone repo, chạy `docker compose up` là có đủ môi trường.

## M1 — Authentication & Account (1–2 tuần)

- [ ] Đăng ký/đăng nhập email + mật khẩu (bcrypt), OTP xác thực tài khoản
- [ ] JWT access + refresh token, refresh rotation, revoke qua Redis; guard phân quyền theo role
- [ ] Social login Google (Passport.js)
- [ ] FE: form đăng ký/đăng nhập, axios interceptor tự refresh khi 401

**Nghiệm thu:** FR-AUTH-01 → FR-AUTH-05 hoạt động trên môi trường staging.

## M2 — Profile, Portfolio & Media pipeline (2 tuần)

- [ ] CRUD photographer profile, package, booking policy (FR-PROF, một phần FR-BOOK-02)
- [ ] Upload ảnh qua presigned URL lên S3/R2; API chỉ lưu metadata
- [ ] Sinh thumbnail bất đồng bộ qua queue (BullMQ + sharp)
- [ ] FE: trang profile công khai, portfolio dạng lưới, upload nhiều ảnh có progress, lazy-load

**Nghiệm thu:** FR-PROF-01→04, FR-PORT-01→04; upload 100 ảnh/lần không nghẽn API.

## M3 — Search & Availability Calendar (1–2 tuần)

- [ ] API search với filter (khu vực, thể loại, giá, ngày trống) + pagination; index/text search/geo query phù hợp
- [ ] Model lịch rảnh/bận, tự động block ngày đã có booking xác nhận
- [ ] FE: trang search với bộ lọc, URL state sync, infinite scroll; calendar chọn ngày

**Nghiệm thu:** FR-SEARCH-01→03, FR-CAL-01→03. (FR-SEARCH-04 Featured chuyển sang M7.)

## M4 — Booking & Booking Policy (2 tuần)

- [ ] State machine booking: `pending → confirmed → in_progress → completed / cancelled / disputed`
- [ ] Snapshot policy tại thời điểm đặt; tính đặt cọc và hoàn tiền theo refund policy
- [ ] Booking tự hết hạn khi quá SLA phản hồi (scheduled job)
- [ ] Unit test bắt buộc cho state machine và logic tính refund
- [ ] FE: flow tạo booking nhiều bước, màn hình quản lý booking hai phía

**Nghiệm thu:** FR-BOOK-01→06; test coverage cho toàn bộ nhánh tính tiền.

## M5 — Project Workspace & Real-time (2–3 tuần)

- [ ] Tự động tạo project khi booking confirmed; timeline event log (FR-PROJ-11)
- [ ] Socket.IO gateway: chat theo room project, auth bằng JWT, lưu message vào MongoDB
- [ ] Tab Moodboard, Checklist
- [ ] RAW Gallery → Selected Photos → Edited Gallery → Delivery: watermark khi chưa thanh toán đủ, link tải có expiry
- [ ] FE: UI chat (optimistic update, typing indicator), các tab workspace

**Nghiệm thu:** FR-PROJ-01→11 hoạt động trọn luồng với 2 tài khoản thật trên staging.

## M6 — Payment (2 tuần)

- [ ] Tích hợp Stripe: deposit, milestone, final payment; webhook idempotent xác nhận giao dịch
- [ ] Tích hợp MoMo/VNPay sandbox
- [ ] Tính commission, refund flow tự động theo policy, xuất biên nhận điện tử
- [ ] Payout cho photographer (đối soát thủ công ở v1.0, tự động hoá sau)
- [ ] Test bắt buộc cho webhook handler và các nhánh tính commission/refund

**Nghiệm thu:** FR-PAY-01→07 trên môi trường sandbox của cả ba cổng.

## M7 — Trust & Ranking, Review, Notification (1–2 tuần)

- [ ] Review sau khi project hoàn tất (FR-PROJ-10, FR-TRUST liên quan)
- [ ] Job định kỳ tính lại Trust Score + Search Score; denormalize vào profile để search nhanh
- [ ] Notification in-app qua socket + email qua queue (FR-NOTI-01, 02, 04)
- [ ] Featured Photographer trong kết quả tìm kiếm (FR-SEARCH-04)

**Nghiệm thu:** FR-TRUST-01→04, FR-NOTI-01/02/04, FR-DASH-01/02.

## M8 — Admin, Dispute & Go-live (1–2 tuần)

- [ ] Admin: duyệt verification, khoá tài khoản, xử lý dispute, cấu hình hệ thống (FR-ADM-01→04)
- [ ] Admin dashboard thống kê (FR-DASH-03)
- [ ] Hardening: rate limiting, backup định kỳ, error monitoring, logging tập trung
- [ ] Deploy production + CI/CD hoàn chỉnh; kiểm thử tải cho search và chat

**Nghiệm thu:** checklist yêu cầu phi chức năng ([docs/03](./docs/03-non-functional-requirements.md)) đạt; sẵn sàng mở cho nhóm người dùng đầu tiên (soft launch).

---

## Sau MVP (Phase 2+)

Xem [docs/07-mvp-scope.md](./docs/07-mvp-scope.md): app native, Google Calendar sync, web push, Marketplace, AI photo culling, booking quay video, mở rộng ngôn ngữ.
