# Learning Path — vừa học vừa làm Aperto

Lộ trình cá nhân bám theo các milestone trong [ROADMAP.md](./ROADMAP.md), thiết kế cho xuất phát điểm: **FE dev đã vững Next.js / TypeScript / React Query, chưa có kinh nghiệm BE**.

## Nguyên tắc

1. **Học just-in-time** — chỉ học thứ tuần đó cần dùng, không học trước cả framework. Đọc docs chính chủ trước, tutorial sau.
2. **Build first** — mỗi khái niệm mới phải được dùng ngay vào code Aperto trong cùng tuần. Không có "tuần chỉ học lý thuyết".
3. **Kiểm chứng được** — cuối mỗi tuần có mục ✅: nếu chưa tick được, chưa chuyển tuần mới (chấp nhận trượt tiến độ, không chấp nhận trượt kiến thức).
4. **Timebox debug** — kẹt quá 2 giờ thì ghi lại vấn đề, hỏi AI/cộng đồng, không tự đào vô hạn.
5. **Ghi log học tập** — mỗi tuần thêm vài dòng vào mục [Nhật ký](#nhật-ký) cuối file: học được gì, kẹt ở đâu, quyết định kỹ thuật nào đã đưa ra.

**Tổng thời gian dự kiến:** ~16 tuần, mỗi tuần 10–15 giờ ngoài giờ làm.

---

## Tuần 1 — M0: Hạ tầng & khung dự án

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-01.md](./docs/learning/tuan-01.md)

**📚 Học**
- [x] Docker cơ bản: image vs container, volume, network, Dockerfile, docker-compose (docs chính chủ + chạy thử)
- [x] NestJS overview: module / controller / provider / dependency injection — đọc phần Overview trong docs NestJS (~2h)
- [x] Monorepo với npm workspaces hoặc Turborepo (chọn 1, đọc quick start)

**🔨 Làm**
- [x] Scaffold monorepo: `apps/web` (Next.js + TS + MUI + React Query) và `apps/api` (NestJS)
- [x] `docker-compose.yml`: MongoDB + Redis; API chạy local bằng `npm run start:dev`
- [x] ESLint/Prettier chung, `.env` + validation env bằng `@nestjs/config` + Joi
- [x] GitHub Actions: lint + build cho cả 2 app
- [x] Endpoint `GET /health` trả về trạng thái kết nối Mongo + Redis

**✅ Kiểm chứng**
- [x] Máy sạch (hoặc xoá node_modules + volume) chỉ cần `docker compose up` + `npm i` + 1 lệnh là chạy được
- [x] Giải thích được bằng lời: DI trong NestJS hoạt động thế nào, tại sao service được inject vào controller

## Tuần 2–3 — M1: Authentication

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-02-03.md](./docs/learning/tuan-02-03.md)

**📚 Học**
- [x] JWT: cấu trúc token, access vs refresh, tại sao cần rotation, lưu token ở đâu (cookie httpOnly vs localStorage — trade-off)
- [x] NestJS: Guard, custom decorator (`@CurrentUser()`), Passport strategy (local + JWT)
- [x] bcrypt: salt, cost factor; tại sao không dùng SHA256 cho mật khẩu
- [x] Mongoose: schema, model, index unique

**🔨 Làm**
- [x] `users` collection theo [docs/04-data-model.md](./docs/04-data-model.md); đăng ký + hash mật khẩu
- [x] Login trả access (15 phút) + refresh token (7 ngày); refresh rotation; revoke qua Redis khi logout
- [x] `RolesGuard` phân quyền customer/photographer/admin theo Q7 (vai trò kép)
- [x] OTP email xác thực tài khoản (dùng Resend/Mailtrap cho dev) — `POST /auth/verify-otp` đã nối, `register()` tự gửi OTP, xác thực đúng sẽ chuyển `status` sang `active`. Quyết định chính sách: **không chặn login** khi `pending_verification`, chỉ chặn một số chức năng qua `VerifiedGuard` (`@RequireVerified()`, xem route demo `GET /auth/verified-only`)
- [x] FE: form đăng ký/đăng nhập (shadcn/ui + react-hook-form), axios interceptor tự refresh khi 401 — form + interceptor + màn xác thực OTP đã xong; "/me" dùng lại tab Hồ sơ cá nhân ở `/settings` (dữ liệu thật từ `GET /auth/me`) với nút logout gọi API thật (đã sửa cả nút logout ở topbar)
- [ ] Cuối tuần 3 nếu còn thời gian: Google login qua Passport (không thì dời sang backlog) — chưa làm, để ở Backlog

