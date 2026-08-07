"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { ApertureMark } from "@/components/aperto/aperture-mark";
import { useAppState, roleHome } from "@/components/aperto/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api/client";
import { getMe, login, register, resendOtp, verifyOtp } from "@/lib/api/auth";
import type { UserRole } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: { value: UserRole; title: string; subtitle: string }[] = [
  {
    value: "customer",
    title: "Khách hàng",
    subtitle: "Tìm & đặt lịch photographer",
  },
  {
    value: "photographer",
    title: "Photographer",
    subtitle: "Nhận booking & quản lý dự án",
  },
];

function resolveRole(roles: string[]): UserRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("photographer")) return "photographer";
  return "customer";
}

const authSchema = yup.object({
  email: yup
    .string()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type AuthFormValues = yup.InferType<typeof authSchema>;

interface PendingVerification {
  userId: string;
  email: string;
}

export function AuthScreen() {
  const { setRole } = useAppState();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "otp">("login");
  const [role, setLocalRole] = useState<UserRole>("customer");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: yupResolver(authSchema),
    defaultValues: { },
  });

  const enterAppForRole = async () => {
    const me = await getMe();
    const realRole = resolveRole(me.roles);
    setRole(realRole);
    router.push(roleHome(realRole));
  };

  const onSubmit = async ({ email, password }: AuthFormValues) => {
    setError(null);
    try {
      if (mode === "signup") {
        await register({ email, password });
      }
      await login({ email, password });
      const me = await getMe();
      // Login không bị chặn khi tài khoản chưa xác thực OTP — chỉ một số chức năng
      // (route có @RequireVerified() ở BE) mới bị chặn cho tới khi xác thực xong.
      if (me.status === "pending_verification") {
        setPending({ userId: me.userId, email });
        setMode("otp");
        return;
      }
      const realRole = resolveRole(me.roles);
      setRole(realRole);
      router.push(roleHome(realRole));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    setOtpSubmitting(true);
    try {
      await verifyOtp({ userId: pending.userId, code: otpCode });
      await enterAppForRole();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setOtpSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    if (!pending) return;
    setError(null);
    setResendMessage(null);
    try {
      await resendOtp(pending.userId);
      setResendMessage("Đã gửi lại mã xác thực, kiểm tra email của bạn.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const onSkipVerification = async () => {
    setError(null);
    try {
      await enterAppForRole();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="grid min-h-svh md:grid-cols-2">
      <div className="hidden flex-col justify-center items-center gap-8 bg-zinc-950 p-16 text-zinc-50 md:flex">
        <div className="flex items-center gap-4 font-heading">
          <ApertureMark
            size={48}
            fill="var(--primary)"
            stroke="#09090b"
            strokeWidth={1.6}
          />
          <div>
            <div className='text-2xl font-bold'>Aperto</div>
            <div className='text-muted-foreground'>Đặt lịch & quản lý photoshoot</div>
          </div>
        </div>
        <div>
          <p className="max-w-md font-heading text-3xl leading-snug">
            &ldquo;Từ đặt lịch đến bàn giao ảnh — mọi thứ ở một nơi, minh bạch
            từng bước.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        {mode === "otp" ? (
          <form onSubmit={onOtpSubmit} className="w-full max-w-sm">
            <h1 className="mb-2 font-heading text-2xl font-semibold">
              Xác thực email
            </h1>
            <p className="mb-6 text-muted-foreground">
              Nhập mã 6 số vừa gửi tới{" "}
              <strong className="text-foreground">{pending?.email}</strong>.
              Bạn vẫn có thể vào ứng dụng ngay, nhưng một số chức năng sẽ bị
              khoá cho tới khi xác thực xong.
            </p>

            <div className="mb-6 flex flex-col gap-1.5">
              <Label htmlFor="otp">Mã xác thực</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
              />
            </div>

            {resendMessage && (
              <p className="mb-4 text-sm text-muted-foreground">
                {resendMessage}
              </p>
            )}
            {error && (
              <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="xl"
              className="w-full"
              disabled={otpSubmitting || otpCode.length !== 6}
            >
              {otpSubmitting ? "Đang xác thực..." : "Xác thực"}
            </Button>

            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={onResendOtp}
              >
                Gửi lại mã
              </button>
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline"
                onClick={onSkipVerification}
              >
                Xác thực sau, vào ứng dụng
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm">
          <h1 className="mb-2 font-heading text-2xl font-semibold">
            {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản Aperto"}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {mode === "login"
              ? "Đăng nhập để tiếp tục quản lý dự án của bạn."
              : "Chọn vai trò để bắt đầu."}
          </p>

          {mode === "signup" && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setLocalRole(opt.value)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    role === opt.value
                      ? "border-foreground bg-primary/10"
                      : "border-border",
                  )}
                >
                  <div className="text-sm font-semibold">{opt.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {opt.subtitle}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              aria-invalid={!!errors.email}
              {...registerField("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div
            className={cn(
              "flex flex-col gap-1.5",
              mode === "login" ? "mb-2" : "mb-6",
            )}
          >
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              aria-invalid={!!errors.password}
              {...registerField("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          {mode === "login" && (
            <div className="mb-6 text-right">
              <a
                href="#"
                className="text-sm hover:text-primary"
                onClick={(e) => e.preventDefault()}
              >
                Quên mật khẩu?
              </a>
            </div>
          )}

          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập"
                : "Tạo tài khoản"}
          </Button>

          <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            hoặc
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="xl"
            className="w-full"
          >
            Tiếp tục với Google
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Đăng ký
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => setMode("login")}
                >
                  Đăng nhập
                </button>
              </>
            )}
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
