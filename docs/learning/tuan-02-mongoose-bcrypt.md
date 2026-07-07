# Tuần 2 — Ghi chú lý thuyết: Mongoose Schema/Model & bcrypt

> Ghi chú đồng hành với **Buổi 1** trong [tuan-02-03.md](./tuan-02-03.md) — cùng định dạng với các ghi chú lý thuyết Tuần 1 ([Docker](./tuan-01-docker.md), [NestJS/DI](./tuan-01-nestjs-di.md)). Đọc song song với [mongoosejs.com/docs](https://mongoosejs.com/docs/guide.html) và [docs.nestjs.com/techniques/mongodb](https://docs.nestjs.com/techniques/mongodb).
>
> Khác Tuần 1: chưa có code sẵn để đối chiếu, nên các ví dụ dưới đây là **code tham khảo bạn sẽ viết** — dùng làm khung, không copy máy móc. Phần thực hành với lệnh cụ thể: [tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md).

---

## 1. Schema là blueprint, Model là công cụ thao tác

**Schema** mô tả *hình dạng* một document: field nào, kiểu gì, ràng buộc gì (required, unique, default). Nó không tự thao tác với DB — chỉ là mô tả.

**Model** là "class" được compile từ schema, cung cấp các method thao tác thật với collection (`find`, `create`, `updateOne`...). Một schema có thể tạo ra model, nhưng model mới là thứ bạn `inject` vào service để dùng.

Trong NestJS, cách viết phổ biến là dùng decorator thay vì gọi `new Schema()` tay:

```ts
// users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })          // tự thêm createdAt/updatedAt
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ unique: true, sparse: true }) // sparse: cho phép nhiều document không có phone
  phone?: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ type: [String], enum: ['customer', 'photographer', 'admin'], default: ['customer'] })
  roles: string[];

  @Prop({ enum: ['active', 'suspended', 'pending_verification'], default: 'pending_verification' })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

`SchemaFactory.createForClass(User)` đọc metadata từ các decorator `@Prop()` (cùng cơ chế reflect-metadata đã học ở Tuần 1 cho DI) và sinh ra một `Schema` thật của Mongoose. Đăng ký vào module:

```ts
// users/users.module.ts
@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  ...
})
```

`forFeature` khác `forRootAsync` (đã dùng ở `app.module.ts` Tuần 1): `forRootAsync` mở **connection**, `forFeature` đăng ký **model** dùng connection đó trong phạm vi module hiện tại. Inject model vào service:

```ts
constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
```

Đây chính là một biến thể khác của *custom provider token* đã học ở Tuần 2 lý thuyết DI — `InjectModel` tạo ra token dựa trên tên class, tương tự cách `RedisModule` dùng `Symbol('REDIS_CLIENT')`.

## 2. Unique index — chặn ở DB, không chỉ ở code

`@Prop({ unique: true })` tạo một **index unique** ở tầng MongoDB — không phải chỉ validate trong code. Khác biệt này quan trọng:

- **DTO validate** (`class-validator` — Tuần 1 đã dùng qua `ValidationPipe`) chỉ kiểm tra *hình dạng* input (đúng định dạng email, đủ độ dài) — nó không biết database đã có ai dùng email đó chưa.
- **Unique index** đảm bảo *tính đúng đắn dữ liệu* ngay tại storage layer — kể cả khi 2 request đăng ký cùng email gửi lên **đồng thời** (race condition), MongoDB sẽ để 1 write thành công, write kia ném lỗi `E11000 duplicate key`.

Nếu chỉ code kiểm tra "tìm user theo email trước, không thấy thì tạo" mà không có unique index, hai request race nhau đều có thể "không thấy" ở bước tìm rồi cùng tạo thành công → dữ liệu trùng. Đây là lý do câu tự vấn Buổi 1 hỏi đúng điểm này: **cần cả hai lớp** — DTO validate cho trải nghiệm người dùng tốt (báo lỗi ngay, không cần đợi DB), unique index cho tính đúng đắn dưới tải đồng thời.

Khi gặp `E11000` trong code, bắt lỗi và trả về **409 Conflict** (tài nguyên xung đột) thay vì để lộ MongoDB error thô ra ngoài:

```ts
try {
  return await this.userModel.create({ email, password_hash, ... });
} catch (err) {
  if (err.code === 11000) throw new ConflictException('Email đã được sử dụng');
  throw err;
}
```

## 3. bcrypt: salt và cost factor

**Vấn đề cần giải:** không bao giờ lưu mật khẩu dạng plaintext — nếu DB bị lộ, toàn bộ mật khẩu người dùng bị lộ theo.

**Hash một chiều** (như bcrypt) giải quyết việc "lưu mà không cần đọc lại nguyên văn": lưu `hash(password)`, khi login thì `hash(input) == stored_hash` là đúng — không bao giờ giải mã ngược lại được mật khẩu gốc.

Nhưng hash một chiều không tự động an toàn. Hai kỹ thuật bcrypt thêm vào:

- **Salt**: một chuỗi ngẫu nhiên được sinh ra *cho mỗi người dùng* và trộn vào trước khi hash. Không có salt, hai người dùng cùng mật khẩu "123456" sẽ ra **cùng một hash** — kẻ tấn công tra bảng "rainbow table" (bảng tra sẵn hash phổ biến) là biết ngay mật khẩu gốc. Có salt, mỗi user một salt khác nhau → cùng mật khẩu vẫn ra hash khác nhau, rainbow table vô dụng. bcrypt tự sinh và **nhúng salt ngay trong chuỗi hash trả về** (ví dụ `$2b$10$N9qo8uLOickgx2ZMRZoMy...` — phần `$2b$10$N9qo8uLOickgx2ZM` chứa version + cost + salt), nên bạn không cần lưu salt riêng.
- **Cost factor** (số ở giữa chuỗi, ví dụ `10`): quyết định bcrypt lặp lại phép băm **2^cost lần**. Tăng cost thêm 1 là **gấp đôi** thời gian tính. Đây là chủ đích — bcrypt được thiết kế **cố tình chậm** để kẻ tấn công brute-force offline (thử hàng tỷ mật khẩu/giây bằng GPU) phải trả giá đắt cho từng lần thử. Với cost 10–12: hash mất ~50-250ms trên máy hiện đại — không cảm nhận được với người dùng thật (chỉ login vài lần/ngày), nhưng làm chậm brute-force xuống còn vài trăm lần thử/giây thay vì hàng tỷ.

```ts
import * as bcrypt from 'bcrypt';

