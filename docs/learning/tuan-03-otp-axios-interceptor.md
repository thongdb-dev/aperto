# Tuần 3 — Ghi chú lý thuyết: OTP xác thực & Axios Interceptor pattern

> Ghi chú đồng hành với **Buổi 5** (OTP) và **Buổi 6–7** (FE interceptor) trong [tuan-02-03.md](./tuan-02-03.md) — gộp chung vì cả hai đều nhỏ hơn so với Buổi 2/3/4. Phần thực hành: [tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md).

---

## Phần A — OTP email xác thực

### 1. OTP là gì, và vì sao cần TTL + giới hạn số lần thử

OTP (One-Time Password) là một mã ngắn hạn, dùng một lần, để chứng minh người dùng sở hữu một kênh liên lạc (email/SMS) — khác JWT ở chỗ nó không tự chứa thông tin, chỉ là một "chìa khoá tạm" đối chiếu với giá trị lưu phía server.

Thiết kế Redis tái dùng đúng pattern TTL đã học ở refresh token (Tuần 2 Buổi 4):

```
key:   otp:{userId}
value: "482913"                # mã 6 số
ttl:   600 giây (10 phút)
```

Hai điều bắt buộc để OTP an toàn:

- **TTL ngắn**: hết hạn tự động — Redis xoá key khi TTL về 0, không cần job dọn dẹp riêng. Không có TTL, một OTP cũ vẫn dùng được mãi mãi nếu ai đó lấy được nó.
- **Giới hạn số lần thử** (ví dụ 5 lần): OTP chỉ 6 chữ số = 1 triệu khả năng — không giới hạn số lần thử, brute-force 1 triệu lần là chuyện vài giây với script tự động. Đếm số lần sai trong cùng key Redis (hoặc key phụ `otp_attempts:{userId}`), quá 5 lần thì vô hiệu OTP đó luôn (không đợi hết TTL) và yêu cầu gửi lại.

```ts
async verifyOtp(userId: string, code: string) {
  const key = `otp:${userId}`;
  const attemptsKey = `otp_attempts:${userId}`;
  const attempts = await this.redis.incr(attemptsKey);
  if (attempts === 1) await this.redis.expire(attemptsKey, 600);   // TTL khớp với OTP
  if (attempts > 5) throw new TooManyRequestsException('Quá số lần thử, yêu cầu OTP mới');

  const stored = await this.redis.get(key);
  if (!stored || stored !== code) throw new BadRequestException('OTP không đúng hoặc đã hết hạn');

  await this.redis.del(key, attemptsKey);
  return true;
}
```

### 2. Setup gửi email — Resend

Hai lựa chọn cho dev, khác nhau về việc email có **thực sự đến hộp thư** hay không:

| | Mailtrap (Email Testing sandbox) | Resend |
|---|---|---|
| Email có tới hộp thư thật? | Không — bị "bẫy" lại trong hộp thư giả để xem nội dung | Có — free tier gửi thật, kể cả về Gmail/Outlook |
| Cần xác thực domain? | Không | Không, nếu dùng sender test sẵn có `onboarding@resend.dev` |
| Dùng được tới production? | Không (chỉ dev) | Có — cùng API key, chỉ đổi sender khi domain riêng đã verify |
| Phù hợp khi nào | Chỉ cần xem *nội dung* email đúng chưa, không cần test luồng nhận thật | Muốn tự tay nhận OTP về email thật để test trọn luồng (đúng yêu cầu bài Lab 5) |

Vì Lab 5 yêu cầu "lấy OTP thẳng từ Redis cho dev" **hoặc** test qua email thật, và Resend cho phép gửi thật ngay từ ngày đầu không cần domain riêng, dự án chọn **Resend** làm mặc định — code viết ra dùng được tới production, không cần đổi provider giữa chừng như Mailtrap.

**Bước 1 — Tạo tài khoản + API key:**