**✅ Kiểm chứng**
- [ ] Vẽ lại được sequence diagram luồng refresh token không nhìn tài liệu — tự làm, chưa có bằng chứng đã thực hiện
- [ ] Test bằng curl: token hết hạn → 401 → refresh → retry thành công; logout xong refresh token cũ bị từ chối — logic đã cài đủ (rotation + reuse detection), nhưng chưa chạy/lưu script kiểm chứng
- [ ] Viết unit test đầu tiên cho `AuthService` (register + login) — **chưa có**, chưa có file `auth.service.spec.ts` nào

## Tuần 4–5 — M2: Profile, Portfolio & Media pipeline

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-04-05.md](./docs/learning/tuan-04-05.md)

**📚 Học**
- [ ] Presigned URL: tại sao FE upload thẳng lên S3/R2 thay vì qua API; giới hạn content-type và size ngay trong chữ ký
- [ ] BullMQ: queue, worker, job retry; khi nào cần queue thay vì xử lý sync
- [ ] sharp: resize, tạo thumbnail, chất lượng nén

**🔨 Làm**
- [ ] CRUD `photographer_profiles`, `packages`, `booking_policies` (DTO + class-validator đầy đủ)
- [ ] Đăng ký R2 (free tier) hoặc MinIO local; API cấp presigned URL, FE upload trực tiếp
- [ ] Worker BullMQ: sau khi upload xong → sinh thumbnail → cập nhật `thumbnail_url`
- [ ] FE: trang profile công khai + portfolio grid (lazy-load, lightbox), form upload nhiều ảnh có progress bar
- [ ] Áp giới hạn Q6: 5GB RAW/project (chưa cần enforce retention, chỉ cần field)

**✅ Kiểm chứng**
- [ ] Upload 50 ảnh một lúc: API không nghẽn, thumbnail sinh bất đồng bộ, UI cập nhật khi xong
- [ ] Giải thích được: nếu worker chết giữa chừng, job có mất không? (retry + idempotency của job)

## Tuần 6–7 — M3: Search & Availability Calendar

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-06-07.md](./docs/learning/tuan-06-07.md)

**📚 Học**
- [ ] MongoDB index: compound index, `explain()`, khi nào index vô dụng
- [ ] Aggregation pipeline: `$match`, `$lookup`, `$sort`, `$facet` (đếm tổng + phân trang 1 query)
- [ ] Geo query: `2dsphere` index, `$near`

**🔨 Làm**
- [ ] API search photographer: filter khu vực/thể loại/giá/ngày trống, phân trang, sort tạm theo rating (Search Score đầy đủ để M7)
- [ ] Model lịch rảnh/bận + logic block ngày đã có booking confirmed
- [ ] FE: trang search với filter đồng bộ lên URL (share link được), infinite scroll bằng `useInfiniteQuery`, calendar chọn ngày
- [ ] Chạy `explain()` trước và sau khi thêm index, ghi số liệu vào Nhật ký

**✅ Kiểm chứng**
- [ ] Seed 1.000 photographer giả (viết script seed) — search + filter phản hồi < 200ms local
- [ ] Chỉ ra được query nào dùng index nào qua `explain()`

## Tuần 8–9 — M4: Booking & Booking Policy

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-08-09.md](./docs/learning/tuan-08-09.md)

**📚 Học**
- [ ] State machine: mô hình hoá trạng thái nghiệp vụ, transition hợp lệ/không hợp lệ
- [ ] MongoDB transaction (replica set local) — khi nào cần, khi nào thiết kế document tránh được
- [ ] Cron & delayed job trong BullMQ
- [ ] Unit test với Jest trong NestJS: mock repository, test service thuần logic

**🔨 Làm**
- [ ] `bookings` với state machine: `pending → confirmed → in_progress → completed / cancelled / expired / disputed`; chặn transition sai ở tầng service
- [ ] Snapshot `booking_policies` vào booking tại thời điểm đặt (Q3, FR-BOOK-02)
- [ ] Tính deposit (percentage/fixed) và số tiền hoàn theo refund policy (full / before X days / non-refundable)
- [ ] Delayed job: quá 24h không phản hồi → `expired` + notification (Q3)
- [ ] **Unit test đầy đủ cho state machine + mọi nhánh tính refund** — đây là bài luyện test quan trọng nhất project
- [ ] FE: flow booking nhiều bước (chọn package → ngày giờ → xác nhận policy), màn quản lý booking 2 phía

**✅ Kiểm chứng**
- [ ] Coverage 100% cho hàm tính refund; tự tin sửa công thức mà không sợ gãy
- [ ] Demo được: tạo booking, không phản hồi (rút SLA xuống 1 phút để test), booking tự expired

## Tuần 10–12 — M5: Project Workspace & Real-time

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-10-12.md](./docs/learning/tuan-10-12.md)

