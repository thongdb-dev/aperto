# 03 — Yêu cầu phi chức năng

## Hiệu năng

- Trang chính (trang chủ, kết quả tìm kiếm, project) tải dưới 3 giây trên 3G/4G trung bình.
- Ảnh được resize, nén, lazy-load và phân phối qua CDN.

## Khả năng mở rộng

- Kiến trúc cho phép thêm loại Payment Milestone, cổng thanh toán, vai trò/module mới mà không đổi lớn cấu trúc dữ liệu.
- Chat và notification thiết kế chịu tải khi số project đồng thời tăng.

## Bảo mật

- Mật khẩu hash bằng bcrypt/argon2, không lưu plaintext.
- JWT access token + refresh token; toàn bộ giao tiếp qua HTTPS/TLS, socket qua WSS.
- Không lưu thông tin thẻ — uỷ quyền cho cổng thanh toán (PCI-DSS mức tối thiểu).
- Giới hạn định dạng và dung lượng file upload (RAW, edited, đính kèm chat).
- Phân quyền theo project — chỉ thành viên project truy cập được dữ liệu project.

## Độ sẵn sàng & tin cậy

- Uptime tối thiểu 99.5% cho dịch vụ lõi (API, thanh toán, upload).
- Backup định kỳ dữ liệu booking, payment và ảnh RAW.

## Khả năng sử dụng

- Responsive desktop + mobile web; mobile-first cho luồng chính.
- Song ngữ Việt/Anh (i18n).
- Luồng booking và chọn ảnh tối giản số bước thao tác.

## Khả năng bảo trì

- Tổ chức mã nguồn theo module nghiệp vụ (feature-based).
- Logging + error monitoring cho production.

## Tuân thủ pháp lý

- Tuân thủ pháp luật VN về TMĐT và bảo vệ dữ liệu cá nhân.
- Người dùng có thể xem/yêu cầu xoá dữ liệu cá nhân của mình.
