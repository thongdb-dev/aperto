'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, Plus } from 'lucide-react';

import { useAppState } from '@/components/aperto/app-state';
import { PlaceholderArt } from '@/components/aperto/placeholder-art';
import { Stepper } from '@/components/aperto/stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { categories } from '@/lib/mock-data';

const STEPS = ['Thông tin cơ bản', 'Chuyên môn & khu vực', 'Xác minh danh tính', 'Portfolio khởi điểm'];

export function OnboardingScreen() {
  const { setRole } = useAppState();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    setRole('photographer');
    router.push('/dashboard');
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-2 w-fit" nativeButton={false} render={<Link href="/settings" />}>
        <ChevronLeft /> Quay lại cài đặt
      </Button>
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">Đăng ký làm Photographer</h1>
      <Stepper step={step} labels={STEPS} />

      <Card>
        <CardContent>
          {step === 0 && (
            <>
              <h2 className="mb-4 text-lg font-semibold">Thông tin cơ bản</h2>
              <div className="mb-4 flex flex-col gap-1.5">
                <Label>Tên hiển thị</Label>
                <Input placeholder="VD: Minh Anh Studio" />
              </div>
              <div className="mb-4 flex flex-col gap-1.5">
                <Label>Giới thiệu ngắn</Label>
                <Textarea rows={3} placeholder="Phong cách chụp, thế mạnh của bạn..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Số năm kinh nghiệm</Label>
                <Input type="number" placeholder="3" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="mb-4 text-lg font-semibold">Chuyên môn & khu vực hoạt động</h2>
              <div className="mb-4 flex flex-col gap-2">
                <Label>Thể loại chuyên môn (chọn nhiều)</Label>
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter((c) => c !== 'Tất cả')
                    .map((c) => (
                      <span key={c} className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium">
                        {c}
                      </span>
                    ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Khu vực hoạt động</Label>
                <Input placeholder="VD: TP.HCM, Đà Lạt" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="mb-2 text-lg font-semibold">Xác minh danh tính</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Hồ sơ chỉ công khai sau khi Admin duyệt giấy tờ. Thời gian duyệt thường trong 24–48 giờ.
              </p>
              <div className="mb-3 flex items-center gap-3 rounded-lg border-2 border-dashed border-border p-5 text-sm text-muted-foreground">
                <Upload className="size-5 shrink-0" />
                Tải CMND/CCCD mặt trước
              </div>
              <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border p-5 text-sm text-muted-foreground">
                <Upload className="size-5 shrink-0" />
                Tải CMND/CCCD mặt sau
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-2 text-lg font-semibold">Portfolio khởi điểm</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Tối thiểu 6 ảnh để hồ sơ đủ điều kiện xét duyệt (gói Free: tối đa 50 ảnh).
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) =>
                  i < 3 ? (
                    <PlaceholderArt key={i} hue={(i * 40) % 360} className="aspect-square rounded-md" />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-border text-muted-foreground"
                    >
                      <Plus className="size-6" />
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          <div className="mt-6 flex justify-end">
            <Button size="lg" onClick={next}>
              {step === 3 ? 'Gửi hồ sơ để duyệt' : 'Tiếp tục'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
