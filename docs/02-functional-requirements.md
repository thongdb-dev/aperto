# 02 — Yêu cầu chức năng

Các module theo brief gốc: Authentication, Photographer Profile, Portfolio, Search, Availability Calendar, Booking, Project Workspace, Notification, Dashboard, Payment. Bổ sung Trust & Ranking và Admin/Dispute Management như hai module nền tảng.

## 1. Authentication & Account Management

- **FR-AUTH-01** — Đăng ký bằng email hoặc số điện thoại, chọn vai trò (Customer/Photographer) khi đăng ký.
- **FR-AUTH-02** — Đăng nhập email/mật khẩu; hỗ trợ social login Google/Facebook.
- **FR-AUTH-03** — Xác thực tài khoản qua OTP (SMS/email) hoặc link xác thực trước khi kích hoạt đầy đủ.
- **FR-AUTH-04** — Đặt lại mật khẩu qua email/SMS.
- **FR-AUTH-05** — Quản lý phiên bằng access token + refresh token; đăng xuất thiết bị hiện tại hoặc toàn bộ.
- **FR-AUTH-06** — Customer có thể đăng ký trở thành Photographer không cần tạo tài khoản mới *(cần xác nhận — Q7)*.

## 2. Photographer Profile

- **FR-PROF-01** — Tạo/sửa hồ sơ: tên hiển thị, avatar, bio, thể loại chuyên môn, khu vực hoạt động, số năm kinh nghiệm, ngôn ngữ.
- **FR-PROF-02** — Khai báo và quản lý Package cùng Booking Policy tương ứng.
- **FR-PROF-03** — Đăng ký xác minh danh tính (CCCD, GPKD nếu có); hiển thị badge "Verified".
- **FR-PROF-04** — Customer xem hồ sơ công khai: portfolio, package, review, trust level, trạng thái xác minh.

## 3. Portfolio

- **FR-PORT-01** — Tạo album theo thể loại, upload nhiều ảnh, chọn ảnh bìa.
- **FR-PORT-02** — Gắn tag/thể loại cho album, sắp xếp thứ tự hiển thị.
- **FR-PORT-03** — Giới hạn số ảnh/dung lượng theo gói subscription.
- **FR-PORT-04** — Customer xem dạng lưới, phóng to chi tiết, lọc theo thể loại.

## 4. Search & Discovery

- **FR-SEARCH-01** — Tìm theo từ khoá, khu vực, thể loại, khoảng giá, ngày còn trống.
- **FR-SEARCH-02** — Bộ lọc nâng cao: rating tối thiểu, trust level, khoảng cách, verified.
- **FR-SEARCH-03** — Kết quả xếp hạng theo Search Score (xem [06-business-model-and-trust.md](./06-business-model-and-trust.md)).
- **FR-SEARCH-04** — Hiển thị Featured Photographer ở vị trí ưu tiên.

## 5. Availability Calendar

- **FR-CAL-01** — Photographer thiết lập lịch rảnh/bận theo ngày hoặc khung giờ, hỗ trợ recurring.
- **FR-CAL-02** — Tự động block ngày/giờ đã có booking xác nhận.
- **FR-CAL-03** — Customer chỉ chọn được ngày/giờ còn trống khi booking.
- **FR-CAL-04** — *(Phase sau)* Đồng bộ hai chiều Google Calendar.

## 6. Booking

- **FR-BOOK-01** — Customer gửi yêu cầu booking: ngày/giờ, địa điểm, package, ghi chú.
- **FR-BOOK-02** — Áp dụng Booking Policy tại thời điểm booking:
  - Deposit: optional; theo **percentage** hoặc **fixed amount**
  - Refund Policy: **full** / **before X days** / **non-refundable**
  - Payment Milestones: hỗ trợ mở rộng
- **FR-BOOK-03** — Photographer accept/reject trong thời hạn SLA *(giá trị cần xác nhận — Q3)*; booking tự hết hạn nếu quá hạn.
- **FR-BOOK-04** — Booking được accept → tự động tạo Project Workspace.
- **FR-BOOK-05** — Hai bên có thể huỷ booking; hệ thống tự tính tiền hoàn theo Refund Policy đã snapshot.
- **FR-BOOK-06** — Xem lịch sử booking theo trạng thái: `pending / confirmed / in_progress / completed / cancelled / disputed`.

## 7. Project Workspace

Mỗi booking xác nhận sinh ra một Project Workspace gồm các tab:

