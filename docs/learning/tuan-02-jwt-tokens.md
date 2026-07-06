# Tuần 2 — Ghi chú lý thuyết: JWT, Access/Refresh token & Rotation

> Ghi chú đồng hành với **Buổi 2** và **Buổi 4** trong [tuan-02-03.md](./tuan-02-03.md) — gộp chung vì cả hai đều xoay quanh vòng đời của token. Đọc song song với [jwt.io/introduction](https://jwt.io/introduction). Phần thực hành: [tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md).

---

## 1. JWT là gì — cấu trúc 3 phần

JWT (JSON Web Token) là một chuỗi 3 phần nối bằng dấu chấm: `header.payload.signature`.

- **Header**: `{"alg": "HS256", "typ": "JWT"}` — thuật toán ký, encode base64url.
- **Payload**: dữ liệu bạn muốn mang theo — ví dụ `{"sub": "<userId>", "roles": ["customer"], "exp": 1735689600}`. Cũng chỉ encode base64url, **không mã hoá**.
- **Signature**: `HMACSHA256(base64url(header) + "." + base64url(payload), secretKey)` — chữ ký chứng minh token không bị sửa.

Điểm cực kỳ quan trọng hay bị hiểu nhầm: **payload chỉ encode, không encrypt**. Dán một JWT bất kỳ vào [jwt.io](https://jwt.io) là đọc được payload ngay, không cần secret. Secret chỉ dùng để **ký** và **verify chữ ký** — đảm bảo payload không bị ai sửa mà không bị phát hiện, chứ không giấu được nội dung. Hệ quả thực hành: **không bao giờ nhét thông tin nhạy cảm** (mật khẩu, số thẻ...) vào payload JWT.

```ts
// Ký token bằng @nestjs/jwt
this.jwtService.sign(
  { sub: user._id.toString(), roles: user.roles },
  { expiresIn: '15m' },
);
```

`JwtService.verify()` làm ngược lại: giải mã payload + kiểm tra chữ ký khớp secret + kiểm tra `exp` chưa quá hạn. Sai bất kỳ điều kiện nào → throw.

## 2. Access token vs Refresh token — tại sao cần 2 loại

Một câu hỏi tự nhiên: sao không dùng 1 token sống lâu luôn cho tiện? Vấn đề là **JWT không revoke được giữa chừng** — một khi đã ký và còn hạn, ai cầm token đó dùng được, server không có cách "thu hồi" nó trước khi hết hạn (trừ khi tra danh sách đen ở mỗi request, mất hết lợi ích stateless của JWT). Nếu access token sống 7 ngày và bị đánh cắp, kẻ tấn công dùng được nguyên 7 ngày.

Giải pháp là **tách 2 vai trò**:

| | Access token | Refresh token |
|---|---|---|
| Thời hạn | ngắn (15 phút) | dài (7 ngày) |
| Dùng để | đi kèm **mọi** request cần xác thực | chỉ gọi `/auth/refresh` để xin access token mới |
| Nơi verify | mọi request, bằng JWT verify (không chạm DB) | phải đối chiếu với Redis (có thể revoke) |
| Rủi ro khi lộ | nhỏ — tự hết hạn sau 15 phút | lớn hơn nhưng **kiểm soát được** — server có thể revoke chủ động (mục 4) |

Access token ngắn hạn giới hạn "cửa sổ thiệt hại" nếu bị đánh cắp mà server không kịp phản ứng. Refresh token sống lâu nhưng được lưu **trạng thái phía server** (Redis) nên revoke được ngay lập tức — đánh đổi giữa 2 token là đánh đổi giữa "stateless nhanh, không revoke được" và "stateful, revoke được".

## 3. Lưu token ở đâu: cookie httpOnly vs localStorage

| | Cookie `httpOnly` | localStorage |
|---|---|---|
| JavaScript đọc được? | **Không** — httpOnly chặn `document.cookie` truy cập | Có — bất kỳ script nào chạy trên trang đều đọc được |
| Rủi ro XSS | Thấp hơn nhiều — script độc hại chèn vào trang không lấy được token | Cao — 1 lỗ hổng XSS là lộ token ngay |
| Rủi ro CSRF | Có (cookie tự động gửi kèm mọi request tới domain) — cần `SameSite` + CSRF token | Không tự động gửi kèm — phải chủ động gắn header, tránh được CSRF |
| Độ phức tạp | Cần cấu hình CORS + cookie attributes đúng (đặc biệt cross-domain FE/API) | Đơn giản hơn, chỉ cần đọc/ghi qua JS |

Không có lựa chọn nào miễn phí — cookie đổi rủi ro XSS lấy rủi ro CSRF, ngược lại. Thực tế phổ biến: **access token** để tạm trong bộ nhớ JS (biến, không phải localStorage — mất khi refresh trang nhưng đó là lý do cần refresh token phục hồi), **refresh token** để trong cookie `httpOnly + Secure + SameSite=Strict/Lax` — vì refresh token sống lâu và nguy hiểm hơn nếu lộ, nó xứng đáng được bảo vệ khỏi XSS hơn; CSRF của riêng nó giảm nhẹ vì cookie chỉ gửi tới đúng 1 endpoint `/auth/refresh` (không phải mọi route).

Đây là quyết định cần **chọn 1 và ghi trade-off vào Nhật ký** — không có đáp án đúng tuyệt đối, chỉ có đánh đổi phù hợp với bối cảnh (ví dụ FE và API có cùng domain hay không sẽ ảnh hưởng độ phức tạp cấu hình cookie).

## 4. Refresh rotation & reuse detection

**Vấn đề:** nếu dùng refresh token nhiều lần mà không đổi, và nó bị đánh cắp (ví dụ qua log server, hoặc máy dùng chung), kẻ tấn công dùng được token đó suốt 7 ngày y hệt chủ sở hữu thật — không cách nào phân biệt.

**Rotation** giải quyết: **mỗi lần refresh, token cũ bị vô hiệu ngay và cấp token mới**. Cách này biến refresh token thành "dùng một lần" (single-use), dù thời hạn vẫn 7 ngày.

Điều thú vị hơn là **reuse detection** — hệ quả tự nhiên của rotation: nếu ai đó dùng lại một refresh token *đã bị rotate* (tức đã dùng để refresh trước đó), đây gần như chắc chắn là dấu hiệu **có 2 bên đang giữ cùng một token** — chủ sở hữu thật (dùng bản mới nhất) và kẻ tấn công (đang cầm bản cũ, ăn cắp trước đó, giờ mới dùng). Khi phát hiện, phản ứng đúng là **revoke toàn bộ session của user đó** (xoá hết refresh token liên quan trong Redis), buộc đăng nhập lại — coi như tài khoản đã bị xâm phạm cho tới khi chứng minh ngược lại.

Thiết kế trong Redis:

```
key:   refresh:{userId}:{tokenId}
value: hash(refreshToken)          # không lưu token thô, tránh lộ nếu Redis bị đọc trộm
ttl:   7 ngày                       # khớp thời hạn refresh token
```

Luồng `/auth/refresh`:

1. Verify chữ ký + hạn của refresh token JWT (giống access token, nhưng dùng secret riêng).
2. Lấy `tokenId` từ payload, tra Redis `refresh:{userId}:{tokenId}`.
3. **Không thấy** → đây chính là dấu hiệu reuse (đã bị rotate/xoá trước đó) hoặc token giả → 401, cân nhắc revoke toàn bộ.
4. **Thấy và khớp hash** → xoá key cũ ngay (rotation), sinh `tokenId` mới, ký cặp access+refresh mới, lưu key mới vào Redis.

`logout` chỉ đơn giản là xoá key hiện tại khỏi Redis — lần refresh kế tiếp với token đó sẽ rơi vào bước 3 (không thấy → 401).

---

## Bức tranh ghép lại

**JWT** là một cấu trúc ký-nhưng-không-mã-hoá gồm header/payload/signature → tách thành **access token** (ngắn hạn, verify nhanh không chạm DB, đi kèm mọi request) và **refresh token** (dài hạn, đối chiếu Redis nên revoke được) để cân bằng giữa tốc độ và khả năng thu hồi → nơi lưu (cookie httpOnly vs localStorage) là đánh đổi XSS/CSRF, chọn theo bối cảnh → **rotation** biến refresh token thành dùng-một-lần, và tác dụng phụ tự nhiên của nó là **reuse detection** — công cụ phát hiện token bị đánh cắp mà không cần thêm cơ chế riêng.

Vẽ sequence diagram luồng refresh (3 tình huống: access hết hạn / refresh hợp lệ / refresh đã bị rotate) chính là mục ✅ giữa module — làm ở [Lab 4 trong tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md#lab-4-refresh-token--rotation--redis).
