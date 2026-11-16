# Spec: Zero Sum, ghi sổ tiền các ván "thắng ăn tất"

## 1. Mục tiêu

Một web đơn giản trên điện thoại để nhóm bạn chơi bài, bi-a... ghi lại tiền thắng thua theo từng ván, cộng dồn nhiều ván trong một phiên chơi và có bảng tổng kết cuối trận. Không cần đăng nhập, không cần mạng, không cần backend: dữ liệu lưu ngay trên trình duyệt của người dùng.

Thước đo thành công của MVP:
- Tạo phiên và thêm người chơi trong dưới 30 giây
- Nhập xong một ván trong vài lần chạm
- Cuối trận biết ngay ai phải chuyển cho ai bao nhiêu
- Tắt trình duyệt mở lại vẫn còn nguyên dữ liệu

## 2. Đối tượng

Nhóm bạn chơi bài hoặc bi-a, dùng một điện thoại duy nhất để ghi sổ ngay tại bàn. Chỉ tối ưu cho mobile (khoảng 390px); desktop chỉ cần không vỡ giao diện.

## 3. Phạm vi

**Trong MVP:** tạo và quản lý phiên, người chơi, nhập ván, sửa/xoá ván, bảng điểm cộng dồn, tổng kết cuối trận, sao chép kết quả để gửi nhóm chat, xuất/nhập JSON để sao lưu, CI.

**Ngoài MVP (làm sau, khi thật sự cần):** backend, đăng nhập, đồng bộ nhiều thiết bị, chia sẻ phiên online, nhiều đơn vị tiền tệ, đa ngôn ngữ, luật tính điểm phức tạp (nhất/nhì/ba, hệ số, thưởng).

## 4. Nghiệp vụ cốt lõi

- Một **phiên** (session) có nhiều **người chơi** và nhiều **ván** (round).
- Mỗi ván có đúng **1 người thắng** ("ăn tất"). Mọi người còn lại là người thua.
- Mỗi người thua nhập **số đơn vị còn lại** (số bi còn trên bàn, số lá bài còn trên tay), là số nguyên `>= 0`.
- Tiền người thua `i` phải trả = `giá mỗi đơn vị × số đơn vị còn lại của i`.
- Người thắng nhận tổng tiền của tất cả người thua. Mỗi ván tổng thay đổi của mọi người luôn bằng 0 (zero-sum).
- **Số dư** của mỗi người trong phiên = tổng các ván cộng dồn; luôn được tính lại từ danh sách ván, không lưu riêng.

Ví dụ bắt buộc (test case): ván bi-a, giá 5.000đ/bi. Tôi thắng, A còn 3 bi, B còn 2 bi.
- A trả 15.000đ, B trả 10.000đ
- Tôi +25.000đ, A -15.000đ, B -10.000đ

### 4.1 Quy tắc biên
- Giá mỗi đơn vị có thể sửa giữa phiên. Mỗi ván lưu bản sao (snapshot) giá lúc tạo ván, nên ván cũ không bị tính lại.
- Một ván cần ít nhất 2 người chơi (1 thắng, 1 thua). Người không tham gia ván đó thì không nằm trong ván (ví dụ bàn 4 người nhưng ván này chỉ có 3 người đánh).
- Số còn lại bằng 0 là hợp lệ (người thua nhưng không phải trả).
- Tên người chơi không được rỗng và không trùng trong cùng phiên (không phân biệt hoa thường).
- Người chơi đã xuất hiện trong ván thì không được xoá, chỉ được ẩn (`archived`) khỏi danh sách chọn cho ván mới; số dư cũ vẫn giữ.
- Xoá phiên hoặc xoá ván cần hộp thoại xác nhận.
- Giá phải là số nguyên dương VND.