- **FR-PROJ-01 (Overview)** — Thông tin tổng quan: ngày chụp, địa điểm, package, trạng thái, timeline các mốc quan trọng.
- **FR-PROJ-02 (Conversation)** — Chat real-time trong phạm vi project; gửi văn bản, ảnh, file đính kèm; thông báo tin nhắn mới.
- **FR-PROJ-03 (Moodboard)** — Upload/ghim ảnh tham khảo phong cách, kèm ghi chú ý tưởng.
- **FR-PROJ-04 (Checklist)** — Danh sách công việc/shot list (đạo cụ, trang phục, địa điểm, mốc giờ); đánh dấu hoàn thành.
- **FR-PROJ-05 (RAW Gallery)** — Photographer upload ảnh thô sau buổi chụp; hiển thị lưới thumbnail; giới hạn dung lượng theo cấu hình.
- **FR-PROJ-06 (Selected Photos)** — Customer chọn (favorite) ảnh muốn edit; comment trên từng ảnh; số lượng chọn giới hạn theo package.
- **FR-PROJ-07 (Edited Gallery)** — Photographer upload ảnh đã edit; hỗ trợ upload lại (version) khi Customer yêu cầu sửa thêm.
- **FR-PROJ-08 (Delivery)** — Đóng gói bàn giao bộ ảnh cuối; watermark cho tới khi thanh toán đủ; link tải có thời hạn (expiry).
- **FR-PROJ-09 (Payment)** — Theo dõi trạng thái các khoản (deposit, milestone, final); lịch sử giao dịch và hoá đơn.
- **FR-PROJ-10 (Review)** — Sau Delivery + Payment hoàn tất, Customer đánh giá (sao + nhận xét); góp phần Trust Score.
- **FR-PROJ-11 (Timeline log)** — Tự động log các sự kiện quan trọng (booking confirmed, deposit paid, RAW uploaded, photo selected, edited delivered, payment completed) hiển thị ở Overview.

## 8. Notification

- **FR-NOTI-01** — Thông báo in-app: booking mới, tin nhắn mới, thanh toán, ảnh sẵn sàng, review mới, cảnh báo hệ thống.
- **FR-NOTI-02** — Email cho sự kiện quan trọng: booking xác nhận, thanh toán thành công, ảnh sẵn sàng bàn giao.
- **FR-NOTI-03** — *(Phase sau)* Web push notification.
- **FR-NOTI-04** — Bật/tắt thông báo theo kênh trong cài đặt tài khoản.

## 9. Dashboard

- **FR-DASH-01 (Customer)** — Danh sách booking/project đang chạy, lịch sử thanh toán.
- **FR-DASH-02 (Photographer)** — Thống kê doanh thu, booking theo trạng thái, Trust Score/Level, lịch sắp tới.
- **FR-DASH-03 (Admin)** — Tổng người dùng, doanh thu/hoa hồng, tổng booking, dispute chờ xử lý, biểu đồ tăng trưởng.

## 10. Payment

- **FR-PAY-01** — Tích hợp Stripe (quốc tế) và MoMo/VNPay (nội địa).
- **FR-PAY-02** — Xử lý Deposit khi booking xác nhận (nếu policy yêu cầu).
- **FR-PAY-03** — Hỗ trợ Payment Milestones — nhiều đợt thanh toán trong một project.
- **FR-PAY-04** — Tự động tính Commission trên mỗi giao dịch thành công theo % cấu hình.
- **FR-PAY-05** — Payout cho Photographer (định kỳ hoặc theo yêu cầu) sau khi trừ hoa hồng.
- **FR-PAY-06** — Xuất hoá đơn/biên nhận điện tử sau mỗi giao dịch.
- **FR-PAY-07** — Tự động refund theo Refund Policy khi booking huỷ.

## 11. Trust & Ranking

- **FR-TRUST-01** — Level: **Bronze → Silver → Gold → Platinum → Elite**; chỉ tăng, không hạ cấp.
- **FR-TRUST-02** — Trust Score tính từ: completed projects, review, response time, delivery time, repeat customer, dispute (âm), verification.
- **FR-TRUST-03** — Ngưỡng điểm lên level *(cần xác nhận — Q1)*.
- **FR-TRUST-04** — Trust Score/Level hiển thị công khai và là đầu vào của Search Score.

## 12. Admin & Dispute Management

- **FR-ADM-01** — Duyệt/khoá tài khoản Photographer; duyệt hồ sơ xác minh.
- **FR-ADM-02** — Xử lý dispute: xem chi tiết project, quyết định hoàn tiền một phần/toàn bộ.
- **FR-ADM-03** — Cấu hình: % hoa hồng, gói subscription, banner featured, danh mục thể loại.
- **FR-ADM-04** — Quản lý nội dung vi phạm được báo cáo.
