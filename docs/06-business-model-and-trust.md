# 06 — Business Model & Trust/Ranking

## Business Model

| Nguồn doanh thu | Mô tả |
|---|---|
| **Commission** | Hoa hồng trên mỗi giao dịch booking thành công |
| **Photographer Subscription** | Gói trả phí tháng/năm: nhiều ảnh portfolio hơn, ưu tiên hiển thị, giảm % hoa hồng |
| **Featured Photographer** | Trả phí để hiển thị ưu tiên trong tìm kiếm/trang chủ |
| **Ads** | Banner cho dịch vụ liên quan (studio, trang phục, makeup...) |
| **Marketplace** | Album in, khung ảnh, in ấn — *định hướng sau MVP* |

> Commission: **10% cố định** ở v1.0. Subscription: Free / Pro 199k / Studio 499k mỗi tháng, mở bán từ v1.x. Chi tiết theo Q4, Q5 — [08-open-questions.md](./08-open-questions.md).

## Trust Level

Level chỉ **tăng dần**, không hạ cấp kể cả khi Trust Score giảm:

```
Bronze → Silver → Gold → Platinum → Elite
```

## Trust Score

Tính lại định kỳ (ví dụ sau mỗi project hoàn tất) từ các thành phần:

| Thành phần | Ảnh hưởng | Ghi chú |
|---|---|---|
| Completed projects | ➕ | Số project hoàn tất thành công |
| Review rating trung bình | ➕ | Điểm đánh giá từ Customer |
| Response time | ➕ nếu nhanh | Thời gian phản hồi booking/tin nhắn |
| Delivery time | ➕ nếu đúng/sớm hạn | So với cam kết |
| Repeat customer rate | ➕ | Tỉ lệ khách quay lại |
| Dispute count | ➖ | Số tranh chấp |
| Verification status | ➕ (cộng cố định) | Đã xác minh danh tính |

> Trọng số cụ thể (Review 30 / Project 20 / Delivery 15 / Verification 15 / Response 10 / Repeat 10, dispute trừ tối đa 30 điểm) và ngưỡng lên level: xem Q1, Q2 — [08-open-questions.md](./08-open-questions.md).

## Search Score

Công thức xếp hạng kết quả tìm kiếm:

```
Search Score = 40% Trust + 25% Portfolio + 15% Distance + 10% Response + 10% Recent Activity
```

| Thành phần | Tỉ trọng | Đầu vào (đề xuất) |
|---|---|---|
| Trust Score | 40% | Chuẩn hoá từ Trust Score hiện tại |
| Portfolio Score | 25% | Số lượng/chất lượng ảnh, mức đầy đủ hồ sơ |
| Distance Score | 15% | Khoảng cách Customer ↔ Photographer, càng gần càng cao |
| Response Score | 10% | Thời gian phản hồi trung bình |
| Recent Activity | 10% | Đăng nhập, cập nhật portfolio, nhận booking gần đây |

> Công thức chuẩn hoá từng thành phần về thang chung (0–100) thiết kế chi tiết khi triển khai, điều chỉnh theo dữ liệu thực tế.
