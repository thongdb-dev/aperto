# 08 — Các quyết định sản phẩm cần chốt

Các điểm chưa được xác định trong brief gốc. Mỗi mục cần Product Owner quyết định **trước khi milestone liên quan khởi động** (xem cột "Chặn milestone"); quyết định được ghi vào cột cuối và coi như một phần của đặc tả.

| # | Câu hỏi | Module | Chặn milestone | Quyết định |
|---|---|---|---|---|
| Q1 | Ngưỡng Trust Score để lên mỗi Level (Bronze/Silver/Gold/Platinum/Elite)? | Trust & Ranking | M7 | _chưa chốt_ |
| Q2 | Trọng số từng thành phần trong công thức Trust Score? | Trust & Ranking | M7 | _chưa chốt_ |
| Q3 | SLA phản hồi booking trước khi tự hết hạn (24h/48h)? | Booking | M4 | _chưa chốt_ |
| Q4 | Tỉ lệ Commission mặc định? Có khác theo hạng Photographer? | Payment | M6 | _chưa chốt_ |
| Q5 | Chi tiết gói Subscription: giá, quyền lợi từng gói? | Business Model | M7 | _chưa chốt_ |
| Q6 | Chính sách lưu trữ ảnh RAW: giới hạn dung lượng/thời gian theo gói? | Storage | M2 | _chưa chốt_ |
| Q7 | Một tài khoản vừa Customer vừa Photographer được không? Chuyển vai trò thế nào? | Auth | M1 | _chưa chốt_ |
| Q8 | Đa tiền tệ (VND/USD) hay chỉ VND cho MVP? | Payment | M4 | _chưa chốt_ |
| Q9 | Quy trình dispute cụ thể: các bước, thời hạn, quyền hạn Admin về hoàn tiền? | Admin/Dispute | M8 | _chưa chốt_ |

## Phương án đề xuất (baseline)

Đề xuất của đội phát triển để Product Owner phê duyệt hoặc điều chỉnh — nếu không có ý kiến khác trước khi milestone tương ứng khởi động, baseline được áp dụng:

- **Q3:** 24 giờ; nhắc qua notification tại mốc 12 giờ.
- **Q4:** 10% cố định cho mọi hạng ở v1.0; ưu đãi theo hạng đưa vào v1.x cùng Subscription.
- **Q6:** 5GB RAW/project; ảnh RAW tự xoá sau 90 ngày kể từ khi project hoàn tất (thông báo trước 7 ngày).
- **Q7:** một tài khoản có thể giữ cả hai vai trò, chuyển đổi qua trang cài đặt; hồ sơ Photographer chỉ công khai sau khi được duyệt.
- **Q8:** chỉ VND ở v1.0; Stripe phục vụ khách thanh toán thẻ quốc tế, quy đổi về VND.
