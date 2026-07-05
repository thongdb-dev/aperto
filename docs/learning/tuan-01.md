# Tuần 1 — Bài tập chi tiết: M0 Hạ tầng & khung dự án

> Hướng dẫn thực hành cho [Tuần 1 trong LEARNING.md](../../LEARNING.md#tuần-1--m0-hạ-tầng--khung-dự-án).
> Lab step-by-step với lệnh cụ thể + bộ câu hỏi có đáp án: [tuan-01-thuc-hanh.md](./tuan-01-thuc-hanh.md).
>
> **Bối cảnh:** code M0 đã được scaffold sẵn (commit `a971cf4`) — monorepo, docker-compose, health endpoint, CI đều có. Vì vậy bài tuần này không phải gõ code từ đầu mà là: **học lý thuyết → đọc hiểu từng file → tự phá và sửa lại → kiểm chứng**. Chia thành ~4 buổi, tổng 10–12 giờ.

---

## Buổi 1 (~3h): Docker cơ bản

### Học (1.5h)

Đọc [docs.docker.com/get-started](https://docs.docker.com/get-started/), nắm 5 khái niệm (giải thích chi tiết kèm ví dụ từ code Aperto: [tuan-01-docker.md](./tuan-01-docker.md)):

- **Image vs container**: image là "bản cài đặt đóng gói" (read-only), container là một tiến trình chạy từ image. Xoá container không mất image.
- **Volume**: nơi lưu dữ liệu *sống lâu hơn container*. Không có volume thì xoá container là mất sạch DB.
- **Network**: các container trong cùng compose file gọi nhau bằng **tên service** (`mongo`, `redis`) thay vì `localhost`.
- **Dockerfile**: công thức build image.
- **docker-compose**: khai báo nhiều container chạy cùng nhau.

### Thực hành (1.5h)

Dùng chính [docker-compose.yml](../../docker-compose.yml) của dự án:

```bash
docker compose up -d          # kéo image mongo:7 + redis:7, chạy nền
docker compose ps             # thấy 2 container, cột STATUS phải là "healthy"
docker compose logs mongo     # xem log
docker exec -it aperto-mongo-1 mongosh   # vào shell Mongo (tên container xem từ ps)
docker exec -it aperto-redis-1 redis-cli ping   # → PONG
```

**Bài tập volume:** trong `mongosh` chạy `use aperto; db.test.insertOne({a:1})`, rồi `docker compose down` (không `-v`), `up -d` lại → dữ liệu **còn**. Sau đó `docker compose down -v` → dữ liệu **mất**. Tự giải thích tại sao.

**Câu hỏi tự vấn** (đọc kỹ từng dòng `docker-compose.yml`):

- [ ] `healthcheck` để làm gì?
- [ ] Tại sao service `api` có `depends_on ... condition: service_healthy`?
- [ ] `profiles: ["full"]` nghĩa là gì? (gợi ý: `docker compose up` mặc định *không* chạy api)

## Buổi 2 (~3h): NestJS overview + dependency injection

Phần quan trọng nhất tuần — mục ✅ yêu cầu **giải thích được DI bằng lời**.

### Học (2h)

Đọc [docs.nestjs.com](https://docs.nestjs.com) phần Overview: First steps → Controllers → Providers → Modules. Vừa đọc vừa đối chiếu code thật:

| Khái niệm | File trong dự án |
|---|---|
| Module gốc, import module con | [app.module.ts](../../apps/api/src/app.module.ts) |
| Controller + route | [health.controller.ts](../../apps/api/src/health/health.controller.ts) |
| Provider với custom token + factory | [redis.module.ts](../../apps/api/src/redis/redis.module.ts) |
| Entry point, prefix `/api/v1` | [main.ts](../../apps/api/src/main.ts) |

### Trace luồng DI (1h)

Đi theo chuỗi này trong code — đây chính là câu trả lời cho mục kiểm chứng:

1. `RedisModule` khai báo provider với token `REDIS_CLIENT` và một `useFactory`. Factory này lại **inject `ConfigService`** — provider cũng được inject provider khác.
2. `HealthController` khai báo trong constructor: `@Inject(REDIS_CLIENT) private readonly redis: Redis`. Nó **không bao giờ tự `new Redis(...)`**.
3. Khi app khởi động, Nest xây một **IoC container**: đọc metadata của constructor, thấy `HealthController` cần `REDIS_CLIENT` và `Connection` (Mongo), tìm provider tương ứng trong các module đã import, tạo instance (mặc định singleton) và "tiêm" vào.

Cách diễn đạt chuẩn để tự kiểm tra: *"Controller chỉ khai báo NÓ CẦN GÌ ở constructor; container của Nest chịu trách nhiệm TẠO và ĐƯA vào. Nhờ vậy khi test, mình thay Redis thật bằng mock mà không sửa controller."*

**Câu hỏi tự vấn:**

- [ ] Tại sao `RedisModule` cần `@Global()` và `exports: [REDIS_CLIENT]`?
- [ ] Điều gì xảy ra nếu bỏ `exports`? (Thử bỏ thật và chạy — đọc lỗi resolve dependency của Nest là một bài học tốt.)

## Buổi 3 (~3h): Monorepo + env validation + chạy full stack

### Học (45')

Dự án dùng **npm workspaces** (không phải Turborepo). Đọc [npm workspaces docs](https://docs.npmjs.com/cli/using-npm/workspaces), rồi mở [package.json](../../package.json) gốc: hiểu `"workspaces": ["apps/*"]` nghĩa là `npm install` ở root cài cho cả 2 app, dependencies được hoist lên `node_modules` gốc, và `npm run dev:api` thực chất là `npm run start:dev --workspace apps/api`.

### Thực hành (2h)

```bash
nvm use && npm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
npm run dev:api      # terminal 1 → http://localhost:4000/api/v1
npm run dev:web      # terminal 2 → http://localhost:3000
curl http://localhost:4000/api/v1/health
# kỳ vọng: {"status":"ok","dependencies":{"mongo":"up","redis":"up"},...}
```

**3 thí nghiệm "phá để hiểu"** — mỗi cái dạy đúng một khái niệm của tuần:

1. **Env validation**: xoá dòng `MONGODB_URI` trong `.env` → API phải **từ chối khởi động** với lỗi Joi rõ ràng. Đọc [env.validation.ts](../../apps/api/src/config/env.validation.ts) để hiểu tại sao (fail-fast thay vì chết ngầm lúc runtime).
2. **Health check phản ánh hạ tầng**: `docker compose stop redis` → gọi lại `/health` → phải trả **503** với `redis: "down"`. Đọc logic trong `health.controller.ts` xem 503 đến từ đâu (`ServiceUnavailableException`). Rồi `start` lại.
3. **API trong container**: `docker compose --profile full up --build` → gọi health qua port 4000 mà không cần `npm run dev:api`. Để ý `MONGODB_URI` trong compose là `mongodb://mongo:27017/aperto` chứ không phải `localhost` — chính là bài network ở Buổi 1. Đọc luôn [Dockerfile](../../apps/api/Dockerfile) xem multi-stage build làm gì.

## Buổi 4 (~2–3h): CI + kiểm chứng "máy sạch" + nhật ký

### CI (45')

Đọc [ci.yml](../../.github/workflows/ci.yml): 4 bước `npm ci` → lint → build → test. Chạy đúng các lệnh đó ở local để chắc chắn xanh:

```bash
npm run lint && npm run build && npm run test:api
```

Push một commit nhỏ (ví dụ cập nhật Nhật ký) lên GitHub và xem workflow chạy trong tab Actions — thấy tận mắt CI xanh mới tính.

### ✅ Kiểm chứng 1 — máy sạch

Mô phỏng bằng cách xoá sạch state rồi dựng lại theo đúng README:

```bash
docker compose down -v
rm -rf node_modules apps/api/node_modules apps/web/node_modules apps/api/dist
# rồi làm lại đúng trình tự ở Buổi 3, bấm giờ xem mất bao lâu
```

Nếu có bước nào README thiếu (phải mò thêm), sửa luôn README — đó chính là giá trị của bài test này.

### ✅ Kiểm chứng 2 — giải thích DI

Nói to (hoặc viết ra giấy) phần trace ở Buổi 2, không nhìn code. Nếu ấp úng ở đâu, quay lại đọc đúng chỗ đó.

### Nhật ký (30')

Thêm mục Tuần 1 vào cuối [LEARNING.md](../../LEARNING.md) — học được gì, kẹt ở đâu, và ghi rõ quyết định kỹ thuật đã có sẵn trong scaffold: *npm workspaces (không Turborepo), ioredis với custom provider token, health check trả 503 khi degraded*. Tick các checkbox `- [ ]` → `- [x]` của Tuần 1.

---

## Điều kiện chuyển sang Tuần 2

- [ ] Cả 2 mục ✅ đạt
- [ ] CI xanh trên GitHub
- [ ] Trả lời được 3 câu "phá để hiểu" ở Buổi 3 mà không cần chạy lại

Tuần 2 (M1 Auth) sẽ đụng Mongoose schema và Guard — cả hai đều xây trực tiếp trên nền DI vừa học. Lưu ý M1 **chưa có code sẵn**, nên bài 2 sẽ là tự viết, đúng tinh thần "build first".
