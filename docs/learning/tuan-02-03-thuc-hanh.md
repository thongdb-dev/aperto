# Tuần 2–3 — Thực hành step-by-step + Câu hỏi & Đáp án

> File đồng hành với [tuan-02-03.md](./tuan-02-03.md) (kế hoạch 8 buổi) và 5 file lý thuyết: [Mongoose/bcrypt](./tuan-02-mongoose-bcrypt.md), [JWT/token](./tuan-02-jwt-tokens.md), [Guard/Passport](./tuan-02-guards-passport.md), [OTP/interceptor](./tuan-03-otp-axios-interceptor.md), [NestJS Testing](./tuan-03-nestjs-testing.md).
>
> **Khác Tuần 1:** chưa có code sẵn — code mẫu dưới đây là **khung tham khảo để bạn tự gõ và điều chỉnh**, không phải "đáp án" duy nhất. Đặt tên biến/file theo phong cách bạn thấy hợp lý; quan trọng là hiểu **tại sao** mỗi phần tồn tại. Làm từng lab theo đúng thứ tự — mỗi lab phụ thuộc lab trước (schema → login → guard → refresh...).

---

## Chuẩn bị chung

```bash
cd apps/api
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt
npm install -D @types/passport-jwt @types/passport-local @types/bcrypt
```

Thêm vào `apps/api/.env` (và `.env.example`) 2 secret riêng cho access/refresh — **không dùng chung 1 secret** (nếu access token bị lộ thuật toán/secret, refresh token vẫn an toàn độc lập):

```
JWT_ACCESS_SECRET=doi-thanh-chuoi-ngau-nhien-dai-it-nhat-32-ky-tu
JWT_REFRESH_SECRET=mot-chuoi-khac-cung-dai-va-ngau-nhien
```

Cập nhật `env.validation.ts` (Tuần 1 đã học Joi) để 2 biến này bắt buộc — thiếu thì app từ chối khởi động, đúng tinh thần fail-fast đã học.

---

## Phần A — Lab step-by-step

### Lab 1: Schema users + đăng ký

#### Bước 1.1 — Viết schema