**📚 Học**
- [ ] WebSocket vs HTTP: handshake, room, broadcast; Socket.IO adapter Redis (multi-instance)
- [ ] NestJS Gateway: `@WebSocketGateway`, auth socket bằng JWT ở handshake
- [ ] Signed URL có expiry cho download (khác presigned upload thế nào)

**🔨 Làm**
- [ ] Auto-tạo `projects` khi booking confirmed + `timeline_events` log (FR-PROJ-11)
- [ ] Chat: gateway Socket.IO, room theo project, lưu `project_messages`, chỉ thành viên project join được room
- [ ] FE chat: optimistic update, phân trang tin nhắn cũ (scroll ngược), typing indicator — phần FE khó nhất project
- [ ] Tab Moodboard + Checklist (CRUD đơn giản, tái dùng upload pipeline M2)
- [ ] Luồng ảnh: RAW Gallery → Customer chọn (`photo_selections` + comment) → Edited Gallery → Delivery
- [ ] Delivery: watermark khi chưa thanh toán đủ (sharp composite), link tải signed URL hết hạn 24h

**✅ Kiểm chứng**
- [ ] Mở 2 trình duyệt 2 tài khoản: chat real-time mượt, người ngoài project không join được room (test bằng script)
- [ ] Đi trọn luồng: booking → confirmed → upload RAW → chọn ảnh → upload edited → delivery có watermark

## Tuần 13–14 — M6: Payment (Stripe trước)

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-13-14.md](./docs/learning/tuan-13-14.md)

**📚 Học**
- [ ] Stripe: PaymentIntent, webhook, chữ ký webhook, test mode + CLI (`stripe listen`)
- [ ] **Idempotency**: tại sao webhook có thể bắn trùng, xử lý thế nào — khái niệm BE giá trị nhất module này
- [ ] Đọc flow VNPay/MoMo sandbox (chỉ đọc, tích hợp để backlog nếu hết thời gian)

**🔨 Làm**
- [ ] Stripe test mode: thanh toán deposit khi booking confirmed, milestone, final payment
- [ ] Webhook handler idempotent (check `transaction_ref` trước khi ghi) cập nhật `payments`
- [ ] Tính commission 10% (Q4), refund flow theo policy khi huỷ booking
- [ ] Mở khoá delivery (bỏ watermark) khi thanh toán đủ — nối với M5
- [ ] Test cho webhook handler: bắn trùng event, event sai chữ ký, out-of-order
- [ ] FE: trang thanh toán (Stripe Elements), trạng thái milestone trong tab Payment

**✅ Kiểm chứng**
- [ ] Bắn cùng 1 webhook event 3 lần bằng Stripe CLI → DB chỉ ghi 1 giao dịch
- [ ] Rút được tiền test: thanh toán → commission tách đúng → số dư payout của photographer đúng

## Tuần 15 — M7: Trust Score, Review, Notification

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-15.md](./docs/learning/tuan-15.md)

**📚 Học**
- [ ] Cron job trong NestJS (`@nestjs/schedule`) vs repeatable job BullMQ
- [ ] Denormalization: khi nào chấp nhận dữ liệu trùng để đọc nhanh

**🔨 Làm**
- [ ] Review sau khi project completed; job đêm tính Trust Score theo trọng số Q2, cập nhật level theo ngưỡng Q1 (chỉ tăng)
- [ ] Search Score = 40/25/15/10/10 → denormalize vào profile, cắm vào sort của API search (M3)
- [ ] Notification: in-app qua socket + email qua queue; chuông thông báo real-time trên FE
- [ ] Dashboard customer + photographer (FR-DASH-01/02)

**✅ Kiểm chứng**
- [ ] Hoàn tất 1 project với review 5 sao → chạy job → Trust Score đổi đúng theo công thức tính tay

## Tuần 16 — M8: Admin & Deploy

> 📝 Bài tập chi tiết từng buổi: [docs/learning/tuan-16.md](./docs/learning/tuan-16.md)

> ⚠️ **Phần Deploy (Buổi 1–2) đã làm sớm hơn lịch**, trước khi M2–M7 xong, để có URL production thật dùng suốt quá trình học — không có nghĩa cả Tuần 16 đã hoàn thành. Admin/dispute/rate-limit/Sentry (Buổi 3–5) vẫn chưa làm, chờ đúng module tương ứng build xong (Q7 verification, Q9 dispute, M6 payment...).

