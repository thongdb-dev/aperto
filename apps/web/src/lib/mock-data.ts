// Aperto — typed mock data for UI structure (ported from the Claude Design prototype's data.js).
// Stand-in until the real API (apps/api) is wired up from the frontend.

export type TrustLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite';
export type RefundPolicy = 'full' | 'before7' | 'nonrefundable';
export type UserRole = 'customer' | 'photographer' | 'admin';

export interface Package {
  id: string;
  name: string;
  price: number;
  hours: number;
  photos: number;
  desc: string;
}

export interface Photographer {
  id: string;
  name: string;
  avatarHue: number;
  categories: string[];
  location: string;
  priceFrom: number;
  rating: number;
  reviewCount: number;
  trust: TrustLevel;
  verified: boolean;
  years: number;
  bio: string;
  responseTime: string;
  packages: Package[];
  depositPercent: number;
  refundPolicy: RefundPolicy;
  portfolio: number[];
}

export const categories = ['Tất cả', 'Cưới', 'Chân dung', 'Gia đình', 'Sản phẩm', 'Sự kiện', 'Trẻ em'];

export const photographers: Photographer[] = [
  {
    id: 'p1',
    name: 'Minh Anh Studio',
    avatarHue: 42,
    categories: ['Cưới', 'Chân dung'],
    location: 'Quận 1, TP.HCM',
    priceFrom: 3500000,
    rating: 4.9,
    reviewCount: 128,
    trust: 'Gold',
    verified: true,
    years: 6,
    bio: 'Chuyên chụp ảnh cưới phong cách phim trường, ánh sáng tự nhiên. Đã đồng hành cùng hơn 300 cặp đôi tại TP.HCM và Đà Lạt.',
    responseTime: 'trong 2 giờ',
    packages: [
      { id: 'pkg1', name: 'Gói Cơ Bản', price: 3500000, hours: 3, photos: 50, desc: '3 giờ chụp, 50 ảnh đã chỉnh, 1 địa điểm.' },
      { id: 'pkg2', name: 'Gói Trọn Vẹn', price: 7500000, hours: 6, photos: 120, desc: '6 giờ chụp, 120 ảnh đã chỉnh, 2 địa điểm, 1 outfit thay đổi.' },
      { id: 'pkg3', name: 'Gói Premium', price: 14000000, hours: 10, photos: 250, desc: 'Trọn ngày, 250 ảnh đã chỉnh, quay video highlight 2 phút.' },
    ],
    depositPercent: 30,
    refundPolicy: 'before7',
    portfolio: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    id: 'p2',
    name: 'Lâm Trần Photography',
    avatarHue: 205,
    categories: ['Sản phẩm', 'Thương mại'],
    location: 'Quận 3, TP.HCM',
    priceFrom: 2200000,
    rating: 4.7,
    reviewCount: 76,
    trust: 'Silver',
    verified: true,
    years: 3,
    bio: 'Ảnh sản phẩm và thương mại cho thương hiệu nhỏ — set up studio chuyên nghiệp, giao ảnh nhanh trong 48h.',
    responseTime: 'trong 1 giờ',
    packages: [
      { id: 'pkg1', name: 'Gói 10 Sản Phẩm', price: 2200000, hours: 2, photos: 30, desc: '10 sản phẩm, 3 góc chụp mỗi sản phẩm.' },
      { id: 'pkg2', name: 'Gói 30 Sản Phẩm', price: 5200000, hours: 5, photos: 90, desc: '30 sản phẩm, hậu kỳ màu chuyên sâu.' },
    ],
    depositPercent: 20,
    refundPolicy: 'full',
    portfolio: [9, 10, 11, 12],
  },
  {
    id: 'p3',
    name: 'Ngọc Hà Visuals',
    avatarHue: 350,
    categories: ['Gia đình', 'Trẻ em'],
    location: 'Quận 7, TP.HCM',
    priceFrom: 1800000,
    rating: 5.0,
    reviewCount: 54,
    trust: 'Platinum',
    verified: true,
    years: 5,
    bio: 'Ảnh gia đình tự nhiên, không dàn dựng — ưu tiên khoảnh khắc thật của trẻ em và bố mẹ.',
    responseTime: 'trong 3 giờ',
    packages: [
      { id: 'pkg1', name: 'Gói Gia Đình Nhỏ', price: 1800000, hours: 1.5, photos: 35, desc: '1.5 giờ tại công viên hoặc nhà riêng.' },
      { id: 'pkg2', name: 'Gói Gia Đình Mở Rộng', price: 3200000, hours: 3, photos: 70, desc: '3 giờ, 2 địa điểm, in 10 ảnh khổ lớn.' },
    ],
    depositPercent: 30,
    refundPolicy: 'before7',
    portfolio: [13, 14, 15, 16, 17],
  },
  {
    id: 'p4',
    name: 'Đức Phong Media',
    avatarHue: 150,
    categories: ['Sự kiện', 'Doanh nghiệp'],
    location: 'Quận Bình Thạnh, TP.HCM',
    priceFrom: 4500000,
    rating: 4.6,
    reviewCount: 41,
    trust: 'Bronze',
    verified: false,
    years: 2,
    bio: 'Ảnh sự kiện, hội nghị, team building — đội ngũ 2 photographer, giao ảnh trong 24h.',
    responseTime: 'trong 4 giờ',
    packages: [
      { id: 'pkg1', name: 'Gói Sự Kiện Nửa Ngày', price: 4500000, hours: 4, photos: 150, desc: '4 giờ, 1 photographer, giao ảnh 24h.' },
    ],
    depositPercent: 50,
    refundPolicy: 'nonrefundable',
    portfolio: [18, 19, 20],
  },
];