Tạo `apps/api/src/users/schemas/user.schema.ts` theo mẫu ở [tuan-02-mongoose-bcrypt.md](./tuan-02-mongoose-bcrypt.md#1-schema-là-blueprint-model-là-công-cụ-thao-tác). Đăng ký `UsersModule` với `MongooseModule.forFeature([...])`, export `MongooseModule` để `AuthModule` dùng lại model mà không cần khai báo lần 2.

#### Bước 1.2 — DTO + AuthModule + register

```ts
// auth/dto/register.dto.ts
export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
```

```ts
// auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async register(dto: RegisterDto) {
    const password_hash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.userModel.create({ email: dto.email, password_hash });
      return { id: user._id, email: user.email };
    } catch (err) {
      if (err.code === 11000) throw new ConflictException('Email đã được sử dụng');
      throw err;
    }
  }
}
```

```ts
// auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
```

#### Bước 1.3 — Test bằng curl

```bash
npm run dev:api
curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"12345678"}' | python3 -m json.tool
```

Kỳ vọng: `{"id": "...", "email": "a@test.com"}` — **không có** `password_hash` trong response (nếu DTO trả về nguyên document Mongoose, `password_hash` sẽ lộ ra — kiểm tra kỹ, đây là lỗi bảo mật hay gặp).

```bash
# gọi lại lần 2 với cùng email → phải 409
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" -d '{"email":"a@test.com","password":"12345678"}'
```

```bash
# kiểm tra password không lưu plaintext
docker exec -it aperto-mongo-1 mongosh --eval "use('aperto'); db.users.findOne({email:'a@test.com'})"
# password_hash phải bắt đầu bằng $2b$10$... (bcrypt), không phải "12345678"
```

---

### Lab 2: JWT login + /auth/me

#### Bước 2.1 — Ký token + so mật khẩu

```ts
// auth.service.ts (bổ sung)
constructor(
  @InjectModel(User.name) private userModel: Model<UserDocument>,
  private jwtService: JwtService,
  private config: ConfigService,
) {}

async validateUser(email: string, password: string) {
  const user = await this.userModel.findOne({ email });
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password_hash);
  return match ? user : null;
}

async login(user: UserDocument) {
  const payload = { sub: user._id.toString(), roles: user.roles };
  const accessToken = this.jwtService.sign(payload, {
    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
    expiresIn: '15m',
  });
  return { accessToken };
}
```

#### Bước 2.2 — Passport JWT strategy + Guard

Ba file nhỏ, viết theo đúng thứ tự phụ thuộc: **strategy trước** (nơi thực sự xác thực), **guard sau** (chỉ gọi lại strategy), **decorator cuối** (đọc kết quả strategy đã gắn vào `request.user`). Giải thích đầy đủ ở [tuan-02-guards-passport.md § 3](./tuan-02-guards-passport.md#3-passport-strategy--nơi-thực-sự-xác-thực).

**a) `auth/strategies/jwt.strategy.ts`** — nơi thực sự verify chữ ký + hạn token:

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload) {
    // giá trị trả về ở đây được Nest tự động gắn vào request.user
    return { userId: payload.sub, roles: payload.roles };
  }
}
```

Tên class `JwtStrategy` không tự nhiên gắn với chuỗi `'jwt'` dùng ở `AuthGuard('jwt')` (mục b) — chúng khớp nhau vì `PassportStrategy(Strategy)` không truyền tên tuỳ chỉnh, nên Passport dùng tên mặc định của package `passport-jwt` là `"jwt"`. Nếu sau này có nhiều JWT strategy khác nhau (ví dụ verify refresh token riêng), truyền tên thứ 2: `PassportStrategy(Strategy, 'jwt-refresh')` rồi gọi `AuthGuard('jwt-refresh')`.

**b) `auth/guards/jwt-auth.guard.ts`** — chỉ 2 dòng vì mọi logic đã nằm ở strategy:

```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**c) `auth/decorators/current-user.decorator.ts`** — cần viết ngay bây giờ vì endpoint `/auth/me` ở Bước 2.3 dùng `@CurrentUser()` (Lab 3 chỉ thêm `@Roles()` + `RolesGuard`, decorator này không viết lại):

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**d) Đăng ký `PassportModule` + `JwtModule` trong `AuthModule`** — thêm vào `imports`, và thêm `JwtStrategy` vào `providers` (guard không cần khai báo provider — `@Injectable()` và dùng trực tiếp trong `@UseGuards()` là đủ):

```ts
// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,             // đã export MongooseModule ở Lab 1 — không khai báo forFeature lại ở đây
    PassportModule,
    JwtModule.register({}),  // {} vì secret truyền tay lúc sign()/verify(), không đặt global ở đây
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

Nếu `AuthModule` bạn đang có mới chỉ `imports: [UsersModule]`, chỉ cần **thêm** `PassportModule`, `JwtModule.register({})` vào `imports` và `JwtStrategy` vào `providers` — giữ nguyên `UsersModule`, **không** thêm `MongooseModule.forFeature(...)` một lần nữa (đó là dư thừa: model `User` đã có sẵn nhờ `UsersModule` export `MongooseModule`, xem lại [Bước 1.1](#bước-11--viết-schema)).

**e) Cập nhật `env.validation.ts`** để 2 secret JWT là bắt buộc — thiếu thì app phải từ chối khởi động ngay (fail-fast), thay vì để lộ ra runtime khi có request đầu tiên gọi `config.getOrThrow(...)` mới throw (đúng bài học Joi ở Tuần 1):

```ts
// config/env.validation.ts — thêm 2 dòng vào object hiện có
JWT_ACCESS_SECRET: Joi.string().min(32).required(),
JWT_REFRESH_SECRET: Joi.string().min(32).required(),
```

**f) Kiểm tra chéo trước khi chạy thử:** nếu `auth.service.ts` đang gọi `this.config.getOrThrow('JWT_ACCESS_SECRET')` trong hàm `login()` — tên biến này phải khớp **chính xác** với key khai báo ở `.env.example`/`.env` (`JWT_ACCESS_SECRET`). Lệch tên là bug hay gặp khi gõ tay, và nó chỉ lộ ra khi gọi `/auth/login` (throw `ConfigError`), không lộ lúc khởi động vì `getOrThrow` chỉ được gọi trong hàm, không phải lúc bootstrap.

**Thí nghiệm "phá để hiểu" (tuỳ chọn, ôn lại DI Tuần 1):** tạm xoá `JwtStrategy` khỏi mảng `providers` của `AuthModule` rồi khởi động lại. Kỳ vọng: lỗi kiểu `Nest can't resolve dependencies of the JwtAuthGuard` hoặc lỗi liên quan tới strategy `'jwt'` không tìm thấy — cùng bản chất lỗi bạn đã gặp ở Tuần 1 khi xoá `exports` của `RedisModule`, chỉ khác chỗ thiếu lần này nằm ở `providers`.