1. Đăng ký tại [resend.com](https://resend.com) (free tier: 100 email/ngày, 3.000/tháng — thừa cho dev).
2. Vào **API Keys** → **Create API Key** → copy giá trị (chỉ hiện 1 lần).
3. Thêm vào `apps/api/.env` (và `.env.example` với giá trị giả để người khác biết cần điền gì):

```
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

`onboarding@resend.dev` là sender **đã được Resend verify sẵn**, dùng được ngay không cần cấu hình DNS/domain — đúng tinh thần "chỉ học thứ tuần này cần dùng", để dành việc verify domain riêng cho lúc deploy thật (M8).

**Bước 2 — Bắt buộc khai báo Joi** (đúng bài học fail-fast Tuần 1 — thiếu API key phải chặn lúc khởi động, không phải lúc gửi email đầu tiên mới lộ lỗi):

```ts
// config/env.validation.ts — thêm 2 dòng
RESEND_API_KEY: Joi.string().required(),
RESEND_FROM_EMAIL: Joi.string().email().required(),
```

**Bước 3 — Cài package và viết `EmailModule`** (module dùng chung, không riêng cho Auth — M7 sẽ tái dùng cho notification email, nên tách module ngay từ đầu thay vì nhét logic gửi mail vào `AuthService`):

```bash
npm install resend
```

```ts
// email/email.module.ts
import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Global()                  // giống RedisModule ở Tuần 1 — dùng ở nhiều nơi, không muốn import lặp lại
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

```ts
// email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow('RESEND_API_KEY'));
    this.from = this.config.getOrThrow('RESEND_FROM_EMAIL');
  }

  async sendOtpEmail(to: string, code: string) {
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Mã xác thực Aperto của bạn',
      html: `<p>Mã xác thực của bạn là <strong>${code}</strong>. Mã có hiệu lực trong 10 phút, không chia sẻ mã này cho ai.</p>`,
    });
  }
}
```

Đăng ký `EmailModule` vào `AppModule.imports` (như `RedisModule`) — sau đó bất kỳ service nào (kể cả `AuthService`) chỉ cần khai báo `private emailService: EmailService` trong constructor là dùng được, đúng cơ chế DI đã học Tuần 1.

**Thay thế bằng Mailtrap (nếu muốn hoàn toàn offline, không cần internet/API key thật):** cài `nodemailer`, tạo SMTP transport trỏ tới host/port/user/pass lấy từ Mailtrap Sandbox, giữ nguyên method `sendOtpEmail(to, code)` — chỉ implementation bên trong `EmailService` đổi, chỗ gọi (`AuthService`) không đổi gì. Đây chính là lợi ích của việc trừu tượng qua `EmailService` thay vì gọi thẳng SDK ở nơi dùng.

### 3. Sinh OTP

```ts
import { randomInt } from 'crypto';

function generateOtp(): string {
  return randomInt(100000, 1000000).toString();   // 6 chữ số, khoảng [100000, 999999]
}
```

Dùng `crypto.randomInt` (CSPRNG — cryptographically secure pseudo-random number generator) của Node, **không dùng `Math.random()`**: `Math.random()` không được thiết kế để chống đoán trước — thuật toán sinh số của nó (thường là xorshift128+ hoặc tương tự tuỳ V8) có thể bị suy ngược seed từ vài giá trị output quan sát được, biến việc "đoán OTP" từ brute-force thuần thành tấn công có mục tiêu. Với dữ liệu nhạy cảm như OTP, luôn dùng nguồn ngẫu nhiên cấp mật mã — `crypto.randomInt`, `crypto.randomBytes`, không phải `Math.random()`.

### 4. Gửi OTP — ghép Redis + email thành 1 luồng

```ts
// auth.service.ts (bổ sung, cần inject thêm EmailService)
async sendOtp(user: UserDocument) {
  const code = randomInt(100000, 1000000).toString();
  await this.redis.set(`otp:${user._id.toString()}`, code, 'EX', 600);   // 10 phút, khớp bảng ở mục 1
  await this.emailService.sendOtpEmail(user.email, code);
}
```

Gọi `sendOtp(user)` ngay sau khi `register()` tạo user thành công. Một quyết định cần cân nhắc: **email gửi lỗi (Resend sập, sai key...) có nên làm hỏng luôn request đăng ký không?** Khuyến nghị: **không** — bọc lời gọi email trong `try/catch`, log lỗi, vẫn trả response đăng ký thành công (user có thể bấm "gửi lại OTP" sau). Lý do: đăng ký thành công là sự thật đã xảy ra ở DB, một lỗi ở bên thứ ba (email provider) không nên làm mất dữ liệu đã ghi hay đánh lừa client rằng đăng ký thất bại. Việc gửi mail đáng ra nên là *tác vụ bất đồng bộ, có retry* — đúng vấn đề BullMQ sẽ giải quyết ở Tuần 4–5 (M2); ở M1 chấp nhận gọi đồng bộ + try/catch là đủ, ghi việc "chuyển sang queue" vào backlog.

**Endpoint gửi lại OTP**, có giới hạn tần suất (cooldown) — khác với giới hạn *số lần thử sai* ở mục 1, đây là giới hạn *số lần yêu cầu gửi*, để tránh bị lợi dụng gửi email hàng loạt (tốn quota Resend, có thể bị dùng để spam người khác):

```ts
async requestOtp(userId: string) {
  const cooldownKey = `otp_cooldown:${userId}`;
  if (await this.redis.exists(cooldownKey)) {
    throw new BadRequestException('Vui lòng đợi trước khi yêu cầu mã mới');
  }
  await this.redis.set(cooldownKey, '1', 'EX', 60);   // tối thiểu 60s giữa 2 lần gửi

  const user = await this.userModel.findById(userId);
  if (!user) throw new UnauthorizedException();
  await this.sendOtp(user);
}
```

```ts
// auth.controller.ts
@Post('resend-otp')
resendOtp(@Body('userId') userId: string) {
  return this.authService.requestOtp(userId);
}
```

### 5. Chặn hành động khi chưa xác thực

Quyết định "chặn login hoàn toàn" hay "cho login nhưng giới hạn thao tác" khi `status = pending_verification` là một trade-off UX vs bảo mật — không có đáp án tuyệt đối. Gợi ý cân nhắc: chặn hoàn toàn đơn giản để implement và test, nhưng người dùng thật đôi khi lỡ email verification và muốn thử lại tính năng trước; cho phép login giới hạn (ví dụ chỉ xem, không booking/thanh toán) thân thiện hơn nhưng thêm một tầng kiểm tra ở mọi endpoint nhạy cảm. Ghi rõ lựa chọn + lý do vào Nhật ký — đây là loại quyết định sản phẩm nhỏ mà dự án thật luôn phải đưa ra.

**Quyết định cho Aperto: login giới hạn.** `pending_verification` vẫn login được (nhận access + refresh token bình thường), chỉ những endpoint "nhạy cảm" (booking, thanh toán ở M2+) mới đòi `status = active`. Cách implement tận dụng đúng pattern `@Roles()` + `RolesGuard` đã học ở [tuan-02-guards-passport.md](./tuan-02-guards-passport.md) — cùng một cơ chế `SetMetadata` + `Reflector`, chỉ khác điều kiện kiểm tra:

- Thêm `status` vào JWT payload lúc ký access token (`signAccess`), y hệt cách `roles` đã có sẵn trong payload — đọc thẳng từ token, không query DB lại mỗi request. Đánh đổi: `status` trong token "cũ" tối đa bằng thời hạn access token (15 phút) — user vừa xác thực OTP xong nhưng access token cũ chưa hết hạn thì các request tiếp theo bằng token đó vẫn bị coi là `pending_verification` cho tới khi refresh. Chấp nhận được vì cùng mức rủi ro với `roles` (đã chấp nhận từ Buổi 3), và OTP verify thường đi kèm gợi ý user đăng nhập lại.
- Một decorator `@RequireVerified()` (metadata `true`, giống `ROLE_KEY`) + một guard `VerifiedGuard` đọc metadata đó qua `Reflector`, so `user.status !== 'active'` thì ném `ForbiddenException`. Áp `@UseGuards(JwtAuthGuard, VerifiedGuard)` trên endpoint — thứ tự bắt buộc `JwtAuthGuard` chạy trước để `request.user` đã tồn tại lúc `VerifiedGuard` đọc, đúng bài học guard-order đã tự thử ở Lab 3.
- Code mẫu chi tiết (decorator, guard, chỗ cần sửa `signAccess`/`JwtStrategy`): [Lab 5, Bước 5.4](./tuan-02-03-thuc-hanh.md#bước-54--guard-chặn-hành-động-khi-chưa-xác-thực-tuỳ-chọn).

---

## Phần B — Axios interceptor: tự động refresh khi 401

### 6. Interceptor là gì

Axios cho phép gắn hàm chạy **trước khi request đi** (request interceptor) và **sau khi response về** (response interceptor), áp dụng cho toàn bộ instance thay vì phải lặp lại ở từng lời gọi API.

```ts
const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use((config) => {
  const token = getAccessToken();               // đọc từ bộ nhớ JS (không localStorage — xem lý thuyết Tuần 2)
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Nhờ request interceptor, mọi lời gọi qua `api.get(...)`/`api.post(...)` tự động có header `Authorization` — code gọi API ở component không cần biết gì về token.

### 7. Response interceptor bắt 401 → refresh → retry

Đây là phần khó thật sự — không chỉ "gọi refresh rồi thử lại", mà phải xử lý đúng khi **nhiều request cùng 401 gần như đồng thời** (ví dụ trang gọi 3 API song song, cả 3 đều dùng access token vừa hết hạn).

**Sai lầm hay gặp:** mỗi response 401 tự gọi `/auth/refresh` riêng → 3 request 401 sinh ra 3 lần gọi refresh song song. Vì refresh có rotation (Tuần 2 Buổi 4: refresh token là dùng-một-lần), lần gọi refresh **thứ 2 trở đi sẽ thất bại** — vì lần đầu đã rotate token, các lần sau dùng token cũ đã bị vô hiệu. Kết quả: 2 trong 3 request retry vẫn 401, tưởng nhầm là user cần đăng nhập lại dù thực ra chỉ là race condition tự gây ra.

**Giải pháp:** đảm bảo **chỉ một lời gọi refresh đang bay** tại một thời điểm; mọi request 401 khác **xếp hàng chờ** promise refresh đó, rồi cùng dùng access token mới để retry.

```ts
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  pendingQueue.push(cb);
}

function onRefreshed(newToken: string) {
  pendingQueue.forEach((cb) => cb(newToken));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status !== 401 || config._retry) {
      return Promise.reject(error);   // không phải 401, hoặc đã retry rồi (tránh vòng lặp vô hạn)
    }

    if (isRefreshing) {
      // đã có 1 refresh đang chạy → xếp hàng, đợi token mới rồi retry request này
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(config));
        });
      });
    }

    config._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axios.post('/api/v1/auth/refresh');   // gọi trực tiếp, không qua instance `api` để tránh đệ quy interceptor
      setAccessToken(data.accessToken);
      onRefreshed(data.accessToken);
      config.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(config);
    } catch (refreshError) {
      pendingQueue = [];
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
```

Ba chi tiết dễ bỏ sót khi tự viết pattern này:

- **Cờ `config._retry`**: chặn vòng lặp vô hạn nếu access token mới *vẫn* bị 401 (ví dụ do lỗi khác) — không có cờ này, request retry lại 401 sẽ lại vào interceptor, refresh lại, retry lại... mãi mãi.
- **Hàng đợi (`pendingQueue`)**: request tới trong lúc `isRefreshing = true` không tự gọi refresh, chỉ đăng ký callback rồi đợi — khi refresh xong, `onRefreshed` gọi lại tất cả callback đó với token mới.
- **Gọi refresh bằng `axios.post` gốc, không qua `api`**: nếu gọi qua instance `api` (có gắn interceptor), một lỗi trong chính request refresh có thể tự kích hoạt lại interceptor 401 — dùng axios gốc tránh đệ quy không cần thiết.

### 8. Vì sao không dùng thư viện có sẵn (`axios-auth-refresh` chẳng hạn)

Bài tập yêu cầu tự viết tay vì: (1) thư viện giấu đi đúng phần khó (race condition, hàng đợi) mà mục tiêu học là hiểu nó; (2) production thật đôi khi cần tuỳ biến sâu hơn thư viện generic hỗ trợ (ví dụ logic redirect khác nhau theo role) — hiểu cơ chế nền tảng giúp tự tin sửa khi cần, thay vì đoán mò cách một thư viện hoạt động bên trong.

---

## Bức tranh ghép lại

**OTP** dùng lại đúng pattern TTL của Redis đã học ở refresh token, thêm giới hạn số lần thử để chống brute-force không gian nhỏ (6 chữ số) → **gửi email** qua `EmailService` trừu tượng hoá provider (Resend cho cả dev lẫn prod), sinh mã bằng `crypto.randomInt` thay vì `Math.random()` vì OTP là dữ liệu nhạy cảm cần nguồn ngẫu nhiên cấp mật mã → **axios interceptor** tách việc gắn token và xử lý hết hạn ra khỏi code gọi API, nhưng cái khó thật sự nằm ở **đồng bộ hoá nhiều request 401 cùng lúc** quanh một lần refresh có rotation — giải bằng cờ single-flight (`isRefreshing`) + hàng đợi callback.

Thực hành: [Lab 5 (OTP)](./tuan-02-03-thuc-hanh.md#lab-5-otp-email-xác-thực) và [Lab 6 (interceptor)](./tuan-02-03-thuc-hanh.md#lab-6-fe--form--axios-interceptor) trong `tuan-02-03-thuc-hanh.md`.