export function findPhotographer(id: string): Photographer | undefined {
  return photographers.find((p) => p.id === id);
}

export const currentCustomer = {
  name: 'Thu Trang',
  email: 'thutrang@gmail.com',
  avatarHue: 280,
};

export const currentPhotographer = photographers[0];

export interface TimelineEvent {
  label: string;
  date: string;
  done: boolean;
}

export const timelineEvents: TimelineEvent[] = [
  { label: 'Booking đã xác nhận', date: '12/06/2026', done: true },
  { label: 'Đặt cọc thành công', date: '12/06/2026', done: true },
  { label: 'Buổi chụp', date: '20/06/2026', done: true },
  { label: 'Ảnh RAW đã tải lên', date: '22/06/2026', done: true },
  { label: 'Khách chọn ảnh', date: '24/06/2026', done: true },
  { label: 'Ảnh đã chỉnh sửa', date: '28/06/2026', done: false },
  { label: 'Bàn giao cuối cùng', date: '—', done: false },
  { label: 'Thanh toán hoàn tất', date: '—', done: false },
];

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export const checklist: ChecklistItem[] = [
  { text: 'Xác nhận địa điểm: Biệt thự cổ Quận 3', done: true },
  { text: 'Trang phục: đầm vintage tone be, giày da nâu', done: true },
  { text: 'Đạo cụ: nón rơm, xe đạp cổ', done: true },
  { text: 'Trang điểm nhẹ, tóc buộc nửa', done: false },
  { text: 'Có mặt trước 15 phút để setup ánh sáng', done: false },
];

export interface ChatMessage {
  from: 'photographer' | 'customer';
  text: string;
  time: string;
  date?: string;
}

