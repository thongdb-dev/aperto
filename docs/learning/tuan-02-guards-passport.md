# Tuần 2 — Ghi chú lý thuyết: Guard, Custom Decorator & Passport Strategy

> Ghi chú đồng hành với **Buổi 3** trong [tuan-02-03.md](./tuan-02-03.md). Đọc song song với [docs.nestjs.com/guards](https://docs.nestjs.com/guards), [docs.nestjs.com/custom-decorators](https://docs.nestjs.com/custom-decorators), [docs.nestjs.com/recipes/passport](https://docs.nestjs.com/recipes/passport). Phần thực hành: [tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md).

---

## 1. Guard — người gác cổng trả lời "có/không", không phải "làm gì"

**Guard** là một class implement interface `CanActivate`, trả về `true`/`false` (hoặc throw exception) để quyết định request có được đi tiếp vào handler hay không. Điểm khác biệt cần nhớ so với Middleware hay Interceptor: Guard **chỉ quyết định**, không biến đổi request/response.

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}   // kế thừa AuthGuard của @nestjs/passport
```

Gắn vào route hoặc controller:

```ts
@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@CurrentUser() user: UserDocument) { ... }
```

Nest gọi `canActivate(context: ExecutionContext)` của guard **trước khi** handler chạy. Nếu guard throw (thường là `UnauthorizedException`/`ForbiddenException`) hoặc trả `false`, request dừng lại ngay — handler không bao giờ được gọi tới.

## 2. Thứ tự trong request pipeline

Đây là câu tự vấn của Buổi 3 — thứ tự chính xác:

```
Request → Middleware → Guard → Interceptor (trước) → Pipe → Handler → Interceptor (sau) → Response
```

Ý nghĩa thực hành: **Guard chạy trước Pipe**. Vì thế `JwtAuthGuard` xác thực token *trước khi* `ValidationPipe` kiểm tra body — một request không có token hợp lệ bị chặn ở Guard, không tốn công validate DTO. Tương tự, khi gắn cả `JwtAuthGuard` và `RolesGuard` lên cùng route (`@UseGuards(JwtAuthGuard, RolesGuard)`), chúng chạy **tuần tự theo thứ tự khai báo**: `JwtAuthGuard` chạy trước, gắn `request.user` từ token; `RolesGuard` chạy sau, đọc `request.user.roles` mà `JwtAuthGuard` vừa gắn để so với roles yêu cầu. Đảo ngược thứ tự là bug — `RolesGuard` sẽ không có `request.user` để đọc.

## 3. Passport strategy — nơi thực sự xác thực

**Passport** là thư viện xác thực trung lập-framework; NestJS bọc nó qua `@nestjs/passport`. Một **Strategy** định nghĩa *cách* xác thực (lấy credential từ đâu, kiểm tra thế nào); **Guard** (`AuthGuard('tên-strategy')`) chỉ là lớp NestJS gọi strategy đó tại đúng thời điểm trong request pipeline.

Hai strategy dùng trong M1:

```ts
// local.strategy.ts — dùng cho POST /auth/login (email + password trong body)
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });   // Passport mặc định field "username", đổi thành "email"
  }

  async validate(email: string, password: string): Promise<UserDocument> {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    return user;   // trả về gì ở đây, Nest tự gắn vào request.user
  }
}
```

```ts
// jwt.strategy.ts — dùng cho mọi route cần "đã đăng nhập" (JwtAuthGuard)
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  // đọc từ header Authorization: Bearer <token>
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,                                   // để Passport tự chặn token hết hạn
    });
  }

  async validate(payload: { sub: string; roles: string[] }) {
    return { userId: payload.sub, roles: payload.roles };  // gắn vào request.user
  }
}
```

Điểm chung của cả 2: hàm `validate()` là nơi bạn viết logic thật; **giá trị `validate()` trả về sẽ tự động được Nest gắn vào `request.user`** — đây là lý do `@CurrentUser()` (mục 4) chỉ cần đọc `request.user` mà không cần biết nó tới từ strategy nào.

## 4. Custom decorator — gói code lặp lại thành 1 dòng khai báo

`createParamDecorator` cho phép định nghĩa decorator tham số của riêng bạn, đọc dữ liệu từ `ExecutionContext`:

```ts
// current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;              // chính là giá trị JwtStrategy.validate() đã trả về
  },
);
```

Không có decorator này, mọi controller cần user hiện tại đều phải viết `@Req() req` rồi tự `req.user` — lặp lại và dễ gõ sai. `@CurrentUser()` gói lại thành:

```ts
@Get('me')
getMe(@CurrentUser() user: { userId: string; roles: string[] }) {
  return user;
}
```

## 5. `Reflector` + `SetMetadata` — cách Guard "đọc" decorator gắn trên route

`@Roles('photographer')` tự nó chỉ là **gắn metadata** lên route, không tự kiểm tra gì. Việc kiểm tra là của `RolesGuard` đọc lại metadata đó bằng `Reflector`:

```ts
// roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

```ts
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),   // metadata gắn trên method (ví dụ @Roles() trên 1 endpoint)
      context.getClass(),     // metadata gắn trên cả controller (áp dụng mọi route trong đó)
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;   // route không yêu cầu role cụ thể

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
```

Sử dụng:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('photographer')
@Patch('me/profile')
updateProfile(@CurrentUser() user, @Body() dto: UpdateProfileDto) { ... }
```

Cơ chế `SetMetadata` + `Reflector` chính là cách NestJS cho phép "đính kèm dữ liệu tuỳ ý lên route/class rồi đọc lại lúc runtime" — cùng nguyên lý reflect-metadata đã gặp ở DI (Tuần 1) và ở `@Prop()` của Mongoose (Buổi 1 tuần này). Đây là một pattern lặp lại xuyên suốt NestJS: decorator ghi metadata, một thành phần khác (Guard, Pipe, hoặc chính framework) đọc lại metadata đó để quyết định hành vi.

---

## Bức tranh ghép lại

**Passport Strategy** định nghĩa *cách* xác thực (đọc email/password hay đọc JWT từ header) và gắn kết quả vào `request.user` → **Guard** (`AuthGuard('...')`) là lớp NestJS gọi đúng strategy tại đúng thời điểm trong pipeline (trước Pipe, sau Middleware) → **custom decorator** (`@CurrentUser()`) gói việc đọc `request.user` thành 1 dòng tái dùng được → **`@Roles()` + `RolesGuard` + `Reflector`** dùng lại chính cơ chế metadata của reflect-metadata để việc phân quyền được khai báo ngay tại route, thay vì viết if/else rải rác trong handler.

Học xong lý thuyết, sang [Lab 3 trong tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md#lab-3-guard-decorator-phân-quyền) để viết đủ 5 file trên và test bằng curl (customer gọi endpoint photographer → 403).
