# Dev Guide — kiến trúc & luồng hoạt động (giải thích từ đầu)

Tài liệu onboarding cho dev mới (hoặc để đọc lại khi quên). Khác với bộ SRS `01–08` mô tả *sản phẩm cần làm gì*, file này giải thích *code được tổ chức thế nào và chạy ra sao*.

## 1. Monorepo là gì?

Dự án có 2 phần: giao diện web và máy chủ API. Có 2 cách tổ chức:

- **Polyrepo** — 2 repo Git riêng, giống 2 căn nhà ở 2 khu phố. Muốn sửa cả hai (VD: đổi tên một field API) phải mở 2 repo, tạo 2 PR, nhớ merge đúng thứ tự.
- **Monorepo** — 1 repo Git chứa cả hai, giống một toà nhà có 2 căn hộ chung móng. Sửa cả hai trong 1 commit, dùng chung "móng nhà": config lint, CI, version Node.

Aperto dùng monorepo qua **npm workspaces**: [package.json](../package.json) ở gốc có `"workspaces": ["apps/*"]`, báo cho npm biết "trong `apps/` có nhiều dự án con, hãy quản lý chung". Hệ quả:

- `npm install` chạy **một lần ở gốc** → cài cho cả hai app, thư viện được *hoist* (gom) vào một `node_modules/` ở gốc → chỉ có **một** `package-lock.json`.
- Script ở root là proxy: `npm run dev:api` thực chất chạy `npm run start:dev --workspace apps/api`.

## 2. Cấu trúc thư mục

```
aperto/
├── package.json        # "chỉ huy": khai báo workspaces + các lệnh chung
├── .nvmrc              # ghi "22" — quy định cả team dùng Node 22 (nvm use)
├── docker-compose.yml  # khai báo hạ tầng local: MongoDB + Redis
├── .github/workflows/  # CI: GitHub tự chạy lint + build + test mỗi lần push
├── docs/               # tài liệu SRS + file này
└── apps/
    ├── web/            # những gì người dùng NHÌN THẤY
    └── api/            # những gì chạy NGẦM phía sau
```

### `apps/web` — frontend

Next.js 15 (App Router) + MUI (bộ component UI) + React Query (gọi & cache dữ liệu). Hai file đáng chú ý:

- `src/app/providers.tsx` — client component bọc `QueryClientProvider` + MUI `ThemeProvider`. `QueryClient` tạo trong `useState(() => ...)` để không bị tạo lại mỗi render và không share state giữa các request SSR.
- `src/app/layout.tsx` — server component, bọc `<Providers>` quanh children. Pattern chuẩn App Router: layout là server, providers là client.

Nguyên tắc quan trọng nhất: web **không bao giờ đụng trực tiếp database** — chỉ nói chuyện với API qua HTTP.

### `apps/api` — backend (NestJS)

NestJS tổ chức code theo **module** — mỗi tính năng một thư mục, mỗi module là một "hộp" gom controller + provider liên quan:

```
api/src/
├── main.ts          # điểm khởi động (giống index.tsx của React)
├── app.module.ts    # module gốc — "ổ cắm tổng" nối mọi module con
├── config/          # Joi schema validate biến môi trường lúc boot
├── redis/           # module cung cấp Redis client (ioredis)
└── health/          # GET /api/v1/health — API báo "tôi còn sống"
```

Trong một module có 2 loại file, phân vai rõ:

- **Controller** = lễ tân: nhận request, không xử lý phức tạp. `@Controller('health')` + `@Get()` = "URL `GET /health` thì gọi hàm này".
- **Service** = người làm việc thật: chứa logic nghiệp vụ. Controller gọi service.

**Luồng khởi động** (đọc theo thứ tự này để hiểu Nest):

1. `main.ts` — `NestFactory.create(AppModule)` dựng app từ module gốc, gắn prefix `api/v1`, bật `ValidationPipe` toàn cục (mọi request body tự được validate theo DTO), rồi `listen(PORT)`.
2. `app.module.ts` — nơi lắp ráp:
   - `ConfigModule.forRoot({ isGlobal, validationSchema })` — đọc `.env`, validate bằng Joi. Thiếu `MONGODB_URI` là **app từ chối chạy ngay lúc boot** thay vì lỗi mơ hồ lúc runtime. `isGlobal: true` = mọi module inject được `ConfigService` không cần import lại.
   - `MongooseModule.forRootAsync(...)` — mở kết nối MongoDB. Dùng `forRootAsync` (không phải `forRoot`) vì URI phải lấy từ `ConfigService` — phụ thuộc provider khác nên phải khai báo dạng factory có `inject`.