export const messages: ChatMessage[] = [
  {
    from: 'photographer',
    text: 'Chào Trang! Mình đã nhận được booking cho buổi chụp ngày 20/06. Bạn có concept cụ thể nào chưa?',
    time: '10:02',
  },
  {
    from: 'customer',
    text: 'Chào anh, em muốn chụp theo phong cách vintage, tone ấm ạ. Em gửi vài ảnh tham khảo bên tab Moodboard nhé.',
    time: '10:05',
  },
  {
    from: 'photographer',
    text: 'Ok Trang, mình xem rồi, rất đẹp. Địa điểm mình đề xuất là Biệt thự cổ Quận 3, ánh sáng buổi chiều sẽ rất hợp tone này.',
    time: '10:20',
  },
  { from: 'customer', text: 'Dạ được ạ! Vậy mình chốt lịch 15h chiều 20/06 nhé.', time: '10:22' },
  {
    from: 'photographer',
    text: 'Ảnh RAW của buổi chụp mình đã tải lên gallery rồi nha, bạn chọn ảnh ưng ý để mình edit nhé!',
    time: '09:14',
    date: '22/06',
  },
];

export const moodboardNotes = [
  'Tone ấm, phim vintage',
  'Ánh sáng cửa sổ tự nhiên',
  'Đầm be, giày da nâu',
  'Góc rộng cho không gian',
  'Chi tiết tay & trang sức',
  'Nụ cười tự nhiên, không gượng',
];

export interface Review {
  name: string;
  hue: number;
  rating: number;
  text: string;
  date: string;
}

export const reviews: Review[] = [
  {
    name: 'Bảo Châu',
    hue: 20,
    rating: 5,
    text: 'Ảnh cưới đẹp ngoài mong đợi, ekip chuyên nghiệp, giao ảnh đúng hẹn.',
    date: '3 tuần trước',
  },
  {
    name: 'Gia Huy',
    hue: 190,
    rating: 5,
    text: 'Rất tận tâm, hỗ trợ concept nhiệt tình. Sẽ quay lại lần sau.',
    date: '1 tháng trước',
  },
  {
    name: 'Minh Thư',
    hue: 320,
    rating: 4,
    text: 'Ảnh ổn, tuy nhiên thời gian chỉnh sửa hơi lâu so với dự kiến.',
    date: '2 tháng trước',
  },
];

export type NotificationType = 'booking' | 'message' | 'payment' | 'system' | 'review' | 'trust';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  urgent?: boolean;
}

export const notifications: AppNotification[] = [
  { id: 'n1', type: 'booking', title: 'Yêu cầu booking mới từ Gia Bảo', body: 'Gói Trọn Vẹn · 25/06/2026 · còn 18 giờ để phản hồi (SLA 24h)', time: '2 giờ trước', unread: true, urgent: true },
  { id: 'n2', type: 'message', title: 'Tin nhắn mới từ Minh Anh Studio', body: '"Ảnh RAW của buổi chụp mình đã tải lên gallery rồi nha..."', time: '5 giờ trước', unread: true },
  { id: 'n3', type: 'payment', title: 'Đặt cọc thành công', body: 'Booking #A1092 · 2.250.000₫ qua MoMo', time: '1 ngày trước', unread: false },
  { id: 'n4', type: 'system', title: 'Ảnh RAW sắp hết hạn lưu trữ', body: 'Dự án "Chụp sản phẩm shop online" còn 7 ngày trước khi RAW bị xoá', time: '1 ngày trước', unread: false, urgent: true },
  { id: 'n5', type: 'review', title: 'Bạn nhận được đánh giá 5 sao', body: 'Từ Bảo Châu — "Ảnh cưới đẹp ngoài mong đợi..."', time: '3 ngày trước', unread: false },
  { id: 'n6', type: 'trust', title: 'Trust Score cập nhật', body: 'Điểm mới: 62/100 — cần 60 để lên Gold, đã đạt!', time: '4 ngày trước', unread: false },
];

export interface Dispute {
  id: string;
  project: string;
  customer: string;
  photographer: string;
  reason: string;
  status: 'awaiting_response' | 'in_review';
  openedBy: 'customer' | 'photographer';
  description: string;
  openedAt: string;
  respondBy: string;
  amountHeld: number;
  response?: string;
}