#### Bước 2.3 — Endpoint login + /me

```ts
@Post('login')
async login(@Body() dto: LoginDto) {
  const user = await this.authService.validateUser(dto.email, dto.password);
  if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
  return this.authService.login(user);
}

@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@CurrentUser() user) {
  return user;
}
```

#### Bước 2.4 — Test bằng curl

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"12345678"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

curl -s http://localhost:4000/api/v1/auth/me -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
# kỳ vọng: {"userId": "...", "roles": ["customer"]}

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/v1/auth/me
# không gửi token → 401

curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" -d '{"email":"a@test.com","password":"sai-mat-khau"}'
# → 401, thử decode body xem message có "chung chung" không (không lộ email tồn tại)
```

Decode thử token trên [jwt.io](https://jwt.io) — dán `$TOKEN` vào, xem payload có `sub`, `roles`, `exp` — và tự nhắc lại: ai cũng đọc được payload này, **không** phải chỗ giấu bí mật.

---

### Lab 3: Guard, decorator, phân quyền

#### Bước 3.1 — Viết 3 file theo lý thuyết

Theo đúng mẫu ở [tuan-02-guards-passport.md](./tuan-02-guards-passport.md#4-custom-decorator--gói-code-lặp-lại-thành-1-dòng-khai-báo): `current-user.decorator.ts`, `roles.decorator.ts`, `roles.guard.ts`. Đăng ký `RolesGuard` cần `Reflector` — không cần khai báo tay, Nest tự inject `Reflector` vào constructor vì nó là provider có sẵn của framework (giống cách `ConfigService` tự có sẵn từ Tuần 1).

#### Bước 3.2 — Gắn thử vào 1 endpoint

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('photographer')
@Get('photographer-only')
photographerOnly(@CurrentUser() user) {
  return { message: 'OK', user };
}
```

#### Bước 3.3 — Test phân quyền bằng curl

```bash
# user vừa tạo mặc định roles: ["customer"] → gọi endpoint photographer
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/v1/auth/photographer-only \
  -H "Authorization: Bearer $TOKEN"
# kỳ vọng: 403
```

Đổi tạm `roles` của user đó trong Mongo để test nhánh cho phép:

```bash
docker exec -it aperto-mongo-1 mongosh --eval \
  "use('aperto'); db.users.updateOne({email:'a@test.com'}, {\$set: {roles: ['customer','photographer']}})"
# login lại lấy TOKEN mới (payload roles cũ đã ký, phải re-login để có token mang roles mới)
```

```bash
curl -s http://localhost:4000/api/v1/auth/photographer-only -H "Authorization: Bearer $TOKEN"
# kỳ vọng: 200, {"message": "OK", ...}
```

**Thí nghiệm hiểu thứ tự Guard:** tạm đảo `@UseGuards(RolesGuard, JwtAuthGuard)` (RolesGuard trước). Kỳ vọng: lỗi hoặc `user` là `undefined` trong `RolesGuard` vì `JwtAuthGuard` chưa kịp chạy để gắn `request.user`. Trả lại thứ tự đúng sau khi quan sát.

---

### Lab 4: Refresh token + rotation + Redis

