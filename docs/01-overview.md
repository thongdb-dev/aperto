# 01 — Tổng quan sản phẩm

## Vision

Aperto là nền tảng kết nối Photographer và Khách hàng, quản lý toàn bộ vòng đời của một photoshoot từ booking đến bàn giao ảnh.

## Core Concept

Booking chỉ là điểm bắt đầu, không phải điểm kết thúc của trải nghiệm. Mỗi booking được xác nhận sẽ tự động tạo ra một **Project Workspace** — không gian làm việc chung giữa Customer và Photographer — gồm các tab:

> Overview · Conversation · Moodboard · Checklist · RAW Gallery · Selected Photos · Edited Gallery · Delivery · Payment · Review

Toàn bộ giao tiếp, tài liệu, ảnh và thanh toán của một dự án chụp ảnh được quản lý tập trung trong workspace này, thay vì rời rạc qua nhiều kênh (chat riêng, chuyển khoản riêng, gửi ảnh qua Drive...).

## Vai trò người dùng

| Vai trò | Đặc điểm | Mục tiêu sử dụng |
|---|---|---|
| **Customer** | Người dùng phổ thông, chủ yếu dùng mobile web | Tìm và đặt lịch photographer, theo dõi tiến độ, chọn ảnh, thanh toán an toàn, đánh giá |
| **Photographer** | Cá nhân hoặc studio nhỏ, quản lý nhiều dự án cùng lúc | Xây dựng hồ sơ/portfolio, nhận booking, quản lý lịch, bàn giao sản phẩm, nhận thanh toán |
| **Admin** | Đội vận hành nền tảng | Kiểm duyệt, xác minh, xử lý tranh chấp, theo dõi hệ thống và doanh thu |

### Ma trận phân quyền theo module

| Module | Customer | Photographer | Admin |
|---|---|---|---|
| Hồ sơ / Portfolio | Xem, sửa (của mình) | Xem, sửa (của mình) | Xem, khoá |
| Search & Discovery | Sử dụng | — | Cấu hình xếp hạng |
| Availability Calendar | Xem (công khai) | Xem, sửa (của mình) | Xem |
| Booking | Tạo, huỷ (của mình) | Duyệt/từ chối, huỷ | Xem, can thiệp khi dispute |
| Project Workspace | Tham gia (dự án của mình) | Tham gia (dự án của mình) | Xem khi có dispute |
| Payment | Thanh toán | Nhận payout | Xem, đối soát, hoàn tiền |
| Review | Tạo (sau hoàn tất) | Xem, phản hồi | Ẩn nếu vi phạm |
| Dispute | Tạo report | Tạo report | Xử lý, quyết định |
| Cấu hình hệ thống | — | — | Toàn quyền |

## Luồng nghiệp vụ tổng thể

```
Search → Portfolio → Booking → (Optional Deposit) → Project → Shoot
  → RAW Upload → Photo Selection → Editing → Final Delivery → Payment → Review
```

1. **Search** — Customer tìm kiếm Photographer theo khu vực, thể loại, khoảng giá, ngày rảnh; kết quả xếp hạng theo Search Score.
2. **Portfolio** — Customer xem hồ sơ công khai, portfolio, package, review và trust level.
3. **Booking** — Customer gửi yêu cầu đặt lịch (ngày/giờ, địa điểm, package); Photographer accept hoặc reject.
4. **Optional Deposit** — Nếu Booking Policy yêu cầu, Customer thanh toán đặt cọc để xác nhận booking.
5. **Project** — Booking được xác nhận → hệ thống tự tạo Project Workspace.
6. **Shoot** — Hai bên trao đổi qua Conversation/Moodboard/Checklist; buổi chụp diễn ra ngoài hệ thống.
7. **RAW Upload** — Photographer upload ảnh RAW vào RAW Gallery.
8. **Photo Selection** — Customer chọn những ảnh muốn được chỉnh sửa.
9. **Editing** — Photographer chỉnh sửa và upload vào Edited Gallery.
10. **Final Delivery** — Bàn giao bộ ảnh qua tab Delivery (có thể giới hạn tải xuống cho tới khi thanh toán đủ).
11. **Payment** — Customer hoàn tất các khoản còn lại theo Booking Policy.
12. **Review** — Customer đánh giá Photographer; đánh giá góp phần vào Trust Score.

## Ràng buộc thiết kế & triển khai

- Tích hợp tối thiểu một cổng thanh toán nội địa VN (MoMo hoặc VNPay).
- Tuân thủ pháp luật VN về TMĐT và bảo vệ dữ liệu cá nhân.
- Không lưu trực tiếp thông tin thẻ — uỷ quyền toàn bộ cho cổng thanh toán.
- MVP là web responsive; không có app native (xem [07-mvp-scope.md](./07-mvp-scope.md)).

## Giả định & rủi ro chính

**Giả định:**
- Photographer tự chịu trách nhiệm chất lượng dịch vụ thực tế; nền tảng chịu trách nhiệm về minh bạch quy trình.
- Không hỗ trợ thanh toán tiền mặt/chuyển khoản ngoài hệ thống.
- Mỗi tài khoản có một vai trò chính tại một thời điểm (cần xác nhận — xem [08-open-questions.md](./08-open-questions.md)).

**Rủi ro:**
- Tranh chấp chất lượng ảnh mang tính chủ quan, khó phân xử khách quan.
- Người dùng thoả thuận giao dịch ngoài hệ thống để né hoa hồng.
- Double-booking nếu đồng bộ calendar không chặt.
- Chi phí lưu trữ ảnh RAW tăng nhanh — cần chính sách giới hạn/xoá sau thời gian nhất định.
