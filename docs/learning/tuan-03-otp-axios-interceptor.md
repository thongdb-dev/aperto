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

### 2. Gửi email dev vs production

Dev/test dùng **Mailtrap** (hoặc tương tự): email không thực sự gửi ra ngoài, bị "bẫy" lại trong một hộp thư giả để bạn xem nội dung khi test — tránh gửi nhầm email thật trong lúc phát triển. Production dùng dịch vụ thật (Resend, SES...) với domain đã xác thực (SPF/DKIM) để email không rơi vào spam. Code gọi service gửi email nên được trừu tượng qua một interface chung (`EmailService.send(...)`), để đổi provider dev→prod chỉ đổi implementation, không đổi chỗ gọi.

### 3. Chặn hành động khi chưa xác thực

Quyết định "chặn login hoàn toàn" hay "cho login nhưng giới hạn thao tác" khi `status = pending_verification` là một trade-off UX vs bảo mật — không có đáp án tuyệt đối. Gợi ý cân nhắc: chặn hoàn toàn đơn giản để implement và test, nhưng người dùng thật đôi khi lỡ email verification và muốn thử lại tính năng trước; cho phép login giới hạn (ví dụ chỉ xem, không booking/thanh toán) thân thiện hơn nhưng thêm một tầng kiểm tra ở mọi endpoint nhạy cảm. Ghi rõ lựa chọn + lý do vào Nhật ký — đây là loại quyết định sản phẩm nhỏ mà dự án thật luôn phải đưa ra.

---

## Phần B — Axios interceptor: tự động refresh khi 401

### 4. Interceptor là gì

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

### 5. Response interceptor bắt 401 → refresh → retry

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

### 6. Vì sao không dùng thư viện có sẵn (`axios-auth-refresh` chẳng hạn)

Bài tập yêu cầu tự viết tay vì: (1) thư viện giấu đi đúng phần khó (race condition, hàng đợi) mà mục tiêu học là hiểu nó; (2) production thật đôi khi cần tuỳ biến sâu hơn thư viện generic hỗ trợ (ví dụ logic redirect khác nhau theo role) — hiểu cơ chế nền tảng giúp tự tin sửa khi cần, thay vì đoán mò cách một thư viện hoạt động bên trong.

---

## Bức tranh ghép lại

**OTP** dùng lại đúng pattern TTL của Redis đã học ở refresh token, thêm giới hạn số lần thử để chống brute-force không gian nhỏ (6 chữ số) → **axios interceptor** tách việc gắn token và xử lý hết hạn ra khỏi code gọi API, nhưng cái khó thật sự nằm ở **đồng bộ hoá nhiều request 401 cùng lúc** quanh một lần refresh có rotation — giải bằng cờ single-flight (`isRefreshing`) + hàng đợi callback.

Thực hành: [Lab 5 (OTP)](./tuan-02-03-thuc-hanh.md#lab-5-otp-email-xác-thực) và [Lab 6 (interceptor)](./tuan-02-03-thuc-hanh.md#lab-6-fe--form--axios-interceptor) trong `tuan-02-03-thuc-hanh.md`.
