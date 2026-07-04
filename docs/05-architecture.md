# 05 — Kiến trúc hệ thống

## Tech stack

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, TypeScript, MUI, React Query |
| Backend | NestJS, MongoDB, Redis, Socket.IO |
| Storage | Amazon S3 hoặc Cloudflare R2 |
| Payments | Stripe (quốc tế), MoMo, VNPay (nội địa VN) |

## Tổng quan

```
┌──────────────┐   REST (HTTPS)    ┌──────────────┐      ┌─────────────┐
│   Next.js    │◄─────────────────►│    NestJS    │◄────►│   MongoDB   │
│   (client)   │   WSS (Socket.IO) │    (API)     │      └─────────────┘
└──────┬───────┘                   └──┬───────┬───┘      ┌─────────────┐
       │  upload trực tiếp            │       └─────────►│    Redis    │
       │  (presigned URL)             │ webhook          │ cache/queue │
       ▼                              ▼                  └─────────────┘
┌──────────────┐             ┌────────────────────┐
│    S3 / R2   │             │ Stripe/MoMo/VNPay  │
└──────────────┘             └────────────────────┘
```

## Nguyên tắc chính

- **REST cho CRUD, WebSocket cho real-time** — Client giao tiếp với API qua RESTful cho các thao tác thông thường; Conversation và Notification dùng Socket.IO (auth bằng JWT, room theo project).
- **MongoDB là DB chính** — lưu toàn bộ entity ([04-data-model.md](./04-data-model.md)). **Redis** dùng cho cache, session/token revocation, và queue (BullMQ) xử lý bất đồng bộ: gửi email, sinh thumbnail, tính lại Trust Score.
- **Upload trực tiếp lên storage** — FE xin presigned URL từ API rồi upload thẳng lên S3/R2; API chỉ lưu metadata + đường dẫn. Giảm tải BE, tránh nghẽn khi upload ảnh RAW dung lượng lớn.
- **Thanh toán qua webhook** — trạng thái giao dịch được xác nhận bất đồng bộ qua webhook từ cổng thanh toán (idempotent), đảm bảo nhất quán kể cả khi người dùng rời trang giữa chừng.
- **Link tải có kiểm soát** — ảnh delivery dùng signed URL có expiry; watermark cho tới khi thanh toán đủ.

## Giao diện ngoài

- RESTful API + WebSocket API giữa FE và BE.
- SDK Stripe / MoMo / VNPay cho thanh toán.
- SDK S3/R2 cho lưu trữ ảnh.
- Dịch vụ email/OTP bên thứ ba (Resend / SES / Twilio...).
- Toàn bộ qua HTTPS/TLS; socket qua WSS.
