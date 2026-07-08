# Tuần 1 — Thực hành step-by-step + Câu hỏi & Đáp án

> File đồng hành với [tuan-01.md](./tuan-01.md) (kế hoạch 4 buổi). File này là **lab hướng dẫn từng bước** với lệnh cụ thể + output kỳ vọng, và bộ **câu hỏi có đáp án** ở cuối. Cách dùng đúng: làm từng bước, tự trả lời câu hỏi trước, rồi mới mở đáp án (thẻ ▸ bấm để mở).

---

## Phần A — Lab step-by-step

### Lab 1: Docker — dựng và hiểu hạ tầng

#### Bước 1.1 — Khởi động Mongo + Redis

```bash
cd ~/workspace/personal/aperto
docker compose up -d
```

Output kỳ vọng (lần đầu sẽ có thêm các dòng `Pulling...`):

```
✔ Container aperto-mongo-1  Started
✔ Container aperto-redis-1  Started
```

Kiểm tra trạng thái:

```bash
docker compose ps
```

Chờ ~10–20 giây, cột `STATUS` phải là `Up ... (healthy)` cho cả 2. Nếu chỉ thấy `Up` chưa có `(healthy)`, chờ thêm — healthcheck chạy mỗi 10s (xem `interval` trong [docker-compose.yml](../../docker-compose.yml)).

#### Bước 1.2 — Vào shell từng container

```bash
docker exec -it aperto-mongo-1 mongosh
```

Trong mongosh:

```javascript
db.runCommand('ping')        // → { ok: 1 }
show dbs                     // admin, config, local — chưa có "aperto" vì chưa ghi gì
```

Gõ `exit` rồi thử Redis:

```bash
docker exec -it aperto-redis-1 redis-cli ping   # → PONG
```

#### Bước 1.3 — Thí nghiệm volume (quan trọng nhất Lab 1)

```bash
docker exec -it aperto-mongo-1 mongosh --eval "use('aperto'); db.test.insertOne({a: 1})"
docker compose down          # dừng + XOÁ container, KHÔNG xoá volume
docker compose up -d
# chờ healthy rồi:
docker exec -it aperto-mongo-1 mongosh --eval "use('aperto'); db.test.find()"
```

Kỳ vọng: document `{a: 1}` **vẫn còn** — vì dữ liệu nằm trong volume `mongo_data`, container chỉ là tiến trình dùng volume đó.

```bash
docker compose down -v       # -v = xoá luôn volume
docker compose up -d
docker exec -it aperto-mongo-1 mongosh --eval "use('aperto'); db.test.find()"
```

Kỳ vọng: **không còn gì** — volume bị xoá là mất dữ liệu thật. Đây là lý do không bao giờ chạy `down -v` bừa trên môi trường có dữ liệu quan trọng.

#### Bước 1.4 — Đọc docker-compose.yml có chủ đích

Mở [docker-compose.yml](../../docker-compose.yml), với mỗi block tự trả lời: dòng này bỏ đi thì chuyện gì xảy ra? (Các câu hỏi Q1–Q4 phần B tương ứng bước này.)

---

### Lab 2: Chạy API + trace luồng NestJS DI

#### Bước 2.1 — Cài đặt và chạy

```bash
nvm use                                  # đọc .nvmrc → Node 22
npm install
cp apps/api/.env.example apps/api/.env
npm run dev:api
```

Output kỳ vọng (log NestJS):

```
[Nest] ... LOG [NestFactory] Starting Nest application...
[Nest] ... LOG [InstanceLoader] MongooseModule dependencies initialized
[Nest] ... LOG [RoutesResolver] HealthController {/api/v1/health}
[Nest] ... LOG [NestApplication] Nest application successfully started
```

Để ý dòng `RoutesResolver`: route là `/api/v1/health` chứ không phải `/health` — vì `app.setGlobalPrefix('api/v1')` trong [main.ts](../../apps/api/src/main.ts).

```bash
curl -s http://localhost:4000/api/v1/health | python3 -m json.tool
```

```json
{
    "status": "ok",
    "dependencies": { "mongo": "up", "redis": "up" },
    "timestamp": "..."
}
```

#### Bước 2.2 — Trace DI bằng tay (không chạy gì, chỉ đọc)

Mở 3 file cạnh nhau và đi theo đúng thứ tự này:

1. **[app.module.ts](../../apps/api/src/app.module.ts)** — `AppModule` import `ConfigModule` (global), `MongooseModule.forRootAsync`, `RedisModule`, `HealthModule`. Đây là "bản đồ" toàn app.
2. **[redis.module.ts](../../apps/api/src/redis/redis.module.ts)** — dừng lại ở 3 chỗ:
   - `const REDIS_CLIENT = Symbol(...)` — token định danh, vì class `Redis` của ioredis không phải provider do Nest quản lý nên cần token thủ công.
   - `useFactory: (config: ConfigService) => new Redis(...)` + `inject: [ConfigService]` — Nest gọi factory này **một lần** lúc khởi động, truyền `ConfigService` vào làm tham số.
   - `exports: [REDIS_CLIENT]` + `@Global()` — cho module khác dùng mà không cần import lại.
3. **[health.controller.ts](../../apps/api/src/health/health.controller.ts)** — constructor có `@Inject(REDIS_CLIENT) private readonly redis: Redis`. Controller **không hề biết** Redis được tạo thế nào, URL bao nhiêu — nó chỉ tuyên bố "tôi cần thứ mang token REDIS_CLIENT".

Vẽ ra giấy chuỗi phụ thuộc: `HealthController ← REDIS_CLIENT ← useFactory ← ConfigService ← .env`. Đây chính là dependency graph mà Nest resolve lúc khởi động.

#### Bước 2.3 — Phá để chứng minh mình hiểu DI

Thí nghiệm: trong `redis.module.ts`, **xoá tạm dòng `exports: [REDIS_CLIENT],`** rồi lưu (watch mode tự restart). Kỳ vọng — app crash với lỗi kiểu:

```
Nest can't resolve dependencies of the HealthController (Connection, ?).
Please make sure that the argument REDIS_CLIENT at index [1] is available
in the HealthModule context.
```

Đọc kỹ lỗi này — nó nói đúng điều bạn vừa vẽ: Nest tìm provider cho token `REDIS_CLIENT` trong phạm vi `HealthModule` và không thấy (vì `RedisModule` không export nữa). **Hoàn tác lại** (`git checkout apps/api/src/redis/redis.module.ts`) và xác nhận app chạy lại.

#### Bước 2.4 — Thí nghiệm env validation

Mở `apps/api/.env`, xoá dòng `MONGODB_URI`, restart API (Ctrl+C rồi `npm run dev:api`). Kỳ vọng — app **từ chối khởi động**:

```
Error: Config validation error: "MONGODB_URI" is required
```

Đây là fail-fast: lỗi cấu hình lộ ra ngay giây đầu tiên thay vì đợi request đầu tiên chạm DB mới chết. So sánh: nếu không có Joi schema ([env.validation.ts](../../apps/api/src/config/env.validation.ts)), app sẽ khởi động "thành công" rồi treo/chết khó hiểu khi Mongoose connect. Khôi phục lại `.env`.

#### Bước 2.5 — Thí nghiệm health check phản ánh hạ tầng

```bash
docker compose stop redis
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/v1/health   # → 503
curl -s http://localhost:4000/api/v1/health | python3 -m json.tool
```

Kỳ vọng body có `"status": "degraded"`, `"redis": "down"` — và HTTP code **503**. Truy ngược trong `health.controller.ts`: 503 đến từ `throw new ServiceUnavailableException(body)`. Load balancer/orchestrator dựa vào code này để loại instance hỏng khỏi traffic.

```bash
docker compose start redis   # khôi phục, curl lại phải ra 200
```

---

### Lab 3: Monorepo + API trong container

#### Bước 3.1 — Hiểu npm workspaces bằng thực nghiệm

```bash
cat package.json | grep -A3 workspaces     # "apps/*"
ls node_modules/.bin | grep nest           # nest CLI được hoist lên root
npm ls @nestjs/core                        # xem cây: aperto → apps/api → @nestjs/core
```

Chạy `npm run dev:api` từ **root** hoạt động vì script chỉ là proxy: `npm run start:dev --workspace apps/api`. Thử gọi thẳng lệnh đó để xác nhận chúng tương đương.

#### Bước 3.2 — Chạy API trong container (profile full)

```bash
# dừng npm run dev:api trước (tránh trùng port 4000)
docker compose --profile full up --build
```

Lần đầu build mất vài phút. Kỳ vọng: log build 2 stage (builder → runtime), rồi log NestJS khởi động trong container, và:

```bash
curl -s http://localhost:4000/api/v1/health   # → status ok
```