### Dependency Injection — khái niệm cốt lõi của NestJS

Nhìn 2 file này là hiểu:

**Phía đăng ký** — `redis/redis.module.ts`:

```ts
{ provide: REDIS_CLIENT,          // "tên" đăng ký (Symbol)
  inject: [ConfigService],        // khai báo cần gì
  useFactory: (config) => new Redis(config.getOrThrow('REDIS_URL')) }
```

Nest đọc: *"khi ai đó xin `REDIS_CLIENT`, chạy factory này — factory cần `ConfigService`, nên tạo/lấy `ConfigService` trước rồi truyền vào"*. Nest tự giải chuỗi phụ thuộc, không bao giờ viết `new` thủ công. `@Global()` + `exports` = mọi module inject được mà không cần import `RedisModule`.

**Phía tiêu thụ** — `health/health.controller.ts`:

```ts
constructor(
  @InjectConnection() private readonly mongoConnection: Connection,
  @Inject(REDIS_CLIENT) private readonly redis: Redis,
) {}
```

Controller chỉ *khai báo cần gì* trong constructor — Nest tự đưa vào. So sánh với FE: giống React Context (`Provider` ở module, `useContext` ở constructor), nhưng resolve lúc khởi động app chứ không phải lúc render.

Bài tự kiểm tra: nếu `AuthService` (M1) cần `REDIS_CLIENT` để revoke token thì phải làm gì? — Đáp: không import gì thêm (vì `RedisModule` là `@Global()`), chỉ cần `@Inject(REDIS_CLIENT)` trong constructor.

## 3. MongoDB, Redis, Docker — vai trò từng thứ

| Thành phần | Ẩn dụ | Dùng cho |
|---|---|---|
| **MongoDB** | Tủ hồ sơ chính | Dữ liệu lâu dài: user, booking, tin nhắn, metadata ảnh. Document giống JSON — dân FE nhìn quen mắt. |
| **Redis** | Giấy nhớ dán trên bàn | Dữ liệu tạm, cực nhanh: cache, token bị thu hồi, hàng đợi job. Mất cũng dựng lại được. |
| **Docker** | "Máy ảo mini" đóng gói sẵn | Chạy Mongo + Redis trong 2 "hộp" cách ly thay vì cài vào máy. Xoá hộp là máy sạch như chưa cài. |

Vì sao API **không** nằm trong Docker lúc dev? Mongo/Redis là hạ tầng, không cần hot-reload → để Docker lo. API là code ta sửa liên tục → chạy trên host bằng `npm run dev:api` cho watch mode nhanh. Chỉ khi muốn mô phỏng production mới chạy `docker compose --profile full up` (API chạy trong container qua `apps/api/Dockerfile`).

## 4. Luồng một request

```
Trình duyệt ──► apps/web (Next.js :3000) ──HTTP/JSON──► apps/api (NestJS :4000) ──► MongoDB :27017
   người dùng        giao diện                    Controller → Service           └─► Redis :6379
                                                                                    (trong Docker)
```

Ví dụ tính năng M3 — người dùng bấm "Tìm photographer ở Đà Nẵng":

1. **Trình duyệt**: component gọi `useQuery(['photographers', 'đà nẵng'])` → React Query nhờ axios gửi `GET /api/v1/photographers?city=danang`.
2. **Controller**: NestJS khớp URL với `@Controller('photographers')` + `@Get()` → gọi hàm tương ứng. `ValidationPipe` kiểm tra query params, sai là trả 400 luôn.
3. **Service**: `PhotographersService.search('danang')` — logic thật: lọc, xếp hạng, phân trang.
4. **Database**: service nhờ Mongoose chạy query → MongoDB trả danh sách document.
5. **Đường về**: service trả mảng → controller tự chuyển JSON → trình duyệt → React Query cache → component render.

Cái hay của phân tầng: mỗi tầng chỉ biết tầng kề nó. Component không biết MongoDB tồn tại; MongoDB không biết React là gì. Đổi database hay đổi UI, tầng còn lại không phải sửa.

Health check (`GET /api/v1/health`) chính là phiên bản mini của luồng này: controller hỏi Mongo "còn sống không?" + `PING` Redis → gom kết quả trả JSON (`503` nếu có dependency chết). Nhỏ nhất nhưng đi qua đủ các tầng — vì vậy nó là tính năng đầu tiên.

## 5. Quy trình làm việc mỗi ngày

