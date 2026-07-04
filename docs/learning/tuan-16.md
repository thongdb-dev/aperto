# Tuần 16 — Bài tập chi tiết: M8 Admin & Deploy

> Hướng dẫn thực hành cho [Tuần 16 trong LEARNING.md](../../LEARNING.md#tuần-16--m8-admin--deploy).
>
> Tuần cuối: đưa sản phẩm ra internet thật. Deploy sớm trong tuần (Buổi 1–2) để có thời gian sửa lỗi production — đừng để cuối tuần mới deploy lần đầu.

**Quyết định sản phẩm liên quan:** [Q9 — quy trình dispute 3 bước](../08-open-questions.md#q9--quy-trình-dispute) (phản hồi 48h, admin quyết 5 ngày làm việc, hoàn 0–100% từng khoản, chung thẩm).

---

### Buổi 1–2 (~6h): Deploy trước, admin sau

**Học (1h):** chọn 1 target (gợi ý từ [dev-guide](../dev-guide.md): Railway/Render free tier cho API + Redis, MongoDB Atlas M0, Vercel cho FE). Hiểu: biến môi trường production khác dev thế nào, HTTPS ai lo (platform lo), CORS giữa domain Vercel và domain API.

**Làm (5h):**

- [ ] MongoDB Atlas M0 + Redis managed (Railway/Upstash); cập nhật env validation nếu cần (TLS URI)
- [ ] Deploy API (Dockerfile sẵn có từ M0) — health check `/api/v1/health` xanh trên production
- [ ] Deploy FE lên Vercel, trỏ `NEXT_PUBLIC_API_URL`; CORS chỉ cho phép domain FE; cookie/token hoạt động cross-domain (kiểm tra kỹ nếu dùng cookie httpOnly — cần `SameSite=None; Secure`)
- [ ] CI/CD: merge `main` → tự deploy (Railway/Render auto-deploy hoặc thêm job vào [ci.yml](../../.github/workflows/ci.yml))
- [ ] Stripe webhook production: endpoint thật + signing secret mới (không dùng secret của CLI)

**Tự vấn:** socket.IO qua Vercel/Railway có gì cần lưu ý? (FE Vercel chỉ là client — OK; API cần platform hỗ trợ WebSocket, Railway/Render có).

### Buổi 3 (~3h): Admin — duyệt verification + thống kê

**Làm:**

- [ ] Role `admin` (seed 1 tài khoản bằng script); guard admin cho toàn bộ route `/admin/*`
- [ ] Duyệt verification: danh sách photographer `pending` → approve/reject (Q7: duyệt xong hồ sơ mới công khai; approve → verification 15% trong Trust Score đổi ở job đêm)
- [ ] Dashboard thống kê bằng aggregation: user mới theo tuần, booking theo status, GMV + commission theo tháng — 1 endpoint `$facet`
- [ ] FE admin tối giản: bảng + nút, không cần đẹp (MUI DataGrid là đủ)

### Buổi 4 (~3h): Dispute theo Q9

**Làm:**

- [ ] Schema `disputes`: project_id, opened_by, loại, mô tả, evidence, response của bên kia, quyết định admin. Điều kiện mở: thành viên project, trong **7 ngày** kể từ delivery/huỷ; project → `disputed`, **tạm giữ payout** (chặn payment mới — đã làm ở M6)
- [ ] Bước 2: bên kia có **48h** phản hồi (delayed job nhắc — pattern M4); hai bên có thể tự đóng
- [ ] Bước 3: admin quyết — hoàn 0–100% **từng khoản** deposit/milestone/final (gọi refund M6), lý do bằng văn bản gửi 2 bên (notification M7), đóng dispute; thua dispute → Trust Score trừ điểm ở job đêm (Q2)
- [ ] FE: form mở dispute trong Project Workspace + màn admin xử lý (xem evidence, timeline, quyết định)

### Buổi 5 (~3h): Hardening — rate limit, Sentry, backup

**Làm:**

- [ ] `@nestjs/throttler`: rate limit chặt cho `/auth/*` (ví dụ 5 req/phút cho login — chống brute-force), mức thường cho API còn lại
- [ ] Sentry cho cả API (`@sentry/nestjs`) và FE (`@sentry/nextjs`), env DSN riêng production
- [ ] Backup Mongo: Atlas M0 không có backup tự động — viết script `mongodump` chạy định kỳ (GitHub Actions schedule đẩy lên storage là cách free), hoặc ghi rõ rủi ro vào Nhật ký nếu hoãn

### Buổi 6 (~2h): Tổng kiểm chứng — nghiệm thu cả project

- [ ] **Gửi link production cho một người bạn**: đăng ký → tìm photographer → đặt booking → (bạn đóng vai photographer confirm) → thanh toán test → nhận ảnh — end-to-end **bằng điện thoại**, không hướng dẫn gì thêm. Ghi lại mọi chỗ họ vấp: đó là backlog UX thật
- [ ] Cố tình throw error ở một endpoint → thấy event trên Sentry trong vài giây, kèm stack trace đúng
- [ ] Bắn 10 request login liên tiếp → bị 429
- [ ] Nhật ký tổng kết 16 tuần: 3 khái niệm BE giá trị nhất đã học, 3 quyết định kỹ thuật sẽ làm khác nếu làm lại, và danh sách backlog còn nợ (Google login, VNPay/MoMo, retention job Q6, E2E Playwright, load test k6)

---

## Sau tuần 16

Backlog trong [LEARNING.md](../../LEARNING.md#backlog-làm-khi-có-thời-gian-không-chặn-tiến-độ) giờ là danh sách "vừa học vừa cải tiến": mỗi item là một buổi cuối tuần. Ưu tiên gợi ý: retention job Q6 (dùng repeatable job đã học M7) → E2E Playwright (bảo vệ luồng booking khỏi regression) → VNPay sandbox (so sánh với Stripe, phỏng vấn hay hỏi).
