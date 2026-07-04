# Tuần 15 — Bài tập chi tiết: M7 Trust Score, Review, Notification

> Hướng dẫn thực hành cho [Tuần 15 trong LEARNING.md](../../LEARNING.md#tuần-15--m7-trust-score-review-notification).
>
> Tuần dồn nén — 4 mảng trong 1 tuần, nhưng đều là lắp ghép từ những gì đã có (queue, socket, aggregation).

**Quyết định sản phẩm liên quan:** [Q1 — ngưỡng level](../08-open-questions.md#q1--ngưỡng-trust-level) (Bronze→Elite, cần đồng thời điểm + số project, chỉ tăng), [Q2 — trọng số](../08-open-questions.md#q2--trọng-số-trust-score) (30/20/15/15/10/10, dispute trừ 5đ/lần cap 30).

---

### Buổi 1 (~3h): Review

**Làm:**

- [ ] Schema `reviews`; chỉ được review khi project `completed`, mỗi phía 1 lần (unique index `project_id + customer_id`)
- [ ] Cập nhật `avg_rating` + `review_count` denormalized vào `photographer_profiles` ngay khi có review (tính lại bằng aggregation, không cộng dồn tay — tránh lệch)
- [ ] FE: form review (rating sao + comment) hiện sau khi project completed; danh sách review trên trang profile công khai

### Buổi 2 (~3h): Job tính Trust Score theo Q2

**Học (30'):** `@nestjs/schedule` (`@Cron`) vs BullMQ repeatable job — cron đơn giản nhưng chạy trùng nếu nhiều instance; repeatable job qua Redis không trùng. Chọn repeatable job (đã có hạ tầng) hoặc cron + lock Redis — ghi lý do.

**Làm (2.5h):**

- [ ] Hàm thuần `calculateTrustScore(inputs)` theo đúng bảng Q2: review 30% (chỉ tính khi ≥ 3 review), completed projects 20% (`min(n/50,1)×100`), delivery đúng hạn 15%, verification 15%, response time 10% (bậc thang 1h/6h/24h), repeat rate 10% (×2 cap 100); trừ 5đ/dispute thua trong 12 tháng, cap trừ 30
- [ ] **Unit test hàm này với số liệu tính tay** — mỗi thành phần một test + tổ hợp
- [ ] Job đêm: gom inputs mỗi photographer (aggregation) → tính → ghi `trust_scores` (kèm `breakdown`) + denormalize `trust_score` vào profile
- [ ] Cập nhật `trust_level` theo ngưỡng Q1 — **cần đồng thời** điểm và số project; level **chỉ tăng** (Elite để admin duyệt tay, M8)

### Buổi 3 (~2h): Search Score → cắm vào sort M3

**Làm:**

- [ ] `searchScore = 0.4×trust + 0.25×activity + 0.15×conversion + 0.1×freshness + 0.1×featured` (40/25/15/10/10 — thành phần chưa đo được thì tạm 0, ghi rõ TODO) → denormalize vào profile trong cùng job đêm
- [ ] Đổi sort mặc định của API search (M3) từ rating → `search_score`; giữ option sort theo giá/rating

### Buổi 4 (~3h): Notification — in-app + email

**Làm:**

- [ ] `NotificationService.notify(userId, type, content)`: ghi collection `notifications` + emit socket tới user (room riêng `user:{id}` — join lúc handshake, tái dùng gateway M5) + job email qua queue cho loại quan trọng
- [ ] Thay các chỗ "ghi notification tạm" từ M4 (SLA 12h/24h) bằng service này; thêm notify cho: booking mới, confirmed, delivery ready, payment success, review mới
- [ ] FE: chuông thông báo — badge số chưa đọc, dropdown danh sách, đánh dấu đã đọc, cập nhật real-time qua socket

### Buổi 5 (~3h): Dashboard 2 phía

**Làm:**

- [ ] Dashboard customer (FR-DASH-01): booking sắp tới, project đang chạy, việc cần làm (chọn ảnh, thanh toán mốc…)
- [ ] Dashboard photographer (FR-DASH-02): yêu cầu chờ phản hồi (kèm đếm ngược SLA), lịch tuần, doanh thu tháng (aggregation từ `payments`), Trust Score hiện tại + breakdown
- [ ] Mỗi dashboard 1 endpoint aggregation gộp (`$facet`) thay vì N request — bài ôn aggregation của M3

### Buổi 6 (~2h): Tổng kiểm chứng

- [ ] Kịch bản chuẩn: hoàn tất 1 project với review 5 sao → chạy job (trigger tay) → Trust Score đổi **đúng với số bạn tính tay trên giấy** từ breakdown — lệch là có bug, truy từ `breakdown` trong `trust_scores`
- [ ] Photographer đủ điểm nhưng thiếu project → **không** lên level (đúng Q1)
- [ ] Notification: thao tác ở trình duyệt A → chuông trình duyệt B nhảy real-time
- [ ] Nhật ký: chọn cron hay repeatable job, lý do; các thành phần Search Score còn để 0