const password_hash = await bcrypt.hash(plainPassword, 10);   // cost factor 10
const isMatch = await bcrypt.compare(inputPassword, password_hash);
```

## 4. Tại sao SHA256 không đủ cho mật khẩu

SHA256 (và họ MD5, SHA1) là **hash mục đích chung**, được thiết kế để **nhanh** — dùng cho checksum file, chữ ký số, nơi tốc độ là ưu điểm. Chính vì nhanh, nó là lựa chọn tệ cho mật khẩu:

- Một GPU tầm trung tính được **hàng tỷ** lượt SHA256/giây. Với danh sách 10 triệu mật khẩu phổ biến, brute-force toàn bộ mất chưa đến 1 giây.
- SHA256 tự thân **không có salt** — phải tự thêm tay, và dễ implement sai (ví dụ salt cố định, hoặc salt quá ngắn).
- Không có "cost factor" điều chỉnh được — không thể làm SHA256 chậm lại theo ý muốn khi phần cứng tấn công ngày càng mạnh lên.

bcrypt (và các họ tương tự như Argon2, scrypt) được thiết kế **riêng cho mật khẩu**: chậm có chủ đích, salt tự động, cost factor điều chỉnh được theo thời gian (khi máy tính mạnh lên, tăng cost lên). Quy tắc chung: **hash mục đích chung cho tính toàn vẹn dữ liệu (checksum, chữ ký) — hash chuyên dụng chậm cho mật khẩu.**

---

## Bức tranh ghép lại

**Schema** mô tả hình dạng `users` → **Model** (qua `@InjectModel`) là công cụ để service thao tác thật với collection đó → **unique index** trên email/phone bảo vệ tính đúng đắn dữ liệu ở tầng DB, bổ sung cho validate ở tầng DTO → mật khẩu không bao giờ lưu plaintext, mà lưu qua **bcrypt** — salt chống rainbow table, cost factor cố tình làm chậm brute-force.

Học xong lý thuyết, sang [Lab 1 trong tuan-02-03-thuc-hanh.md](./tuan-02-03-thuc-hanh.md#lab-1-schema-users--đăng-ký) để viết schema + endpoint register thật và test bằng curl.
