# Tuần 1 — Ghi chú lý thuyết: 5 khái niệm Docker

> Ghi chú đồng hành với **Buổi 1** trong [tuan-01.md](./tuan-01.md). Đọc song song với [docs.docker.com/get-started](https://docs.docker.com/get-started/); mọi ví dụ lấy từ chính [docker-compose.yml](../../docker-compose.yml) và [apps/api/Dockerfile](../../apps/api/Dockerfile) của Aperto.

---

## 1. Image vs Container

**Image** là một "bản đóng gói bất biến" chứa mọi thứ cần để chạy một phần mềm: hệ điều hành thu gọn, runtime, thư viện, code, và cấu hình mặc định. Nó **read-only** — giống như file cài đặt hoặc một chiếc đĩa gốc, bạn không "chạy" image trực tiếp và không sửa được nó.

**Container** là một **tiến trình đang chạy** được khởi tạo từ image. Khi chạy `docker compose up`, Docker lấy image `mongo:7` làm nền, đắp thêm một lớp ghi (writable layer) mỏng lên trên, rồi khởi động tiến trình `mongod` bên trong. Mọi thay đổi lúc runtime (file tạm, log…) chỉ nằm ở lớp ghi này.

Quan hệ giữa chúng giống **class và instance** trong lập trình: một image tạo được nhiều container độc lập. Hệ quả:

- Xoá container → image còn nguyên (chỉ mất lớp ghi của container đó). Vì thế `docker compose down` rồi `up` lại rất nhanh — không tải lại image.
- Hai container từ cùng image không thấy dữ liệu của nhau.
- `mongo:7` — phần sau dấu `:` là **tag** (phiên bản). Ghim tag cụ thể để mọi máy chạy đúng cùng một phiên bản, thay vì `mongo:latest` mỗi lúc một khác.

Lệnh để "sờ" thấy sự khác biệt: `docker images` (kho image đã tải) vs `docker ps -a` (các container, kể cả đã dừng).

## 2. Volume

Lớp ghi của container **chết theo container**. Nếu MongoDB ghi dữ liệu vào lớp ghi đó, `docker compose down` (xoá container) là mất sạch database — điểm nguy hiểm nhất với người mới.

**Volume** giải quyết việc này: một vùng lưu trữ do Docker quản lý, **nằm ngoài vòng đời container**. Trong compose của Aperto:

```yaml
mongo:
  volumes:
    - mongo_data:/data/db   # volume "mongo_data" gắn vào thư mục /data/db trong container
```

`/data/db` là nơi mongod ghi dữ liệu. Nhờ dòng này, mọi thứ Mongo ghi vào đó thực chất được ghi ra volume `mongo_data` bên ngoài. Container bị xoá → tạo container mới → gắn lại volume → dữ liệu vẫn đó. Giống **ổ cứng rời cắm vào máy**: vứt máy đi, cắm ổ vào máy mới, dữ liệu còn nguyên.

Ba mức "sống" cần phân biệt:

| Lệnh | Container | Volume (dữ liệu) |
|---|---|---|
| `docker compose stop` | dừng, còn đó | còn |
| `docker compose down` | **xoá** | **còn** |
| `docker compose down -v` | xoá | **mất vĩnh viễn** |

Đây chính là thí nghiệm ở Bước 1.3 trong [lab](./tuan-01-thuc-hanh.md).

Lưu ý: volume (named volume, như `mongo_data`) khác **bind mount** (map một thư mục cụ thể của host, ví dụ `./src:/app/src` — hay dùng để mount code khi dev). Dữ liệu DB dùng named volume vì host không cần đọc file trực tiếp và tránh vấn đề permission giữa các hệ điều hành.

## 3. Network

Mỗi container giống một **máy tính riêng** có network stack riêng. Hai hệ quả mà người mới hay vấp:

**Thứ nhất — container gọi nhau bằng tên service.** Docker Compose tự tạo một mạng ảo cho các service trong file, kèm DNS nội bộ: tên service phân giải thành IP của container đó. Vì thế trong compose, API container nhận:

```yaml
MONGODB_URI: mongodb://mongo:27017/aperto   # "mongo" = tên service, DNS nội bộ tự phân giải
```

Còn khi API chạy trên **host** (chế độ `npm run dev:api`), `.env` lại dùng `mongodb://localhost:27017/aperto`. Cùng một app, hai địa chỉ khác nhau tuỳ nó đứng ở đâu. Quy tắc cần nhớ: **`localhost` bên trong container là chính container đó** — không phải máy bạn, không phải container khác. Lỗi kinh điển số 1: API trong container mà trỏ `localhost:27017` thì không bao giờ thấy Mongo.

**Thứ hai — muốn host truy cập vào container phải mở cổng.** Dòng `ports: - "27017:27017"` nghĩa là "map cổng 27017 của host → cổng 27017 của container". Nhờ nó, API chạy trên host (và Compass, mongosh trên máy bạn) mới kết nối được vào Mongo trong container. Không có dòng này, Mongo vẫn chạy nhưng chỉ các container cùng mạng thấy được. Cú pháp là `host:container` — nếu máy đã có Mongo chiếm 27017, đổi thành `"27018:27017"` và trỏ URI tới 27018.

## 4. Dockerfile

Dockerfile là **công thức từng bước để build một image** — mỗi lệnh tạo một **layer** (lớp) chồng lên nhau, và Docker cache từng layer. Đọc [apps/api/Dockerfile](../../apps/api/Dockerfile):

```dockerfile
FROM node:22-alpine AS builder        # nền: image Node 22 tối giản, đặt tên stage là "builder"
WORKDIR /repo                         # mọi lệnh sau chạy trong /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace apps/api ...   # cài dependencies (kể cả devDeps để build)
COPY apps/api apps/api                # giờ mới copy source code
RUN npm run build --workspace apps/api  # compile TS → dist

FROM node:22-alpine                   # stage 2: image chạy thật, sạch sẽ
...
RUN npm ci ... --omit=dev             # chỉ cài prod dependencies
COPY --from=builder /repo/apps/api/dist apps/api/dist   # chỉ lấy dist từ stage 1
CMD ["node", "apps/api/dist/main.js"] # tiến trình khởi động khi container chạy
```

Hai kỹ thuật đáng học trong file này:

- **Layer caching**: copy `package.json` và chạy `npm ci` *trước*, copy source code *sau*. Layer chỉ build lại khi input của nó đổi — sửa code hằng ngày không làm `npm ci` (bước chậm nhất) chạy lại, build từ vài phút xuống vài giây. Nếu COPY tất cả một lần thì mọi thay đổi code đều phá cache của `npm ci`.
- **Multi-stage build** (2 lệnh `FROM`): stage 1 cần TypeScript compiler và devDependencies để build; stage 2 chỉ lấy kết quả `dist` + prod deps. Image cuối không chứa source TS, không chứa compiler → nhỏ hơn nhiều và ít bề mặt tấn công hơn. Một câu: *"build cần nhiều thứ hơn run, nên tách môi trường build khỏi image chạy thật."*

Phân biệt với compose: Mongo và Redis dùng image **có sẵn** trên Docker Hub (không cần Dockerfile); chỉ code của bạn (API) mới cần Dockerfile để đóng gói thành image riêng.

## 5. docker-compose

Không có compose, để dựng hạ tầng Aperto bạn phải gõ tay: `docker network create…`, `docker volume create…`, rồi 2-3 lệnh `docker run` dài dằng dặc với đủ flag `-p`, `-v`, `-e` — và phải nhớ đúng thứ tự. **Compose là file khai báo (declarative)** gom tất cả vào một chỗ: bạn mô tả *trạng thái mong muốn* (những service nào, image gì, cổng nào, volume nào), Docker lo phần *làm thế nào*. Một lệnh `docker compose up` dựng cả cụm; file nằm trong git nên mọi máy dựng ra hạ tầng giống hệt nhau — đây chính là lý do mục ✅ "máy sạch" của Tuần 1 khả thi.

Ngoài danh sách service, compose của Aperto còn dùng 3 tính năng điều phối đáng chú ý:

- **`healthcheck`**: định nghĩa "thế nào là sẵn sàng" — Mongo phải trả lời `ping`, Redis phải trả `PONG`. Container "đang chạy" chưa chắc "sẵn sàng phục vụ" (mongod mất vài giây khởi động sau khi container start).
- **`depends_on` + `condition: service_healthy`**: service `api` chỉ được start **sau khi** Mongo và Redis pass healthcheck. `depends_on` thường chỉ đảm bảo thứ tự start container, không đợi tiến trình bên trong sẵn sàng — thiếu condition này API có thể boot lên, connect Mongo fail, rồi crash.
- **`profiles: ["full"]`**: service `api` gắn profile nên `docker compose up` mặc định **không** chạy nó — chỉ chạy khi `docker compose --profile full up`. Tách được 2 chế độ: dev hằng ngày (chỉ Mongo+Redis trong Docker, API chạy trên host bằng watch mode cho nhanh) vs kiểm tra "chạy như production" (tất cả trong container).

---

## Bức tranh ghép lại

**Dockerfile** là công thức → build ra **image** (bản đóng gói bất biến) → chạy thành **container** (tiến trình) → dữ liệu cần sống lâu gửi vào **volume** → các container nói chuyện với nhau qua **network** bằng tên service → và **compose** là nhạc trưởng khai báo toàn bộ dàn nhạc đó trong một file.

Nắm xong lý thuyết thì quay lại làm Bước 1.3 (thí nghiệm volume) và Bước 3.2 (chạy `--profile full`) trong [lab Tuần 1](./tuan-01-thuc-hanh.md) — hai bước đó biến đúng 5 khái niệm này thành trải nghiệm tay.