Điểm khác biệt then chốt: trong compose, API nhận `MONGODB_URI=mongodb://mongo:27017/aperto` — hostname là **tên service `mongo`**, không phải `localhost`. Trong network của compose, mỗi service là một "máy" riêng; `localhost` bên trong container API là chính container đó (không có Mongo). Đây là lỗi kinh điển số 1 khi mới dùng Docker.

#### Bước 3.3 — Đọc Dockerfile multi-stage

Mở [Dockerfile](../../apps/api/Dockerfile) — trả lời 3 câu (đáp án ở Q10–Q12):

- Tại sao có 2 `FROM`?
- Tại sao `COPY package.json` trước, `COPY apps/api` sau (mà không COPY tất cả 1 lần)?
- Tại sao stage 2 `npm ci --omit=dev`?

Xong thì `Ctrl+C` và quay lại chế độ dev bình thường (`docker compose up -d` + `npm run dev:api`).

---

### Lab 4: CI + kiểm chứng máy sạch

#### Bước 4.1 — Chạy đúng những gì CI chạy

```bash
npm run lint && npm run build && npm run test:api
```

Cả 3 phải xanh local trước khi push — [ci.yml](../../.github/workflows/ci.yml) chạy y hệt (thêm `npm ci` thay vì `npm install`).

#### Bước 4.2 — Kiểm chứng "máy sạch" (mục ✅ số 1)

```bash
docker compose down -v
rm -rf node_modules apps/api/node_modules apps/web/node_modules apps/api/dist apps/web/.next
rm apps/api/.env
```

Giờ làm lại **chỉ theo README, không theo trí nhớ**, bấm giờ:

```bash
nvm use && npm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
npm run dev:api      # terminal khác: npm run dev:web
curl http://localhost:4000/api/v1/health
```

Đạt khi: health trả `ok` + web mở được `localhost:3000`, không phải mò bước nào ngoài README. Nếu vấp ở đâu → sửa README ngay tại đó.

#### Bước 4.3 — Push và xem CI

```bash
git checkout -b chore/week-1-log
# cập nhật Nhật ký trong LEARNING.md + tick các checkbox Tuần 1
git add LEARNING.md && git commit -m "docs: week 1 learning log"
git push -u origin chore/week-1-log
```

Mở GitHub → tab Actions → thấy workflow chạy 4 bước và xanh. Merge vào main khi xanh.

#### Bước 4.4 — Kiểm chứng nói (mục ✅ số 2)

Không nhìn code, nói to (hoặc ghi âm) trong ~2 phút: *"DI trong NestJS hoạt động thế nào, tại sao service được inject vào controller?"* — phải nhắc được: IoC container, provider/token, constructor injection, singleton, và lợi ích khi test. Đối chiếu với đáp án Q5 bên dưới.

---

## Phần B — Câu hỏi & Đáp án

Tự trả lời (viết ra giấy/notes) **trước khi** mở đáp án. Trả lời sai câu nào → quay lại đúng Lab tương ứng.

### Docker

**Q1. `healthcheck` trong docker-compose.yml để làm gì? Bỏ đi thì sao?**

<details>
<summary>Đáp án</summary>

Healthcheck cho Docker biết container không chỉ "đang chạy" mà thực sự "sẵn sàng phục vụ" (Mongo trả lời được `ping`, Redis trả `PONG`). Bỏ đi thì: (1) `docker compose ps` chỉ biết Up/Down, không biết service bên trong đã sẵn sàng chưa; (2) quan trọng hơn — `depends_on ... condition: service_healthy` của service `api` mất tác dụng, API có thể khởi động khi Mongo chưa nhận kết nối → connect fail lúc boot.
</details>

**Q2. Tại sao service `api` cần `depends_on ... condition: service_healthy` thay vì `depends_on: [mongo]` thường?**

<details>
<summary>Đáp án</summary>

`depends_on` thường chỉ đảm bảo **thứ tự start container**, không đảm bảo tiến trình bên trong đã sẵn sàng — Mongo container "started" trước khi mongod nhận kết nối vài giây. `condition: service_healthy` bắt compose chờ đến khi healthcheck pass mới start API, loại bỏ race condition lúc boot.
</details>

**Q3. `profiles: ["full"]` trên service `api` nghĩa là gì?**

<details>
<summary>Đáp án</summary>