export const disputes: Dispute[] = [
  {
    id: 'd1', project: 'Ảnh cưới ngoại cảnh Đà Lạt', customer: 'Hải Đăng', photographer: 'Minh Anh Studio',
    reason: 'Không đúng cam kết', status: 'awaiting_response', openedBy: 'customer',
    description: 'Số lượng ảnh đã chỉnh giao chỉ 80/120 ảnh theo gói, quá hạn cam kết 5 ngày.',
    openedAt: '19/07/2026', respondBy: '21/07/2026', amountHeld: 5250000,
  },
  {
    id: 'd2', project: 'Chụp sự kiện công ty ABC', customer: 'Quang Minh', photographer: 'Đức Phong Media',
    reason: 'Chất lượng ảnh', status: 'in_review', openedBy: 'customer',
    description: 'Ảnh bị noise nhiều trong điều kiện thiếu sáng, không như portfolio giới thiệu.',
    openedAt: '15/07/2026', respondBy: '17/07/2026', amountHeld: 4500000,
    response: 'Đã đề xuất chỉnh sửa lại miễn phí 20 ảnh nhưng khách từ chối.',
  },
];

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  photos: number | string;
  packages: number | string;
  storage: string;
  badge: string | null;
  featured: number;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  { id: 'free', name: 'Free', price: 0, photos: 50, packages: 3, storage: '5GB / 90 ngày', badge: null, featured: 0 },
  { id: 'pro', name: 'Pro', price: 199000, photos: 500, packages: 'Không giới hạn', storage: '10GB / 180 ngày', badge: 'Pro', featured: 0 },
  { id: 'studio', name: 'Studio', price: 499000, photos: 'Không giới hạn', packages: 'Không giới hạn', storage: '20GB / 365 ngày', badge: 'Studio', featured: 1 },
];

export const payoutInfo = {
  bank: 'Vietcombank',
  accountNumber: '**** **** 4821',
  accountName: 'NGUYEN MINH ANH',
  pendingPayout: 6750000,
  lastPayout: { amount: 12300000, date: '15/06/2026' },
};

export const adminStats = {
  totalUsers: 4820,
  totalPhotographers: 612,
  pendingVerifications: 14,
  openDisputes: 2,
  gmvThisMonth: 842000000,
  commissionThisMonth: 84200000,
};

export interface VerificationQueueItem {
  id: string;
  name: string;
  hue: number;
  categories: string[];
  submittedAt: string;
  idDoc: boolean;
  portfolioCount: number;
}

export const verificationQueue: VerificationQueueItem[] = [
  { id: 'v1', name: 'Hoàng Kim Studio', hue: 60, categories: ['Cưới', 'Sự kiện'], submittedAt: '21/07/2026', idDoc: true, portfolioCount: 22 },
  { id: 'v2', name: 'Việt Anh Photo', hue: 100, categories: ['Chân dung'], submittedAt: '20/07/2026', idDoc: true, portfolioCount: 8 },
  { id: 'v3', name: 'Sunrise Media', hue: 260, categories: ['Thương mại', 'Sản phẩm'], submittedAt: '18/07/2026', idDoc: false, portfolioCount: 15 },
];

export interface MockProject {
  id: string;
  name: string;
  photographerId: string;
  status: string;
  statusVariant: 'success' | 'pending';
  date: string;
}

export const mockProjects: MockProject[] = [
  { id: 'demo-vintage-q3', name: 'Buổi chụp Vintage — Biệt thự Q.3', photographerId: 'p1', status: 'Đang thực hiện', statusVariant: 'success', date: '20/06/2026' },
  { id: 'demo-family-year-end', name: 'Ảnh gia đình cuối năm', photographerId: 'p3', status: 'Chờ xác nhận', statusVariant: 'pending', date: '02/07/2026' },
  { id: 'demo-product-shop', name: 'Chụp sản phẩm shop online', photographerId: 'p2', status: 'Hoàn tất', statusVariant: 'success', date: '02/05/2026' },
];