### 4.2 Tối giản chuyển khoản (tổng kết)
Từ số dư cuối của mỗi người, đưa ra danh sách "ai chuyển cho ai bao nhiêu" với số lần chuyển ít, theo thuật toán tham lam: lặp ghép người nợ nhiều nhất với người được nhận nhiều nhất, chuyển `min(nợ, được nhận)` cho tới khi hết. Tổng chuyển khoản luôn khớp số dư; người có số dư 0 không xuất hiện.

## 5. Màn hình (mobile-first)

### 5.1 Danh sách phiên `/`
- Danh sách phiên, mới nhất trước: tên, ngày, số người, số ván, nhãn "Đang chơi" / "Đã kết thúc"
- Nút nổi "Tạo phiên mới"
- Trạng thái rỗng thân thiện khi chưa có phiên

### 5.2 Tạo phiên
- Tên phiên (mặc định theo ngày, ví dụ "Bi-a 16/11")
- Giá mỗi đơn vị (VND) và đơn vị tính, chỉ chọn "bi" hoặc "lá"
- Thêm người chơi (tối thiểu 2), thêm/xoá nhanh bằng ô nhập + Enter

### 5.3 Chi tiết phiên `/session/[id]`
- Bảng điểm: mỗi người một dòng, số dư cộng dồn, xanh khi dương, đỏ khi âm, sắp xếp từ cao đến thấp
- Nút lớn "Thêm ván" cố định ở đáy màn hình
- Lịch sử ván (mới nhất trước): người thắng, chi tiết từng người thua, tiền; bấm vào để sửa hoặc xoá
- Menu: cài đặt phiên, tổng kết

### 5.4 Nhập ván
- Chọn người thắng (chip lớn dễ chạm)
- Với mỗi người thua: stepper `-` / `+` số còn lại (mặc định 0), cũng cho nhập số trực tiếp
- Tick bỏ người không tham gia ván này
- Xem trước số tiền từng người ngay khi nhập, rồi bấm "Lưu ván"

### 5.5 Tổng kết `/session/[id]/summary`
- Số dư cuối của từng người, số ván đã chơi
- Danh sách chuyển khoản tối giản (mục 4.2)
- Nút "Sao chép kết quả" (văn bản tiếng Việt để dán vào nhóm chat) và nút "Kết thúc phiên"

### 5.6 Cài đặt phiên
- Sửa tên, giá, đơn vị (giá mới chỉ áp dụng cho ván tiếp theo)
- Thêm người; ẩn/hiện người đã có ván; xoá người chưa có ván
- Kết thúc / mở lại phiên, xoá phiên
- Xuất JSON toàn bộ dữ liệu, nhập JSON để khôi phục (có xác nhận trước khi ghi đè)

### 5.0 Routes
`/` (danh sách), `/new` (tạo phiên), `/session/[id]` (chi tiết), `/session/[id]/round` (thêm ván), `/session/[id]/round/[roundId]` (sửa/xoá ván), `/session/[id]/summary` (tổng kết), `/session/[id]/settings` (cài đặt). Phiên đã kết thúc là chỉ đọc: muốn thêm/sửa/xoá ván phải mở lại phiên.

### 5.7 Thành phần dùng chung
- Hỗ trợ chế độ sáng và tối: mặc định theo hệ thống (`prefers-color-scheme`), có nút chuyển tay, lưu lựa chọn qua `lib/storage.ts`, áp dụng trước khi render để không bị nháy sáng khi tải trang
- Chữ lớn, vùng chạm tối thiểu 44px
- Trang 404 tiếng Việt, báo "Không tìm thấy phiên" khi id không tồn tại
- Mọi chuỗi giao diện bằng tiếng Việt

## 6. Mô hình dữ liệu

Kiểu TypeScript đặt trong `lib/types.ts`:

```ts
interface Player {
  id: string;            // uuid
  name: string;
  archived: boolean;     // ẩn khỏi lựa chọn cho ván mới
}

interface RoundLoss {
  playerId: string;
  remaining: number;     // số nguyên >= 0
}

interface Round {
  id: string;
  winnerId: string;
  losses: RoundLoss[];   // >= 1 phần tử, không chứa winnerId
  unitPrice: number;     // snapshot VND/đơn vị lúc tạo ván
  createdAt: string;     // ISO 8601
}

interface Session {
  id: string;
  name: string;
  unitLabel: "bi" | "lá";
  unitPrice: number;     // giá hiện hành, VND, số nguyên > 0
  players: Player[];
  rounds: Round[];
  status: "active" | "finished";
  createdAt: string;
  updatedAt: string;
}

interface StorageEnvelope {
  version: 1;
  sessions: Session[];
}
```

Hàm thuần trong `lib/settlement.ts` (đều có unit test):
- `roundDeltas(round): Record<playerId, number>`: thay đổi tiền của từng người trong một ván
- `sessionBalances(session): Record<playerId, number>`: số dư cộng dồn
- `minimalTransfers(balances): { from, to, amount }[]`: chuyển khoản tối giản
- `formatSummaryText(session): string`: văn bản chia sẻ

## 7. Lưu trữ

- localStorage, key `zero-sum:v1`, giá trị là `StorageEnvelope` dạng JSON
- Chỉ `lib/storage.ts` được đọc/ghi; có `version` và hàm migrate cho phiên bản sau
- Đọc sau khi mount để tránh lỗi hydration; hiển thị skeleton trong lúc chờ
- Dữ liệu hỏng hoặc sai schema: không crash, báo người dùng và cho phép xuất dữ liệu thô / bắt đầu lại
- Lỗi ghi (hết dung lượng, chế độ riêng tư): hiện thông báo rõ ràng
- Xuất/nhập JSON phải kiểm tra schema trước khi ghi đè

## 8. Phi chức năng

- Tải nhanh, không phụ thuộc mạng sau lần tải đầu; PWA/cài lên màn hình chính là việc làm sau
- Truy cập cơ bản: nhãn cho nút icon, tương phản đủ ở cả chế độ sáng và tối, không dùng màu là dấu hiệu duy nhất (thêm dấu `+`/`-`)
- Không cookie, không tracking, không gửi dữ liệu ra ngoài

## 9. Test case nghiệp vụ

1. Ví dụ bi-a ở mục 4: ra đúng +25.000 / -15.000 / -10.000
2. Nhiều ván cộng dồn: số dư bằng tổng từng ván
3. Mỗi ván và cả phiên: tổng số dư luôn bằng 0
4. Đổi giá giữa phiên: ván cũ giữ giá cũ
5. Người thua còn 0: không phải trả, vẫn nằm trong ván
6. `minimalTransfers`: tổng chuyển khoản khớp, số lần chuyển nhỏ hơn hoặc bằng số người - 1
7. Storage: dữ liệu hỏng không làm crash, nhập JSON sai schema bị từ chối

## 10. Kế hoạch triển khai (mỗi PR một mối quan tâm)

1. Scaffold Next.js + Tailwind + ESLint + Vitest (cần duyệt dependency)
2. `lib/types.ts` + `lib/settlement.ts` + unit test
3. `lib/storage.ts` + hook dùng chung + test
4. Danh sách phiên và tạo phiên
5. Chi tiết phiên và nhập/sửa/xoá ván
6. Tổng kết, sao chép kết quả, kết thúc phiên
7. Cài đặt phiên, xuất/nhập JSON, 404, chế độ sáng/tối, polish mobile

## 11. Quyết định đã chốt

- **Luật chơi:** MVP chỉ hỗ trợ đúng một luật là "thắng ăn tất". Không làm nhất/nhì/ba, hệ số nhân hay thưởng.
- **Đơn vị:** chỉ có hai lựa chọn "bi" và "lá", không thêm đơn vị khác.
- **Giao diện:** hỗ trợ cả chế độ sáng và tối (xem mục 5.7).