```bash
docker compose up -d    # 1. dựng hạ tầng: Mongo + Redis (chạy ngầm)
npm run dev:api         # 2. terminal 1: API :4000, tự reload khi sửa code
npm run dev:web         # 3. terminal 2: web :3000, tự reload khi sửa code
```

Ba tiến trình độc lập: sửa FE không ảnh hưởng API đang chạy và ngược lại. Push lên GitHub → CI tự chạy lint + build + test.

Kiểm tra hạ tầng bất kỳ lúc nào: `curl http://localhost:4000/api/v1/health`.

## 6. Các quyết định kỹ thuật đã chốt

| Quyết định | Lý do ngắn gọn |
|---|---|
| **Một app web duy nhất** cho Customer + Photographer + Admin, tách bằng App Router route groups (`(public)/`, `(customer)/`, `studio/`, `admin/`) | Q7 cho phép vai trò kép với role switcher — tách app là phải đồng bộ phiên đăng nhập cross-domain; Project Workspace là không gian chung của cả hai vai trò; một mình maintain 2 deploy không đáng. Admin là ứng viên duy nhất đáng tách về sau. |
| **Giữ npm**, không chuyển yarn | Mọi thứ đang chạy (workspaces/CI/Dockerfile/lockfile); yarn 1 ở chế độ maintenance, yarn Berry PnP hay đụng độ tooling. Nếu ngày nào cần chuyển thì ứng viên đúng là **pnpm** (khi repo phình thêm packages). |
| **Node 22** pin qua `.nvmrc` | Bản LTS mới nhất có sẵn trên máy qua nvm; NestJS 11 yêu cầu Node ≥ 20. |
| Phân quyền chặn ở `middleware.ts` (FE) **và** guard ở API | FE chỉ là lớp UX; quyền thật luôn nằm ở BE. |

Ghi chú vận hành: nếu `npm install` lỗi `EACCES` ở `~/.npm` (cache dính file thuộc root), chạy một lần: `sudo chown -R $(whoami) ~/.npm`.

## 7. Deploy targets (free tier)

Kế hoạch deploy cho M8. Trước đó chạy local là đủ — kể cả M6/Stripe (dùng `stripe listen` forward webhook về local, chưa cần URL công khai).

| Thành phần | Dịch vụ | Free tier | Ghi chú |
|---|---|---|---|
| `apps/web` | **Vercel** (Hobby) | Thoải mái cho hobby | Chính chủ Next.js, auto deploy theo git push |
| `apps/api` | **Render** (free web service) | 512MB RAM | ⚠️ Ngủ sau ~15 phút idle, cold start ~30–60s |
| MongoDB | **MongoDB Atlas** (M0) | 512MB storage | Không ngủ, đủ cho toàn bộ MVP |
| Redis | **Upstash** (free) | Quota theo số lệnh/tháng | Serverless, không ngủ |
| Ảnh | **Cloudflare R2** | 10GB + egress miễn phí | Đúng lựa chọn trong SRS |
| Email | **Resend** (free) | ~100 email/ngày | Đủ cho OTP + notification |
| Thanh toán | **Stripe test mode** | Miễn phí vô hạn | Không cần tiền thật |

**Ba điểm cần biết:**

1. **API ngủ trên Render free là đánh đổi lớn nhất** — ảnh hưởng chat Socket.IO (M5): container ngủ là rớt kết nối, request đầu sau giờ nghỉ chờ cold start. Demo/học chấp nhận được; cần always-on thì nâng instance trả phí (~7$/tháng) hoặc chuyển VPS.
2. **BullMQ + Upstash free cần để ý** — BullMQ polling Redis liên tục, Upstash free tính quota theo số lệnh nên worker 24/7 có thể ăn hết quota. Xử lý: concurrency thấp + tăng `drainDelay`, hoặc dùng Redis Cloud 30MB free (tính theo dung lượng, không theo lệnh).
3. **Cron tính Trust Score (M7)** chạy trong process API — API ngủ thì cron không chạy. Giải pháp free: cron-job.org hoặc GitHub Actions schedule gọi endpoint đánh thức + kích hoạt job.

**Phương án thay thế cho M8:** VPS **Oracle Cloud Always Free** (ARM 4 vCPU / 24GB RAM — hào phóng nhất thị trường, nhưng đăng ký hay bị từ chối). Chạy nguyên `docker compose --profile full up` — API + Mongo + Redis luôn bật, sát production và đúng mục tiêu học devops hơn PaaS bấm nút. Web vẫn để Vercel.

> Giới hạn free tier thay đổi thường xuyên — tới M8 kiểm tra lại trang pricing từng dịch vụ trước khi chốt.