**📚 Học**
- [x] Deploy thực tế: VPS/Railway/**Render** (đã chọn Render, không Railway), reverse proxy, HTTPS — platform lo hết (không tự cấu hình nginx/certbot), biến môi trường production set qua dashboard Render/Vercel, không commit
- [ ] Cơ bản về rate limiting (`@nestjs/throttler`), Sentry error monitoring

**🔨 Làm**
- [ ] Admin tối thiểu: duyệt verification, danh sách dispute + quyết định hoàn tiền (Q9), dashboard thống kê bằng aggregation
- [x] Deploy: FE lên Vercel (https://aperto-kappa.vercel.app); API lên Render (https://aperto.onrender.com) + MongoDB Atlas + Upstash Redis; CI/CD tự deploy khi merge `main` (built-in của Render/Vercel). Chi tiết + gotcha thật gặp phải (`.dockerignore` thiếu làm lộ `.env` vào image, Upstash cần `rediss://` TLS, Render free tier tự ngủ → thêm GitHub Actions [`keep-alive.yml`](./.github/workflows/keep-alive.yml)): xem [dev-guide.md §7](./docs/dev-guide.md#7-deploy-targets-free-tier)
- [ ] Rate limit auth endpoints, Sentry cho cả FE + API, backup Mongo định kỳ

**✅ Kiểm chứng**
- [ ] Gửi link production cho một người bạn đặt thử một booking end-to-end bằng điện thoại — chưa thể test (booking chưa build), nhưng đã tự verify luồng auth thật trên production: đăng ký → đăng nhập → xác thực OTP → Settings phản ánh đúng trạng thái, qua đúng domain Vercel + Render
- [ ] Cố tình throw error ở API → thấy event trên Sentry

---

## Backlog (làm khi có thời gian, không chặn tiến độ)

- [ ] Google login (từ tuần 3)
- [ ] VNPay/MoMo sandbox (từ tuần 14)
- [ ] Retention job xoá RAW sau 90 ngày + email cảnh báo trước 7 ngày (Q6)
- [ ] E2E test luồng booking bằng Playwright
- [ ] Load test search + chat (k6)

## Tài nguyên chính

| Chủ đề | Nguồn |
|---|---|
| NestJS | docs.nestjs.com (Overview → Fundamentals → Techniques theo nhu cầu từng tuần) |
| MongoDB | MongoDB University M001 + docs aggregation |
| BullMQ | docs.bullmq.io |
| Stripe | stripe.com/docs/payments + Stripe CLI |
| Socket.IO | socket.io/docs + NestJS Gateways |
| Docker | docs.docker.com/get-started |

## Nhật ký

> Mỗi tuần thêm một mục: học được gì / kẹt ở đâu / quyết định gì.

- **2026-08-07 — Deploy hạ tầng sớm (trước lịch Tuần 16)**: dựng production thật (Vercel + Render + MongoDB Atlas + Upstash Redis) trong lúc vẫn đang ở M1, để có URL thật dùng xuyên suốt quá trình học thay vì chỉ demo local. Học được 2 gotcha không có trong lý thuyết: (1) Dockerfile `COPY apps/api apps/api` mà thiếu `.dockerignore` sẽ copy thẳng `.env` thật vào image — phải tự build + `docker run ... find /` kiểm tra trước khi tin; (2) Upstash bắt buộc `rediss://` (TLS), sai scheme thì lỗi hiện ra là `MaxRetriesPerRequestError` mơ hồ chứ không nói rõ là sai giao thức. Quyết định thêm: dùng GitHub Actions cron (`keep-alive.yml`) ping `/health` mỗi 10 phút để né Render free tier tự ngủ, thay vì trả phí sớm. Chi tiết: [dev-guide.md §7](./docs/dev-guide.md#7-deploy-targets-free-tier).

**2026-08-07 (Tuần 2–3 — OTP & pending_verification):**
- Quyết định: **login giới hạn**, không chặn hoàn toàn khi `status = pending_verification`. User pending vẫn nhận access + refresh token bình thường; chỉ những route đánh dấu `@RequireVerified()` (dùng `VerifiedGuard`, đọc `status` thẳng từ JWT payload — không query DB lại) mới trả 403. Route demo: `GET /auth/verified-only`. Lý do: thân thiện hơn với user lỡ bỏ qua bước xác thực email, và tận dụng đúng pattern `SetMetadata` + `Reflector` đã học ở `RolesGuard` (Buổi 3) thay vì viết cơ chế mới.
- Đã nối `POST /auth/verify-otp` (trước đó `AuthService.verifyOtp` có sẵn nhưng không controller nào gọi); `register()` giờ tự gửi OTP; verify đúng mã sẽ cập nhật `status` sang `active` và trả cặp token mới luôn (tránh phải đăng nhập lại).
- Bug phát hiện khi làm: giới hạn "5 lần thử OTP sai" trước đó không hoạt động vì đếm `attempts` bằng `GET` thay vì `INCR` — đã sửa.
