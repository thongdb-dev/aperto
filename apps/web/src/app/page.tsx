import Link from "next/link";
import { Camera, MessageSquare, Image as ImageIcon, PackageCheck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const features = [
  {
    icon: MessageSquare,
    title: "Conversation",
    description: "Trao đổi trực tiếp với photographer trong từng dự án.",
  },
  {
    icon: ImageIcon,
    title: "Moodboard & Chọn ảnh",
    description: "Thống nhất phong cách và duyệt ảnh ngay trên nền tảng.",
  },
  {
    icon: PackageCheck,
    title: "Bàn giao & Thanh toán",
    description: "Theo dõi tiến độ, đặt cọc và nhận ảnh minh bạch.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Camera className="size-5 text-primary" />
          <span className="font-heading text-lg font-semibold">Aperto</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-16 px-6 py-20 text-center">
        <section className="flex max-w-2xl flex-col items-center gap-6">
          <Badge variant="secondary">Nền tảng đặt lịch chụp ảnh</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Đặt lịch & quản lý dự án chụp ảnh, trọn vẹn trên một nền tảng
          </h1>
          <p className="text-balance text-muted-foreground">
            Aperto kết nối Photographer và Khách hàng, quản lý toàn bộ vòng đời
            của một photoshoot từ booking đến bàn giao ảnh — minh bạch, không
            còn chốt giá qua chat hay gửi ảnh qua Drive.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="xl" nativeButton={false} render={<Link href="/login" />}>
              Đặt lịch ngay
            </Button>
            <Button size="xl" variant="outline" nativeButton={false} render={<Link href="/search" />}>
              Tìm nhiếp ảnh gia
            </Button>
          </div>
        </section>

        <section className="grid w-full gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="text-left">
              <CardHeader>
                <Icon className="size-5 text-primary" />
                <CardTitle className="mt-2">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Aperto
      </footer>
    </div>
  );
}