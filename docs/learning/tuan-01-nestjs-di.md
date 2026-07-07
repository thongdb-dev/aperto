# Tuần 1 — Ghi chú lý thuyết: NestJS overview & Dependency Injection

> Ghi chú đồng hành với **Buổi 2** trong [tuan-01.md](./tuan-01.md) — cùng định dạng với [tuan-01-docker.md](./tuan-01-docker.md) (Buổi 1). Đọc song song với [docs.nestjs.com](https://docs.nestjs.com) phần Overview (First steps → Controllers → Providers → Modules); mọi ví dụ lấy từ chính [app.module.ts](../../apps/api/src/app.module.ts), [app.controller.ts](../../apps/api/src/app.controller.ts), [health.controller.ts](../../apps/api/src/health/health.controller.ts), [redis.module.ts](../../apps/api/src/redis/redis.module.ts) của Aperto.
>
> Phần **thực hành** (chạy, trace DI bằng tay, và 2 thí nghiệm "phá để hiểu") nằm ở [Lab 2 trong tuan-01-thuc-hanh.md](./tuan-01-thuc-hanh.md#lab-2-chạy-api--trace-luồng-nestjs-di) — file này chỉ giải thích khái niệm, không lặp lại lab.

---

## 1. Module

**Module** là đơn vị tổ chức code cơ bản của Nest — một class gắn `@Module()` khai báo "trong phạm vi này có gì và dùng gì từ nơi khác". Bốn trường quan trọng:

- `imports`: các module khác mà module này cần dùng
- `controllers`: các controller thuộc module này
- `providers`: các service/provider thuộc module này
- `exports`: những gì module này **cho phép module khác dùng lại**

Aperto có 2 kiểu module rất khác nhau, nên so sánh cạnh nhau:

```ts
// app.module.ts — module GỐC, chỉ import, không tự khai controller/provider nghiệp vụ
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    MongooseModule.forRootAsync({ ... }),
    RedisModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

```ts
// health.module.ts — module TÍNH NĂNG (feature module), chỉ có 1 controller
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

`HealthModule` không có `providers` riêng vì `HealthController` chỉ cần `Connection` (Mongoose, đã global qua `MongooseModule`) và `REDIS_CLIENT` (đã global qua `RedisModule`) — nó **mượn** provider từ 2 module khác chứ không tự tạo. Đây là lý do khái niệm tiếp theo (Provider) và DI liên quan chặt tới Module: module là ranh giới "ai thấy được ai".

**Câu hỏi để tự kiểm tra:** nếu bạn tạo thêm `AuthModule` ở Tuần 2 và nó cần `REDIS_CLIENT` để lưu refresh token, `AuthModule` có cần `imports: [RedisModule]` không? (Không — vì `RedisModule` đã `@Global()`, xem mục 5. Nhưng nếu `RedisModule` không global, câu trả lời sẽ là có.)

## 2. Controller

**Controller** là lớp nhận HTTP request và trả response — nó **không chứa logic nghiệp vụ**, chỉ định tuyến (routing) và gọi provider làm việc thật.

```ts
// app.controller.ts — controller đơn giản nhất trong repo
@Controller()                          // không prefix riêng → route là ""
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()                               // GET /api/v1  (nhờ setGlobalPrefix trong main.ts)
  getHello(): string {
    return this.appService.getHello(); // giao việc cho service, controller không tự tính
  }
}
```

```ts
// health.controller.ts — controller có prefix + inject 2 phụ thuộc
@Controller('health')                  // GET /api/v1/health
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check() { ... }
}
```

Điểm mấu chốt: **prefix ghép 2 tầng** — `app.setGlobalPrefix('api/v1')` trong [main.ts](../../apps/api/src/main.ts) cộng với `@Controller('health')` ra route cuối `/api/v1/health`. Đây là lý do log khởi động NestJS in ra `RoutesResolver: HealthController {/api/v1/health}` — Nest tự ghép 2 tầng đó lúc build route table, bạn không cần nối chuỗi thủ công.

## 3. Provider (Service)

**Provider** là bất kỳ class nào được đánh dấu `@Injectable()` — nghĩa là "class này có thể được Nest tạo ra và tiêm (inject) vào chỗ khác cần nó". Provider thường chứa logic nghiệp vụ, tách khỏi controller để tái dùng được và test được độc lập.

```ts
// app.service.ts — provider tối giản
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

`AppService` không có gì phức tạp — Nest thấy `@Injectable()`, biết đây là ứng viên có thể tiêm, và vì nó nằm trong `providers: [AppService]` của `AppModule`, Nest sẽ tạo **một instance duy nhất** (mặc định là singleton scope) rồi đưa vào bất kỳ constructor nào khai báo cần `AppService` trong cùng phạm vi module.

So sánh với `RedisModule` — nơi provider **không phải** một class tự viết với `@Injectable()`, mà là kết quả của một hàm factory (mục 5). Đó là lý do NestJS cho phép định nghĩa provider theo nhiều cách (`useClass`, `useValue`, `useFactory`), không chỉ mỗi `@Injectable()` — `AppService` là dạng ngầm định đơn giản nhất (`useClass` tự suy ra).

## 4. Dependency Injection & IoC Container

Đây là khái niệm nền tảng nhất, và là mục ✅ của tuần: *"giải thích được bằng lời: DI trong NestJS hoạt động thế nào, tại sao service được inject vào controller"*.

**Vấn đề DI giải quyết:** nếu `HealthController` tự viết `new Redis('redis://...')` và `new Connection(...)` trong constructor, nó phải biết URL, retry config, thứ tự khởi tạo — và khi test, bạn không thể thay Redis thật bằng bản giả mà không sửa code controller. **Dependency Injection đảo ngược việc đó**: controller chỉ *khai báo nó cần gì* (qua kiểu tham số + decorator trong constructor), còn việc *tạo ra thứ đó và truyền vào* do một bộ máy trung tâm lo — gọi là **IoC Container** (Inversion of Control).

Khi app khởi động (`NestFactory.create(AppModule)` trong main.ts), Nest làm 4 việc:

1. Duyệt cây module bắt đầu từ `AppModule`, đăng ký mọi provider theo **token** (mặc định token = chính class, ví dụ token của `AppService` là `AppService`; với custom provider thì token có thể là Symbol — xem mục 5).
2. Với mỗi controller/provider cần khởi tạo, đọc **metadata của constructor** (nhờ decorator + thư viện `reflect-metadata` — đây là lý do TypeScript decorator không chỉ là cú pháp đẹp, nó sinh ra metadata Nest đọc được lúc runtime).
3. Với từng tham số constructor, tìm provider khớp token trong phạm vi module đã import (đệ quy — resolve dependency của dependency, ví dụ `RedisModule`'s factory cần `ConfigService` thì `ConfigService` được resolve trước).
4. Tạo instance (mặc định **singleton** — một instance dùng chung toàn app trừ khi khai báo scope khác) và truyền vào constructor.

Áp vào đúng ví dụ trong repo, chuỗi resolve của `HealthController` là:

```
HealthController
  ├─ cần Connection (Mongoose)  ← MongooseModule.forRootAsync cung cấp
  └─ cần REDIS_CLIENT           ← RedisModule cung cấp qua useFactory
                                    └─ factory đó cần ConfigService ← ConfigModule cung cấp
                                        └─ ConfigService đọc từ .env (đã validate bằng Joi)
```

Ba lý do đây là thiết kế tốt hơn `new` trực tiếp — nói được cả 3 ý này là đạt mục ✅ của tuần:

1. **Tách khởi tạo khỏi sử dụng** — controller không biết Redis URL hay retry config; đổi cách tạo Redis chỉ sửa 1 chỗ (`redis.module.ts`), không đụng vào `health.controller.ts`.
2. **Testability** — khi viết unit test, cung cấp `{ provide: REDIS_CLIENT, useValue: fakeRedisMock }` là controller nhận mock ngay, không sửa một dòng code controller (Tuần 8 sẽ dùng đúng pattern này để test `AuthService`).
3. **Vòng đời tập trung** — chỉ có **một** Redis connection cho cả app (singleton), tránh mỗi nơi tự mở connection riêng gây rò rỉ tài nguyên.

## 5. Custom provider: token + factory

Phần "nâng cao" nhưng dùng nhiều trong dự án — khi thứ cần inject **không phải** một class do bạn viết với `@Injectable()` (ví dụ: `Redis` từ thư viện `ioredis`), bạn không thể gắn decorator lên nó. Giải pháp là khai báo provider thủ công với một **token** tự đặt:

```ts
// redis.module.ts
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');   // token định danh, không đụng tên với ai

@Global()                                              // (a) miễn phải import RedisModule ở mọi module dùng nó
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,                           // (b) đăng ký: "ai hỏi token này thì đưa kết quả factory"
      inject: [ConfigService],                          // (c) factory cần ConfigService — Nest tự resolve trước
      useFactory: (config: ConfigService) =>
        new Redis(config.getOrThrow<string>('REDIS_URL'), {
          maxRetriesPerRequest: 3,
          lazyConnect: false,
        }),
    },
  ],
  exports: [REDIS_CLIENT],                             // (d) cho module khác dùng lại
})
export class RedisModule {}
```

Bốn điểm (a)-(d) đều **bắt buộc phải đủ**, thiếu 1 là app crash lúc boot (thử thật ở Lab 2, bước 2.3):

- Thiếu `(a) @Global()` → module khác phải tự `imports: [RedisModule]` mới thấy được token (không có gì sai, chỉ là phải khai báo lặp lại ở từng nơi dùng).
- Thiếu `(d) exports` → dù `@Global()`, provider vẫn **private** trong `RedisModule` — không module nào ngoài chính nó thấy được token. Đây là lỗi hay gặp nhất: nhiều người tưởng `@Global()` là đủ, nhưng `@Global()` chỉ miễn *import*, không thay được *export*.
- Phía dùng: `@Inject(REDIS_CLIENT) private readonly redis: Redis` trong `health.controller.ts` — decorator `@Inject(token)` là bắt buộc vì token là Symbol, không phải type để TypeScript tự suy luận như các case ở mục 3.

So sánh nhanh 2 cách khai báo provider trong repo:

| | `AppService` (mục 3) | `REDIS_CLIENT` (mục 5) |
|---|---|---|
| Token | chính class `AppService` | `Symbol('REDIS_CLIENT')` tự đặt |
| Cách tạo | Nest tự `new AppService()` | `useFactory` bạn viết tay |
| Cách inject | `private readonly appService: AppService` | `@Inject(REDIS_CLIENT) private readonly redis: Redis` |
| Khi dùng | class tự viết, có `@Injectable()` | thư viện ngoài / giá trị cần cấu hình runtime |

---

## Bức tranh ghép lại

**Module** khai báo ranh giới ai-thấy-được-ai → bên trong đó, **Controller** nhận request và giao việc cho **Provider** → Provider được **Dependency Injection** tạo ra và tiêm vào constructor thay vì bị `new` thủ công, nhờ một **IoC Container** trung tâm resolve cả cây phụ thuộc lúc khởi động → khi phụ thuộc không phải class tự viết (ioredis), dùng **custom provider (token + factory)** để vẫn tham gia được vào guồng máy DI đó.

Học xong lý thuyết này, quay lại [Lab 2](./tuan-01-thuc-hanh.md#lab-2-chạy-api--trace-luồng-nestjs-di) trong `tuan-01-thuc-hanh.md` để: chạy API thật, trace lại đúng chuỗi resolve ở mục 4 bằng cách đọc 3 file cạnh nhau, rồi làm 2 thí nghiệm "phá" (xoá `exports` để thấy lỗi resolve dependency; xoá `MONGODB_URI` để thấy Joi fail-fast) — hai thí nghiệm đó biến lý thuyết ở mục 4 và 5 thành trải nghiệm tay, và chính là thứ bạn cần nói lại được cho mục ✅ *"giải thích DI bằng lời"*.