Service gắn profile sẽ **không chạy** với `docker compose up` mặc định — chỉ chạy khi bật profile: `docker compose --profile full up`. Dùng để tách 2 chế độ: dev thường ngày chỉ cần Mongo+Redis trong Docker (API chạy trên host bằng watch mode, restart nhanh), còn khi muốn kiểm tra "chạy như production" thì bật full.
</details>

**Q4. Volume khác bind mount thế nào, và tại sao `mongo_data` là named volume?**

<details>
<summary>Đáp án</summary>

Bind mount map một thư mục cụ thể của host vào container (hay dùng để mount source code khi dev). Named volume do Docker quản lý vị trí lưu, tối ưu cho dữ liệu mà host không cần sờ trực tiếp. Dữ liệu DB không cần host đọc/sửa file trực tiếp → named volume là lựa chọn chuẩn: portable, không phụ thuộc đường dẫn máy, không dính vấn đề permission giữa các OS.
</details>

### NestJS & DI

**Q5. (Câu ✅ của tuần) DI trong NestJS hoạt động thế nào? Tại sao service được inject vào controller thay vì controller tự `new`?**

<details>
<summary>Đáp án mẫu (~2 phút nói)</summary>

Khi app khởi động, Nest xây một **IoC container**: duyệt các module, đăng ký mọi provider theo **token** (thường là chính class, hoặc token thủ công như `REDIS_CLIENT`). Với mỗi class cần khởi tạo, Nest đọc metadata của constructor (nhờ decorator + reflect-metadata) để biết nó phụ thuộc gì, resolve đệ quy từng dependency, tạo instance (mặc định **singleton** — cả app dùng chung), rồi truyền vào constructor. Trong Aperto: `HealthController` khai báo cần `REDIS_CLIENT`; Nest thấy `RedisModule` cung cấp token đó qua `useFactory` (factory này lại cần `ConfigService` — cũng được resolve trước); kết quả là controller nhận client đã kết nối sẵn.

Tại sao không tự `new Redis(...)` trong controller? Ba lý do: (1) **tách khởi tạo khỏi sử dụng** — controller không cần biết URL, retry config; đổi cách tạo Redis chỉ sửa 1 chỗ; (2) **testability** — khi test, cung cấp mock qua cùng token (`{ provide: REDIS_CLIENT, useValue: fakeRedis }`), controller không đổi một dòng; (3) **vòng đời** — container đảm bảo 1 connection dùng chung thay vì mỗi nơi tự tạo một connection.
</details>

**Q6. Tại sao `REDIS_CLIENT` phải là token thủ công (Symbol) trong khi `ConfigService` inject thẳng bằng type?**

<details>
<summary>Đáp án</summary>

Nest resolve dependency theo token; với class do bạn/Nest khai báo là provider, chính class đó là token — nên khai báo type trong constructor là đủ. Còn `Redis` của ioredis là class bên thứ ba, không được đăng ký như provider và có thể có nhiều instance khác nhau (cache, queue…) — cần token riêng để phân biệt "cái Redis nào". Symbol tránh trùng tên với bất kỳ token string nào khác.
</details>

**Q7. Bỏ `exports: [REDIS_CLIENT]` trong RedisModule thì lỗi gì, tại sao?**

<details>
<summary>Đáp án</summary>

App crash lúc boot: `Nest can't resolve dependencies of the HealthController (Connection, ?)`. Provider mặc định là **private trong module khai báo nó** — module khác import cũng không thấy nếu không export. `@Global()` chỉ miễn việc phải import RedisModule ở mọi nơi, không thay thế được `exports`.
</details>

**Q8. Guard, Interceptor, Pipe, Middleware — thứ tự chạy trong 1 request?**

<details>
<summary>Đáp án</summary>

Middleware → Guard → Interceptor (trước) → Pipe → Handler (controller method) → Interceptor (sau) → trả response. Tuần 2 sẽ dùng ngay: `JwtAuthGuard` chạy trước `ValidationPipe`, nên request chưa đăng nhập bị chặn trước cả khi validate body.
</details>

**Q9. `ValidationPipe({ whitelist: true })` trong main.ts làm gì? Nếu thiếu thì rủi ro gì?**

<details>
<summary>Đáp án</summary>

`whitelist: true` tự loại mọi field không khai báo trong DTO trước khi vào handler. Thiếu nó, client có thể gửi field thừa đi thẳng vào code — ví dụ M1 tới đây: gửi `{"email": "...", "password": "...", "role": "admin"}` vào endpoint register; nếu service spread nguyên body vào model thì thành lỗ hổng leo quyền (mass assignment). `transform: true` thì convert plain object → instance DTO và ép kiểu (string → number cho query param).
</details>

