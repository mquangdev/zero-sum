# Zero Sum

Web mobile-first để ghi sổ tiền các ván "thắng ăn tất" (bài, bi-a) giữa bạn bè. Không cần đăng nhập, không cần backend, dữ liệu lưu ngay trên trình duyệt.

Ví dụ: ván bi-a giá 5.000đ/bi, bạn thắng, A còn 3 bi, B còn 2 bi → A trả 15.000đ, B trả 10.000đ, bạn nhận 25.000đ. Nhiều ván cộng dồn trong một phiên và có tổng kết cuối trận.

## Tài liệu

- [`docs/spec.md`](docs/spec.md): yêu cầu và nghiệp vụ chi tiết
- [`CLAUDE.md`](CLAUDE.md): quy ước làm việc cho AI/dev

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, localStorage, Vitest. Deploy trên Vercel, CI bằng GitHub Actions.

## Chạy cục bộ

Sau khi app được scaffold (xem kế hoạch trong spec):

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build
```

## Trạng thái

Đang ở giai đoạn spec: repo mới có tài liệu và cấu hình CI, chưa có code app.
