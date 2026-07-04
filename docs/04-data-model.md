# 04 — Mô hình dữ liệu (MongoDB)

15 collections theo brief gốc. Cấu trúc field là **đề xuất** — tinh chỉnh trong quá trình triển khai.

## users

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | Khoá chính |
| email | string | Duy nhất |
| phone | string | Duy nhất |
| password_hash | string | Mật khẩu đã hash |
| role | enum | `customer` \| `photographer` \| `admin` |
| status | enum | `active` \| `suspended` \| `pending_verification` |
| avatar_url | string | |
| created_at / updated_at | datetime | |

## photographer_profiles

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| user_id | ref: users | |
| display_name | string | |
| bio | string | |
| categories | string[] | Thể loại chuyên môn |
| service_area | geo/string | Khu vực hoạt động |
| experience_years | number | |
| verification_status | enum | `unverified` \| `pending` \| `verified` |
| trust_score | number | Denormalized để query nhanh |
| trust_level | enum | `bronze` \| `silver` \| `gold` \| `platinum` \| `elite` |
| response_time_avg_minutes | number | |

## customer_profiles

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| user_id | ref: users | |
| full_name | string | |
| address | string | |
| preferences | string[] | Thể loại yêu thích (phục vụ gợi ý) |

## packages

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| photographer_id | ref | |
| name / description | string | |
| price | number | |
| duration_minutes | number | Thời lượng buổi chụp |
| deliverables | object | Số ảnh edit, thời gian giao dự kiến |
| is_active | boolean | |

## booking_policies

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| photographer_id | ref | |
| deposit_enabled | boolean | |
| deposit_type | enum | `percentage` \| `fixed_amount` |
| deposit_value | number | % hoặc số tiền |
| refund_policy | enum | `full` \| `before_x_days` \| `non_refundable` |
| refund_days | number | Số ngày X cho `before_x_days` |
| milestones | object[] | Tên, % hoặc số tiền, điều kiện kích hoạt |

## bookings

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| customer_id / photographer_id | ref | |
| package_id | ref | |
| policy_snapshot | object | **Bản sao policy tại thời điểm đặt** — tránh ảnh hưởng khi policy đổi sau |
| shoot_date | datetime | |
| location | string | |
| status | enum | `pending` \| `confirmed` \| `in_progress` \| `completed` \| `cancelled` \| `disputed` |
| deposit_amount | number | |
| created_at | datetime | |

## projects

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| booking_id | ref | Booking gốc |
| status | enum | `active` \| `completed` \| `cancelled` |
| timeline_events | object[] | Log sự kiện (loại, thời điểm) |
| created_at | datetime | |

## project_messages

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| project_id | ref | |
| sender_id | ref: users | |
| content | string | |
| attachments | string[] | |
| created_at | datetime | |

## photos

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| project_id | ref | |
| type | enum | `raw` \| `edited` \| `moodboard` |
| url / thumbnail_url | string | |
| uploaded_by | ref: users | |
| uploaded_at | datetime | |

## photo_selections

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| project_id | ref | |
| photo_id | ref: photos | |
| selected_by | ref: users | |
| status | enum | `selected` \| `editing` \| `delivered` |
| comment | string | Yêu cầu chỉnh sửa cho ảnh |

## payments

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| booking_id / project_id | ref | |
| type | enum | `deposit` \| `milestone` \| `final` \| `refund` |
| amount | number | |
| commission_amount | number | Hoa hồng nền tảng |
| gateway | enum | `stripe` \| `momo` \| `vnpay` |
| status | enum | `pending` \| `success` \| `failed` \| `refunded` |
| transaction_ref | string | Mã tham chiếu từ cổng thanh toán |
| created_at | datetime | |

## reviews

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| project_id | ref | |
| customer_id / photographer_id | ref | |
| rating | number (1–5) | |
| comment | string | |
| created_at | datetime | |

## trust_scores

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| photographer_id | ref | |
| score | number | |
| breakdown | object | Chi tiết đóng góp từng tiêu chí |
| calculated_at | datetime | |

## achievements

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| photographer_id | ref | |
| badge_type | string | |
| achieved_at | datetime | |

## notifications

| Field | Kiểu | Mô tả |
|---|---|---|
| id | ObjectId | |
| user_id | ref: users | Người nhận |
| type | string | |
| content | string | |
| is_read | boolean | |
| created_at | datetime | |
