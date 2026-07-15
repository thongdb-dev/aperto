# Setup shadcn/ui + Tailwind + theme màu cho `apps/web`

> Hướng dẫn đồng hành với [Lab 6, Bước 6.1](./tuan-02-03-thuc-hanh.md#bước-61--setup-shadcnui--tailwind--theme-màu) trong `tuan-02-03-thuc-hanh.md`. Thay MUI (đang cài sẵn trong `apps/web`) bằng **shadcn/ui** (Radix UI + Tailwind) — xem lý do lựa chọn ở phần trò chuyện trước, tóm tắt: full quyền kiểm soát style vì component copy thẳng vào repo, không CSS-in-JS runtime, hỗ trợ light/dark mode qua CSS variables thay vì theme object JS.

Bảng màu chủ đạo cho Aperto:

| Token | Hex | Vai trò |
|---|---|---|
| `#FFC700` | Vàng | Màu nhấn (`primary`) — nút CTA, link active, badge |
| `#0A0A0B` | Đen gần tuyệt đối | Nền tối (`background` ở dark mode) / chữ chính (`foreground` ở light mode) |
| `#FFFFFF` | Trắng | Nền sáng (`background` ở light mode) / chữ chính (`foreground` ở dark mode) |

**Quyết định: không dùng SCSS, chỉ CSS thuần.** Tailwind v4 khuyến cáo không kết hợp với Sass/Less/Stylus — engine của v4 (Lightning CSS) tự xử lý nesting, `@import`, custom properties nên hầu hết lý do dùng Sass trước đây không còn cần thiết; ngược lại nếu để `sass` compile file chứa `@import "tailwindcss"` / `@theme` (cú pháp riêng của Tailwind, không phải Sass) thì build lỗi. Toàn bộ setup dưới đây dùng `.css` thuần.

---

## Bước 1 — Gỡ MUI, cài Tailwind CSS v4

```bash
cd apps/web
npm uninstall @mui/material @emotion/react
npm install tailwindcss @tailwindcss/postcss postcss
```

Tailwind v4 không còn dùng `tailwind.config.js` dạng JS như v3 — cấu hình (màu, font, spacing...) khai báo thẳng trong CSS qua khối `@theme`. Điều này quan trọng vì các bước sau sẽ sửa CSS variables trực tiếp trong `globals.css`, không phải trong file config riêng.

## Bước 2 — Khởi tạo shadcn/ui

```bash
npx shadcn@latest init
```

CLI sẽ hỏi vài câu — chọn:

- **Style**: `New York` (hoặc `Default`, không ảnh hưởng theme màu ở bước sau).
- **Base color**: `Neutral` — chọn nền trung tính vì màu thật sẽ tự ghi đè ở Bước 3, chọn base color nào cũng không quan trọng.
- **CSS variables for theming**: `Yes` — **bắt buộc chọn Yes**, đây chính là cơ chế cho phép đổi light/dark chỉ bằng toggle 1 class, đúng như đã giải thích ở phần lý thuyết trước.

Sau khi chạy xong, CLI tạo/sửa các file:

- `components.json` — cấu hình CLI (đường dẫn alias, style đã chọn).
- `app/globals.css` — thêm `@import "tailwindcss";`, khối `@theme inline { ... }` map CSS variable sang Tailwind utility (`bg-background`, `text-foreground`...), và 2 khối `:root { --background: ...; }` / `.dark { --background: ...; }` chứa giá trị mặc định.
- `lib/utils.ts` — hàm `cn()` (gộp class Tailwind có điều kiện, dùng `clsx` + `tailwind-merge`).
- `postcss.config.mjs` — đăng ký plugin `@tailwindcss/postcss`.

## Bước 3 — Thay giá trị CSS variables bằng bảng màu Aperto

Mở `app/globals.css`, tìm 2 khối `:root` và `.dark` mà CLI vừa tạo, **thay giá trị** (giữ nguyên tên biến, chỉ đổi hex) như sau:

```css
:root {
  --radius: 0.625rem;

  --background: #ffffff;
  --foreground: #0a0a0b;

  --card: #ffffff;
  --card-foreground: #0a0a0b;
  --popover: #ffffff;
  --popover-foreground: #0a0a0b;

  --primary: #ffc700;
  --primary-foreground: #0a0a0b;   /* chữ trên nền vàng dùng đen — trắng trên vàng khó đọc, kiểm tra contrast */

  --secondary: #f4f4f5;
  --secondary-foreground: #0a0a0b;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --accent: #f4f4f5;
  --accent-foreground: #0a0a0b;

  --destructive: #e7000b;
  --border: #e4e4e7;
  --input: #e4e4e7;
  --ring: #ffc700;
}

.dark {
  --background: #0a0a0b;
  --foreground: #ffffff;

  --card: #0a0a0b;
  --card-foreground: #ffffff;
  --popover: #0a0a0b;
  --popover-foreground: #ffffff;

  --primary: #ffc700;
  --primary-foreground: #0a0a0b;

  --secondary: #18181b;
  --secondary-foreground: #ffffff;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;
  --accent: #18181b;
  --accent-foreground: #ffffff;

  --destructive: #ff6467;
  --border: #ffffff1a;   /* trắng 10% alpha — viền mảnh trên nền tối, không dùng xám cứng */
  --input: #ffffff1a;
  --ring: #ffc700;
}
```

Vài điểm đáng chú ý:

- **`--primary` giữ nguyên `#FFC700` ở cả 2 mode** — đây là màu thương hiệu, không đổi theo theme (khác `background`/`foreground` phải đảo ngược giữa 2 mode).
- **`--primary-foreground: #0a0a0b`** — chữ/icon đặt trên nền vàng dùng đen, vì trắng-trên-vàng có độ tương phản kém (khó đọc, fail tiêu chuẩn accessibility WCAG AA). Test lại bằng mắt sau khi dựng nút CTA thật.
- `--secondary`, `--muted`, `--accent`, `--border` không nằm trong 3 màu bạn cho — đây là các "màu phụ" bắt buộc phải có để component (card, input, dropdown...) phân biệt được layer với nền, mình chọn xám trung tính phái sinh từ đen/trắng (`#18181b` gần đen, `#f4f4f5` gần trắng) cho hài hoà, không lệch tông.
- `--destructive` (màu lỗi/xoá) không nằm trong bảng màu gốc — giữ đỏ mặc định của shadcn vì cần khác biệt rõ với vàng `primary` (vàng dễ nhầm với "warning", đỏ mới đúng nghĩa "destructive").

## Bước 4 — Cài `next-themes` để quản lý theme state

```bash
npm install next-themes
```

Tạo `components/theme-provider.tsx`:

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

Bọc trong `app/layout.tsx`:

```tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Hai chi tiết bắt buộc, dễ bỏ sót:

- **`suppressHydrationWarning` trên `<html>`**: `next-themes` set class `dark`/`light` bằng script chạy **trước khi React hydrate**, để tránh "nháy" sai theme 1 khung hình đầu (FOUC). Nhưng vì vậy, class trên `<html>` lúc server render (không biết theme) khác lúc client render (đã biết) → React cảnh báo hydration mismatch nếu không có `suppressHydrationWarning`. Đây là cảnh báo giả, an toàn để tắt đúng chỗ này.
- **`attribute="class"`**: khớp với cách shadcn/ui định nghĩa `.dark { ... }` trong `globals.css` ở Bước 3 (chọn theo class, không phải `data-theme` attribute).

## Bước 5 — Nút chuyển theme

```bash
npx shadcn@latest add button dropdown-menu
```

```tsx
// components/theme-toggle.tsx
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          🌓
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Sáng</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Tối</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>Theo hệ thống</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Kiểm chứng

```bash
npm run dev:web
```

- Mở `http://localhost:3000`, thấy nền/màu chữ đúng theo hệ thống (light/dark tuỳ OS, vì `defaultTheme="system"`).
- Bấm nút toggle → chọn "Tối"/"Sáng" → nền chuyển giữa `#FFFFFF` và `#0A0A0B` ngay lập tức, không reload trang.
- Dựng thử 1 nút `<Button>Đặt lịch</Button>` mặc định (`variant="default"`) → phải có nền vàng `#FFC700`, chữ đen — đây là màu `primary` vừa cấu hình ở Bước 3.
- Reload trang ở dark mode → không thấy nháy trắng 1 khung hình trước khi chuyển tối (nếu có nháy, kiểm tra lại `suppressHydrationWarning` và việc `next-themes` script có chạy trước hydrate không).