### Docker build & monorepo

**Q10. Dockerfile có 2 `FROM` (multi-stage) — để làm gì?**

<details>
<summary>Đáp án</summary>

Stage 1 (builder) cài đủ devDependencies để compile TypeScript → `dist`. Stage 2 chỉ lấy `dist` + prod dependencies. Image cuối **không chứa** source TS, compiler, devDependencies → nhỏ hơn đáng kể và ít bề mặt tấn công hơn. Câu trả lời một dòng: "build cần nhiều thứ hơn run, nên tách môi trường build khỏi image chạy thật."
</details>

**Q11. Tại sao `COPY package.json` + `npm ci` đứng TRƯỚC `COPY apps/api`?**

<details>
<summary>Đáp án</summary>

Docker cache theo **layer**: một layer chỉ build lại khi input của nó đổi. Sửa code (`apps/api`) xảy ra hằng ngày, sửa `package.json` thì hiếm. Tách ra như vậy thì lần build sau khi chỉ sửa code, bước `npm ci` (chậm nhất) được lấy từ cache — build còn vài giây thay vì vài phút. Nếu COPY tất cả một lần, mọi thay đổi code đều làm `npm ci` chạy lại.
</details>

**Q12. `npm ci` khác `npm install` thế nào, tại sao CI/Docker dùng `ci`?**

<details>
<summary>Đáp án</summary>

`npm ci` cài **đúng 100% theo package-lock.json**, xoá node_modules cũ trước khi cài, và **fail** nếu lock file lệch với package.json — không bao giờ tự sửa lock. `npm install` có thể cập nhật lock file theo semver. CI/Docker cần build tái lập được (cùng input → cùng output) nên dùng `ci`; máy dev khi thêm package mới thì dùng `install`.
</details>

**Q13. npm workspaces: cài package cho riêng apps/api thì gõ lệnh gì, và node_modules nằm ở đâu?**

<details>
<summary>Đáp án</summary>

`npm install <pkg> --workspace apps/api` (chạy từ root). Package được ghi vào `apps/api/package.json` nhưng file thực tế thường được **hoist** lên `node_modules` ở root — Node resolve được nhờ cơ chế tìm ngược lên thư mục cha. Chỉ khi 2 workspace cần 2 version xung đột thì mới có `node_modules` con trong workspace.
</details>

### Health & vận hành

**Q14. Tại sao /health trả 503 khi degraded thay vì trả 200 kèm `status: "degraded"`?**

<details>
<summary>Đáp án</summary>

Vì máy móc (load balancer, k8s, Railway/Render, uptime monitor) chỉ đọc **HTTP status code**, không parse body. 200 = "cho traffic vào", 5xx = "loại instance này ra / restart". Trả 200 kèm body degraded thì con người đọc hiểu nhưng hạ tầng tự động vẫn tưởng service khoẻ. Body chi tiết (`mongo: up, redis: down`) là để người debug biết chết vì gì.
</details>

**Q15. Trong health check, vì sao Mongo check bằng `readyState` còn Redis phải `ping()` thật?**

<details>
<summary>Đáp án</summary>

Mongoose duy trì connection và tự theo dõi trạng thái — `readyState` là thông tin có sẵn trong bộ nhớ, đọc miễn phí. ioredis không expose trạng thái tương đương đáng tin ở mọi tình huống, nên gửi lệnh `PING` thật là cách chắc chắn nhất xác nhận round-trip còn sống. Trade-off: `ping()` tốn 1 round-trip mỗi lần health check — chấp nhận được vì rất rẻ. (Nâng cao: `readyState` có thể "lạc quan" trong khoảng Mongoose đang buffer lệnh khi mất kết nối — có thể nâng cấp bằng `db.admin().ping()` thật, ghi vào backlog nếu muốn.)
</details>

---

## Checklist chốt tuần

- [x] Làm hết Lab 1–4, các thí nghiệm "phá" đều đã hoàn tác (git status sạch)
- [x] Trả lời đúng ≥ 12/15 câu phần B mà chưa mở đáp án
- [x] 2 mục ✅ trong [LEARNING.md](../../LEARNING.md) đã tick, Nhật ký Tuần 1 đã ghi
- [x] CI xanh trên GitHub
