# Tuần 3 — Ghi chú lý thuyết: NestJS Testing Module & Mocking

> Ghi chú đồng hành với **Buổi 8** trong [tuan-02-03.md](./tuan-02-03.md). Đọc song song với [docs.nestjs.com/fundamentals/testing](https://docs.nestjs.com/fundamentals/testing). Phần thực hành: [tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md).

---

## 1. Vì sao không test bằng cách gọi thật qua HTTP

Có 2 tầng test khác nhau, phục vụ mục đích khác nhau:

- **Unit test**: test một class (thường là service) **cô lập** khỏi mọi phụ thuộc thật (DB, Redis, HTTP) — nhanh (mili-giây), chạy được hàng nghìn lần/phút, không cần Docker đang chạy. Test *logic*, không test *tích hợp*.
- **E2E test** (dùng `supertest`, đã có sẵn trong `apps/api/test/`): gọi thật qua HTTP vào app đã bootstrap, chạm DB thật (thường DB test riêng) — chậm hơn, nhưng xác nhận các phần ráp lại đúng.

Buổi 8 chỉ yêu cầu unit test cho `AuthService` — nhanh, chạy trong CI mỗi lần push mà không cần Mongo/Redis thật.

## 2. `Test.createTestingModule` — dựng một "app giả" chỉ để test

NestJS cung cấp một module builder riêng cho test, dùng lại đúng cơ chế DI đã học ở Tuần 1 — nhưng bạn kiểm soát được **provider nào là thật, provider nào là giả**:

```ts
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let userModel: { create: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    userModel = { create: jest.fn(), findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },  // (1) mock model Mongoose
        { provide: JwtService, useValue: { sign: jest.fn(() => 'fake-token') } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('register: email trùng thì throw ConflictException', async () => {
    userModel.create.mockRejectedValue({ code: 11000 });
    await expect(service.register({ email: 'a@a.com', password: '12345678' }))
      .rejects.toThrow(ConflictException);
  });
});
```

`getModelToken(User.name)` chính là token thật mà `@InjectModel(User.name)` dùng phía sau — bạn phải cung cấp **đúng token đó** với `useValue` để Nest "đánh lừa" `AuthService` rằng nó nhận được model Mongoose thật, trong khi thực chất là object `jest.fn()` giả. Đây là ứng dụng trực tiếp của lý thuyết DI Tuần 1: *"khi test, cung cấp mock qua cùng token, class cần test không đổi một dòng."*

## 3. `useValue` — pattern mock chuẩn của Nest

Ba cách cung cấp provider trong Nest (`useClass`, `useValue`, `useFactory`) đã gặp thoáng qua khi học `RedisModule` (Tuần 1). Trong test, `useValue` là lựa chọn gần như luôn dùng: thay vì để Nest tự tạo instance thật (`useClass` ngầm định), bạn đưa thẳng một object giả đã chuẩn bị sẵn — có thể là `jest.fn()` (theo dõi được lời gọi, cấu hình được giá trị trả về) hoặc object tĩnh đơn giản.

Điểm cần nhớ: **mock đúng ranh giới của unit** — mock những gì *bên ngoài* `AuthService` (DB, JWT signing, gửi email), giữ nguyên logic *bên trong* `AuthService` (so sánh mật khẩu, quyết định throw lỗi gì). Mock quá nhiều (kể cả logic cần test) khiến test không còn ý nghĩa; mock quá ít khiến unit test biến thành integration test chậm và giòn.

## 4. Cấu trúc Arrange — Act — Assert

Một test tốt tách rõ 3 phần, kể cả khi không ghi comment:

```ts
it('login: sai mật khẩu trả 401', async () => {
  // Arrange — chuẩn bị input và trạng thái mock
  userModel.findOne.mockResolvedValue({ password_hash: await bcrypt.hash('correct', 10) });

  // Act — gọi hàm đang test
  const action = () => service.login('a@a.com', 'wrong-password');

  // Assert — khẳng định kết quả
  await expect(action()).rejects.toThrow(UnauthorizedException);
});
```

Với `calculateRefund`, `calculateDeposit` sau này (M4), cấu trúc này còn quan trọng hơn vì mỗi nhánh policy là 1 test case riêng — dễ đọc, dễ thấy thiếu case nào khi nhìn lướt qua danh sách `it(...)`.

## 5. Test cả nhánh thành công và nhánh lỗi — tư duy chuẩn bị cho M4

Buổi 8 chỉ yêu cầu 2 test (`register`, `login`) nhưng nên tập tư duy liệt kê **mọi nhánh rẽ** của một hàm trước khi viết code test, không chỉ nhánh "happy path":

- `register`: email trùng (throw) / thành công (password không lưu plaintext — assert `password_hash !== plainPassword`, và có gọi `bcrypt.hash`).
- `login`: sai mật khẩu (401) / đúng mật khẩu (trả về đúng 2 token) / (nếu đã làm OTP) tài khoản `pending_verification` (chặn hay không tuỳ quyết định Buổi 5).

Đây chính là khởi động cho **Tuần 8–9 (M4)**, nơi bài luyện test quan trọng nhất project yêu cầu **coverage 100%** cho hàm tính refund — kỹ năng liệt kê đủ nhánh trước khi code (gần với TDD) học sớm ở đây sẽ trả lợi tức về sau.

---

## Bức tranh ghép lại

**Unit test** cô lập service khỏi phụ thuộc thật để chạy nhanh trong CI, khác **E2E test** (supertest) chạm hệ thống thật → `Test.createTestingModule` dựng lại đúng cơ chế DI của Nest nhưng cho phép thay provider thật bằng `useValue` giả, dùng đúng token (`getModelToken`) để "đánh lừa" class đang test mà không sửa code nó → cấu trúc Arrange-Act-Assert giữ test dễ đọc → liệt kê đủ nhánh rẽ trước khi viết test là kỹ năng sẽ dùng lại nguyên vẹn ở M4.

Thực hành: [Lab 8 trong tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md#lab-8-unit-test--kiểm-chứng-cuối-module).