Buổi khó nhất — vẽ sequence diagram (giấy hoặc mermaid) **trước khi** code, theo đúng lý thuyết ở [tuan-02-jwt-tokens.md](./tuan-02-jwt-tokens.md#4-refresh-rotation--reuse-detection).

#### Bước 4.1 — Sinh refresh token kèm login

`login()` ở Bước 2.1 ký access token **inline**, đủ dùng khi chưa có refresh token. Giờ `login()` phải làm nhiều việc hơn (ký access + ký refresh + hash + ghi Redis) nên tách phần ký access token ra một hàm private `signAccess()` — vừa gọn `login()`, vừa tái dùng được nếu sau này có chỗ khác cần ký lại access token mà không qua login đầy đủ. Đồng thời cần inject Redis client — dùng lại đúng token `REDIS_CLIENT` đã học ở Tuần 1 (`RedisModule` đã `@Global()` + `exports`, nên `AuthModule` không cần `imports` thêm gì để inject được):

```ts
// auth.service.ts — constructor cập nhật, thêm Redis
constructor(
  @InjectModel(User.name) private userModel: Model<UserDocument>,
  @Inject(REDIS_CLIENT) private redis: Redis,
  private jwtService: JwtService,
  private config: ConfigService,
) {}

private signAccess(user: UserDocument) {
  const payload = { sub: user._id.toString(), roles: user.roles };
  return this.jwtService.sign(payload, {
    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
    expiresIn: '15m',
  });
}

async login(user: UserDocument) {
  const tokenId = randomUUID();
  const accessToken = this.signAccess(user);
  const refreshToken = this.jwtService.sign(
    { sub: user._id.toString(), tokenId },
    { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: '7d' },
  );

  const hash = createHash('sha256').update(refreshToken).digest('hex');
  await this.redis.set(`refresh:${user._id}:${tokenId}`, hash, 'EX', 7 * 24 * 3600);

  return { accessToken, refreshToken };
}
```

`REDIS_CLIENT` và `Redis` import từ đúng chỗ đã dùng ở [health.controller.ts](../../apps/api/src/health/health.controller.ts) Tuần 1: `import { REDIS_CLIENT } from '../redis/redis.module'; import Redis from 'ioredis';`.

#### Bước 4.2 — Endpoint refresh với rotation

```ts
@Post('refresh')
async refresh(@Body('refreshToken') token: string) {
  return this.authService.refresh(token);
}
```

```ts
async refresh(token: string) {
  let payload: { sub: string; tokenId: string };
  try {
    payload = this.jwtService.verify(token, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') });
  } catch {
    throw new UnauthorizedException('Refresh token không hợp lệ');
  }

  const key = `refresh:${payload.sub}:${payload.tokenId}`;
  const storedHash = await this.redis.get(key);
  const incomingHash = createHash('sha256').update(token).digest('hex');

  if (!storedHash || storedHash !== incomingHash) {
    // không thấy key, hoặc hash lệch → token đã bị rotate/thu hồi trước đó = dấu hiệu reuse
    await this.redis.del(...(await this.redis.keys(`refresh:${payload.sub}:*`)));  // revoke toàn bộ session
    throw new UnauthorizedException('Refresh token đã bị thu hồi');
  }

  await this.redis.del(key);   // rotation: token cũ chết ngay
  const user = await this.userModel.findById(payload.sub);
  return this.login(user);     // cấp cặp token mới, ghi key Redis mới
}
```

> Lưu ý: `redis.keys(...)` chỉ dùng chấp nhận được ở quy mô dev/nhỏ — production nên duy trì một set riêng theo dõi các `tokenId` đang sống của mỗi user để tránh lệnh `KEYS` (chặn Redis khi dữ liệu lớn). Ghi việc này vào backlog nếu muốn tối ưu sau.

#### Bước 4.3 — Endpoint logout

Giữ đúng phân công vai trò như `register`/`login`: controller chỉ định tuyến + giao việc, `AuthService` chứa logic thật (decode token, xoá key Redis).

```ts
// auth.service.ts
logout(userId: string, refreshToken: string) {
  const payload = this.jwtService.decode(refreshToken) as { tokenId: string };
  return this.redis.del(`refresh:${userId}:${payload.tokenId}`);
}
```

```ts
// auth.controller.ts
@UseGuards(JwtAuthGuard)
@Post('logout')
logout(@CurrentUser() user, @Body('refreshToken') token: string) {
  this.authService.logout(user.userId, token);
  return { message: 'Đã đăng xuất' };
}
```

Không dùng `@Inject(REDIS_CLIENT)`/`JwtService` trực tiếp trong controller — controller không cần biết Redis key được đặt tên thế nào hay JWT decode ra sao, chỉ cần biết "gọi `authService.logout(...)` là xong". Lợi ích y hệt bài học DI ở Tuần 1: đổi cách lưu session (ví dụ chuyển từ Redis sang DB khác) chỉ sửa `AuthService`, không đụng `AuthController`; và khi viết unit test cho `logout`, mock `AuthService` là đủ, không cần dựng `JwtAuthGuard` + request thật.

#### Bước 4.4 — Test đủ 3 tình huống

```bash
# 1. Login lấy cặp token
RES=$(curl -s -X POST http://localhost:4000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"12345678"}')
ACCESS=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
REFRESH=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin)['refreshToken'])")

# 2. Refresh hợp lệ → nhận cặp MỚI
NEW=$(curl -s -X POST http://localhost:4000/api/v1/auth/refresh -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}")
echo $NEW   # kỳ vọng: accessToken + refreshToken khác với bước 1

# 3. Dùng lại REFRESH cũ (đã rotate) → 401 (reuse detection)
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH\"}"

# 4. logout bằng token mới rồi refresh lại bằng token đó → 401
```

Kiểm tra Redis trực tiếp để thấy key mất đi sau rotation/logout:

```bash
docker exec -it aperto-redis-1 redis-cli KEYS "refresh:*"
```

**✅ Kiểm chứng giữa module:** vẽ lại sequence diagram không nhìn tài liệu — đủ 3 nhánh: access hết hạn (FE tự refresh), refresh hợp lệ (rotation), refresh đã bị rotate (reuse → 401 + revoke).

---

### Lab 5: OTP email xác thực

#### Bước 5.1 — Sinh + lưu OTP theo mẫu

Viết theo code mẫu ở [tuan-03-otp-axios-interceptor.md](./tuan-03-otp-axios-interceptor.md#1-otp-là-gì-và-vì-sao-cần-ttl--giới-hạn-số-lần-thử). Gọi hàm sinh OTP ngay sau khi `register` thành công.

```bash
npm install resend   # hoặc dùng nodemailer trỏ Mailtrap SMTP cho dev
```

#### Bước 5.2 — Endpoint verify

```ts
@Post('verify-otp')
async verifyOtp(@Body() dto: VerifyOtpDto) {
  await this.authService.verifyOtp(dto.userId, dto.code);
  return { message: 'Xác thực thành công' };
}
```

#### Bước 5.3 — Test

```bash
# lấy OTP thẳng từ Redis cho dev (thay vì đọc email Mailtrap)
docker exec -it aperto-redis-1 redis-cli GET "otp:<userId>"

curl -s -X POST http://localhost:4000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" -d '{"userId":"<userId>","code":"<otp-từ-redis>"}'
# kỳ vọng: 200, user.status chuyển sang "active"

# thử sai OTP 6 lần liên tiếp → lần thứ 6 phải bị chặn dù OTP đúng
```

---

### Lab 6: FE + form + axios interceptor

#### Bước 6.1 — Form đăng ký/đăng nhập

Trong `apps/web`, dùng MUI + `react-hook-form` + `zod` (hoặc validate tay khớp DTO server: email hợp lệ, password ≥ 8). Gọi API qua instance axios sẽ viết ở bước sau.

#### Bước 6.2 — Axios instance với interceptor

Viết đúng theo code đầy đủ ở [tuan-03-otp-axios-interceptor.md](./tuan-03-otp-axios-interceptor.md#5-response-interceptor-bắt-401--refresh--retry) — copy khung, đổi theo cách bạn lưu access token (biến module-level, hoặc React context/Zustand store).

#### Bước 6.3 — Test tận mắt race condition đã học

Trong DevTools console của trang `/me` (đã login), giảm TTL access token xuống 10 giây (env dev), rồi bắn 3 request song song sau khi hết hạn:

```js
Promise.all([api.get('/auth/me'), api.get('/auth/me'), api.get('/auth/me')])
  .then(console.log);
```

Mở tab Network: kỳ vọng thấy **chỉ 1 lời gọi** `/auth/refresh` dù có 3 request 401 — nếu thấy 3 lời gọi refresh, hàng đợi (`isRefreshing`/`pendingQueue`) chưa hoạt động đúng, quay lại đọc mục 5 trong lý thuyết.

#### Bước 6.4 — Trang /me + logout

Hiển thị `email`, `roles` từ response `/auth/me`; nút logout gọi `/auth/logout` rồi xoá access token khỏi bộ nhớ JS + điều hướng về `/login`.

---

### Lab 8: Unit test + kiểm chứng cuối module

#### Bước 8.1 — Viết `auth.service.spec.ts`

Theo khung ở [tuan-03-nestjs-testing.md](./tuan-03-nestjs-testing.md#2-testcreatetestingmodule--dựng-một-app-giả-chỉ-để-test): mock `getModelToken(User.name)` và `JwtService`. Viết đủ các case liệt kê ở mục 5 file đó (register: trùng email / thành công; login: sai mật khẩu / đúng).

```bash
npm run test:api -- --watch   # chạy trong lúc viết, xem đỏ→xanh
```

#### Bước 8.2 — Script kiểm chứng cuối module

Lưu lại thành file `apps/api/scripts/verify-m1.sh` (không bắt buộc commit, nhưng tiện chạy lại):

```bash
#!/bin/bash
set -e
BASE=http://localhost:4000/api/v1

echo "1. Login..."
RES=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"12345678"}')
ACCESS=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
REFRESH=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin)['refreshToken'])")

echo "2. Đợi access hết hạn (đặt JWT_ACCESS_EXPIRES=10s lúc test)..."
sleep 12
CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE/auth/me -H "Authorization: Bearer $ACCESS")
[ "$CODE" == "401" ] && echo "  OK: access hết hạn → 401" || echo "  FAIL: expect 401, got $CODE"

echo "3. Refresh..."
NEW=$(curl -s -X POST $BASE/auth/refresh -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH\"}")
NEW_ACCESS=$(echo $NEW | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

echo "4. Retry /me với token mới..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE/auth/me -H "Authorization: Bearer $NEW_ACCESS")
[ "$CODE" == "200" ] && echo "  OK: retry thành công" || echo "  FAIL: expect 200, got $CODE"

echo "5. Logout rồi refresh bằng token cũ..."
curl -s -X POST $BASE/auth/logout -H "Authorization: Bearer $NEW_ACCESS" \
  -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH\"}" > /dev/null
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/auth/refresh \
  -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH\"}")
[ "$CODE" == "401" ] && echo "  OK: refresh token cũ bị từ chối" || echo "  FAIL: expect 401, got $CODE"
```

Chạy và xác nhận cả 4 bước in "OK".

---

## Phần B — Câu hỏi & Đáp án

Tự trả lời trước khi mở đáp án.

### Mongoose & bcrypt

**Q1. Vì sao cần cả unique index lẫn validate DTO cho email, không dùng 1 trong 2 là đủ?**

<details>
<summary>Đáp án</summary>

DTO validate (class-validator) chỉ kiểm tra *hình dạng* input, không biết DB đã có email đó chưa — không chặn được trùng lặp. Unique index chặn được trùng lặp kể cả dưới race condition (2 request đăng ký cùng email đồng thời), nhưng lỗi nó trả về (`E11000`) rất kỹ thuật, không phù hợp hiển thị thẳng cho người dùng. Cần cả hai: DTO validate cho trải nghiệm (báo lỗi định dạng ngay), unique index cho tính đúng đắn dữ liệu dưới tải thật.
</details>

**Q2. Tăng cost factor bcrypt từ 10 lên 11 ảnh hưởng gì?**

<details>
<summary>Đáp án</summary>

Thời gian hash **gấp đôi** (bcrypt lặp 2^cost lần). Tăng cost làm brute-force offline chậm gấp đôi, nhưng cũng làm server tốn gấp đôi CPU cho mỗi lần đăng ký/login — cần cân bằng giữa bảo mật và trải nghiệm/tải server. Cost 10–12 là phổ biến cho ứng dụng web thông thường năm 2026.
</details>

### JWT & token

**Q3. Vì sao JWT không phải chỗ giấu dữ liệu nhạy cảm?**

<details>
<summary>Đáp án</summary>

Payload JWT chỉ base64url-encode, không mã hoá — bất kỳ ai cầm token đều decode đọc được nội dung (thử trên jwt.io không cần secret). Secret chỉ dùng để ký/verify chữ ký, đảm bảo payload không bị sửa mà không bị phát hiện, không giấu được nội dung khỏi người đọc.
</details>

**Q4. Tại sao access và refresh token nên dùng 2 secret khác nhau?**

<details>
<summary>Đáp án</summary>

Cô lập rủi ro: nếu secret access token bị lộ (ví dụ log lỡ in ra), kẻ tấn công chỉ giả được access token (thiệt hại giới hạn 15 phút và không revoke được đường nào khác), không giả được refresh token để duy trì session dài hạn. Ngược lại cũng vậy.
</details>

**Q5. Refresh rotation biến refresh token thành gì, và "reuse detection" tận dụng đặc tính đó ra sao?**

<details>
<summary>Đáp án</summary>

Rotation biến refresh token thành **dùng một lần** — mỗi lần refresh, token cũ bị xoá khỏi Redis ngay. Vì thế nếu một refresh token *đã bị rotate* xuất hiện lại (ai đó cố dùng bản cũ), đó gần như chắc chắn là dấu hiệu có 2 bên cùng giữ token (chủ thật + kẻ trộm) — hệ thống coi đây là xâm phạm và revoke toàn bộ session của user, không cần cơ chế phát hiện riêng nào khác.
</details>

**Q6. Vì sao lưu *hash* của refresh token vào Redis thay vì lưu token thô?**

<details>
<summary>Đáp án</summary>

Nếu Redis bị đọc trộm (backup lộ, misconfiguration), lưu token thô nghĩa là lộ luôn "chìa khoá" dùng được ngay. Lưu hash (SHA256 là đủ ở đây vì mục đích là so khớp, không phải chống brute-force như mật khẩu) thì kẻ tấn công có dữ liệu Redis cũng không tái tạo lại được token gốc để giả mạo.
</details>

### Guard & Passport

**Q7. `JwtAuthGuard` và `RolesGuard` phải khai báo theo thứ tự nào trong `@UseGuards(...)`, tại sao?**

<details>
<summary>Đáp án</summary>

`@UseGuards(JwtAuthGuard, RolesGuard)` — `JwtAuthGuard` trước. Guard chạy tuần tự theo thứ tự khai báo; `JwtAuthGuard` xác thực token và gắn `request.user`, `RolesGuard` chạy sau cần đọc `request.user.roles` để so sánh. Đảo ngược thứ tự, `RolesGuard` sẽ không có `user` để đọc.
</details>

**Q8. `@Roles('photographer')` một mình có chặn được gì không?**

<details>
<summary>Đáp án</summary>

Không — `@Roles()` chỉ gắn metadata (qua `SetMetadata`) lên route, bản thân nó không kiểm tra gì. Việc chặn thực sự do `RolesGuard` đọc lại metadata đó bằng `Reflector` và so với `request.user.roles`. Thiếu `RolesGuard` trong `@UseGuards`, `@Roles()` là vô tác dụng — route vẫn mở cho mọi role.
</details>

**Q9. `validate()` trong Passport Strategy trả về gì thì nó đi đâu?**

<details>
<summary>Đáp án</summary>

Giá trị `validate()` trả về được Nest tự động gắn vào `request.user` — đây là lý do `@CurrentUser()` chỉ cần đọc `request.user` mà không cần biết token được xác thực bằng strategy nào (local hay jwt).
</details>

### OTP & Interceptor

**Q10. OTP 6 số có 1 triệu khả năng — vì sao TTL không đủ, cần thêm gì?**

<details>
<summary>Đáp án</summary>

TTL chỉ giới hạn *thời gian* OTP còn hiệu lực, không giới hạn *số lần thử* trong thời gian đó. Với không gian chỉ 1 triệu khả năng, script tự động có thể thử hết trong vài giây nếu không giới hạn số lần. Cần đếm số lần sai (ví dụ giới hạn 5) và vô hiệu hoá OTP đó ngay khi vượt ngưỡng, không đợi hết TTL.
</details>

**Q11. Vì sao không để mỗi request 401 tự gọi `/auth/refresh` riêng?**

<details>
<summary>Đáp án</summary>

Vì refresh có rotation — refresh token dùng một lần. Nhiều lời gọi refresh song song thì chỉ lời gọi đầu thành công (rotate token), các lời gọi sau dùng lại token đã bị rotate sẽ thất bại (giống bị coi là reuse). Cần đảm bảo chỉ 1 lời gọi refresh "đang bay" tại một thời điểm, các request 401 khác xếp hàng chờ kết quả của lời gọi đó.
</details>

**Q12. Trong interceptor, tại sao gọi `/auth/refresh` bằng `axios` gốc thay vì qua instance `api` có gắn interceptor?**

<details>
<summary>Đáp án</summary>

Nếu gọi qua `api` (đã gắn response interceptor bắt 401), một lỗi trong chính request refresh (ví dụ refresh token cũng hết hạn) có thể lại kích hoạt interceptor 401, dẫn tới gọi refresh lồng refresh — đệ quy không cần thiết và khó kiểm soát. Gọi bằng axios gốc tránh vòng lặp đó, chỉ xử lý lỗi refresh tường minh trong nhánh `catch`.
</details>

### Testing

**Q13. `getModelToken(User.name)` dùng để làm gì trong test?**

<details>
<summary>Đáp án</summary>

Đây là **token thật** mà `@InjectModel(User.name)` dùng phía sau để Nest resolve dependency. Trong test, cung cấp `{ provide: getModelToken(User.name), useValue: mockObject }` với đúng token đó để "đánh lừa" `AuthService` — nó vẫn nghĩ mình nhận được model Mongoose thật, thực chất là object giả `jest.fn()`. Đây là ứng dụng trực tiếp của DI: đổi provider qua token, không sửa code class đang test.
</details>

**Q14. Vì sao unit test `AuthService` không cần Docker/Mongo/Redis đang chạy?**

<details>
<summary>Đáp án</summary>

Vì mọi phụ thuộc bên ngoài (model Mongoose, JwtService...) đều được thay bằng `useValue` mock trong `Test.createTestingModule` — service chạy hoàn toàn cô lập trong bộ nhớ, không có kết nối mạng/DB thật nào xảy ra. Đây là điểm khác biệt với E2E test (dùng `supertest`), vốn cần app bootstrap thật và thường cần DB test riêng.
</details>

---

## Checklist chốt tuần

- [ ] Làm hết Lab 1–6, Lab 8; script `verify-m1.sh` chạy đủ 4 bước "OK"
- [ ] Trả lời đúng ≥ 10/14 câu phần B mà chưa mở đáp án
- [ ] Vẽ lại sequence diagram refresh (3 tình huống) không nhìn tài liệu
- [ ] Unit test `AuthService` xanh, chạy trong CI qua PR vào `develop`
- [ ] Mỗi nhánh `feat/m1-*` (xem [workflow nhánh](./tuan-02-03.md#workflow-nhánh-cho-m1)) đã merge vào `develop`; PR cuối `develop → main` đã tạo khi mục ✅ toàn module đạt
- [ ] Nhật ký cập nhật: chọn lưu token ở đâu (cookie vs localStorage) + lý do; thiết kế `roles` cho Q7 (vai trò kép)
