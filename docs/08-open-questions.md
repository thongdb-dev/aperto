# 08 — Các quyết định sản phẩm

Các điểm chưa được xác định trong brief gốc, đã được Product Owner quyết định ngày **05/07/2026**. Các quyết định dưới đây là một phần của đặc tả; thay đổi phải qua Product Owner và được ghi lại tại đây (kèm ngày, lý do).

## Bảng tổng hợp

| # | Câu hỏi | Module | Chặn milestone | Quyết định |
|---|---|---|---|---|
| Q1 | Ngưỡng Trust Score lên Level? | Trust & Ranking | M7 | ✅ Thang 0–100 + điều kiện số project (chi tiết bên dưới) |
| Q2 | Trọng số công thức Trust Score? | Trust & Ranking | M7 | ✅ Review 30 / Project 20 / Delivery 15 / Verification 15 / Response 10 / Repeat 10; dispute trừ điểm |
| Q3 | SLA phản hồi booking? | Booking | M4 | ✅ 24 giờ, nhắc ở mốc 12 giờ |
| Q4 | Tỉ lệ Commission? | Payment | M6 | ✅ 10% cố định cho mọi hạng ở v1.0 |
| Q5 | Chi tiết gói Subscription? | Business Model | M7 | ✅ Free / Pro 199k / Studio 499k mỗi tháng; mở bán v1.x |
| Q6 | Chính sách lưu trữ ảnh RAW? | Storage | M2 | ✅ 5GB/project, giữ 90 ngày sau hoàn tất (mở rộng theo gói) |
| Q7 | Một tài khoản hai vai trò? | Auth | M1 | ✅ Cho phép; chuyển vai trò trong settings; hồ sơ Photographer phải được duyệt |
| Q8 | Đa tiền tệ? | Payment | M4 | ✅ Chỉ VND ở v1.0 |
| Q9 | Quy trình dispute? | Admin/Dispute | M8 | ✅ Quy trình 3 bước, admin quyết trong 5 ngày làm việc (chi tiết bên dưới) |

## Chi tiết quyết định

### Q1 — Ngưỡng Trust Level

Trust Score theo thang 0–100. Lên level cần đạt **đồng thời** ngưỡng điểm và số project hoàn tất, tránh trường hợp photographer mới có 1–2 review 5 sao đã lên hạng cao:

| Level | Trust Score tối thiểu | Project hoàn tất tối thiểu |
|---|---|---|
| Bronze | 0 (mặc định khi được duyệt hồ sơ) | 0 |
| Silver | 40 | 5 |
| Gold | 60 | 20 |
| Platinum | 80 | 50 |
| Elite | 90 | 100 + duyệt thủ công bởi Admin |

Level chỉ tăng, không hạ (theo FR-TRUST-01). Elite thêm bước duyệt thủ công để giữ giá trị của hạng cao nhất.

### Q2 — Trọng số Trust Score

Điểm nền = tổng có trọng số của các thành phần (mỗi thành phần chuẩn hoá 0–100):

| Thành phần | Trọng số | Cách chuẩn hoá |
|---|---|---|
| Review rating trung bình | 30% | (avg_rating / 5) × 100, chỉ tính khi có ≥ 3 review |
| Completed projects | 20% | min(số project / 50, 1) × 100 |
| Delivery đúng hạn | 15% | tỉ lệ % project bàn giao đúng/sớm hạn cam kết |
| Verification | 15% | 100 nếu verified, 0 nếu chưa |
| Response time | 10% | ≤ 1h: 100; ≤ 6h: 75; ≤ 24h: 50; > 24h: 25 |
| Repeat customer rate | 10% | tỉ lệ % khách đặt lại × 2 (cap 100) |

**Điểm phạt dispute:** trừ 5 điểm cho mỗi dispute bị xử thua trong 12 tháng gần nhất, tối đa trừ 30 điểm. Dispute thắng không bị trừ.

Tính lại: khi project hoàn tất, khi có review mới, khi dispute đóng, và job định kỳ hằng đêm. Công thức sẽ được hiệu chỉnh sau 3 tháng vận hành dựa trên phân bố dữ liệu thực tế — mọi hiệu chỉnh ghi lại tại file này.

### Q3 — SLA phản hồi booking

**24 giờ** kể từ khi Customer gửi yêu cầu. Notification nhắc Photographer ở mốc 12 giờ. Quá 24 giờ booking chuyển `expired`, Customer được thông báo kèm gợi ý photographer tương tự. Tỉ lệ để expire ảnh hưởng tiêu cực đến Response Score (Q2).

### Q4 — Commission

**10% cố định** trên tổng giá trị booking, áp dụng mọi hạng photographer ở v1.0 — đơn giản, dễ truyền thông, dễ đối soát. Ưu đãi giảm hoa hồng theo hạng/subscription xem xét ở v1.x cùng lúc mở bán Subscription (Q5), sau khi có số liệu biên lợi nhuận thực tế.

### Q5 — Gói Subscription

| | Free | Pro — 199.000đ/tháng | Studio — 499.000đ/tháng |
|---|---|---|---|
| Ảnh portfolio | 50 | 500 | Không giới hạn |
| Số package | 3 | Không giới hạn | Không giới hạn |
| Lưu trữ RAW/project | 5GB / 90 ngày | 10GB / 180 ngày | 20GB / 365 ngày |
| Badge trên hồ sơ | — | Pro | Studio |
| Featured slot | — | — | 1 lần/tháng |

Hạ tầng cấu hình gói xây ở M7, **mở bán từ v1.x** khi nền tảng đạt ~200 photographer hoạt động. Trước đó mọi tài khoản hưởng quyền lợi Free.

### Q6 — Lưu trữ ảnh RAW

- Mặc định (Free): **5GB RAW/project**, lưu **90 ngày** kể từ khi project hoàn tất.
- Hết hạn: hệ thống thông báo trước 7 ngày qua email + in-app; quá hạn ảnh RAW bị xoá vĩnh viễn (ảnh edited và delivery giữ vô thời hạn).
- Gói Pro/Studio mở rộng theo bảng ở Q5.
- Lý do: RAW là loại dữ liệu nặng nhất và ít được truy cập lại sau khi đã chọn ảnh — giới hạn này giữ chi phí storage tuyến tính với doanh thu.

### Q7 — Vai trò kép

- Một tài khoản có thể giữ **cả hai vai trò** Customer và Photographer; chuyển ngữ cảnh qua trang cài đặt (role switcher).
- Đăng ký làm Photographer từ tài khoản Customer = mở rộng hồ sơ (FR-AUTH-06), không tạo tài khoản mới.
- Hồ sơ Photographer chỉ công khai sau khi Admin duyệt; trong lúc chờ duyệt, tài khoản vẫn dùng bình thường ở vai trò Customer.
- Ràng buộc: một tài khoản không được tự booking chính mình; review giữa hai tài khoản có quan hệ trùng thiết bị/thanh toán bị đánh dấu để chống thao túng Trust Score.

### Q8 — Tiền tệ

**Chỉ VND** ở v1.0 — toàn bộ giá niêm yết, giao dịch, đối soát và payout bằng VND. Stripe phục vụ khách dùng thẻ quốc tế nhưng charge bằng VND. Đa tiền tệ chỉ xem xét khi mở thị trường ngoài Việt Nam.

### Q9 — Quy trình dispute

**Điều kiện mở:** một trong hai bên mở dispute từ Project Workspace, trong vòng **7 ngày** kể từ mốc gần nhất (delivery hoặc ngày huỷ booking). Project chuyển trạng thái `disputed`, mọi khoản payout liên quan bị **tạm giữ**.

**Quy trình 3 bước:**

1. **Mở dispute** — bên mở chọn loại (chất lượng ảnh / không đúng cam kết / vấn đề thanh toán / khác), mô tả và đính kèm bằng chứng. Toàn bộ Conversation, Timeline log và Gallery của project tự động là hồ sơ tham chiếu.
2. **Phản hồi** — bên còn lại có **48 giờ** để phản hồi và bổ sung bằng chứng. Hai bên có thể tự thoả thuận và đóng dispute ở bước này.
3. **Phân xử** — Admin ra quyết định trong **5 ngày làm việc**: hoàn tiền 0–100% các khoản đã thanh toán (theo từng khoản deposit/milestone/final), kèm lý do bằng văn bản gửi cả hai bên.

**Quyền hạn Admin:** hoàn tiền một phần/toàn bộ; cảnh cáo hoặc khoá tài khoản bên vi phạm; quyết định ở v1.0 là **chung thẩm** (không có kháng nghị trong hệ thống). Dispute xử thua ảnh hưởng Trust Score theo Q2.
