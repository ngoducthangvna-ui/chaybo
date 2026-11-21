<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Microscopic Engineering & Cutaway Section Refinement

## 范围

Khắc phục triệt để các chi tiết hình học và kỹ thuật nhỏ trên toàn cảnh tại `d:\chaybo`: sửa góc mở mặt cắt 90° (`0.45π..1.95π`) bảo toàn nhịp đáp Skywalk, thay tường đặc mặt cắt bằng cấu kiện cột/sàn rỗng lộ thiên 3 tầng hành lang + ram dốc, căn hàng khán giả 3D chuẩn theo 12 bậc thềm + chừa lối đi thang bộ/vomitory, bổ sung đầy đủ vạch sân FIFA, lưới khung thành mở mặt trước, cabin ghế dự bị có HLV và giao thông xe trên đường vành đai 6 làn.

## 计划

1. Đổi góc cắt `halfCutaway` (`0.45π..1.95π`) trong `BowlStands.tsx`, `RoofStructure.tsx` và `Surroundings.tsx`; thay tường đặc `createCutawaySectionCapGeometry` bằng 4 bản xiên raker, 5 bản sàn ngang, 5 cột bê tông A–E; thu hẹp lõi kỹ thuật để hở sảnh hành lang và căn khớp `LiveSeatedSpectatorCrowd` vào đúng 12 bậc thềm bê tông có lối đi/vomitory (`src/scene/BowlStands.tsx`).
2. Bổ sung chấm 11m, cung chữ D `9.15m`, 4 góc đá phạt, ô khu vực kỹ thuật nét đứt, lưới khung thành 4 mặt mở cửa gôn, cabin BHL có 8 ghế đỏ + 2 HLV trưởng đứng chỉ đạo và khớp cánh tay chuyển động ngược pha cho cầu thủ (`src/scene/Pitch.tsx`).
3. Xóa khung `wireframe` chéo mái Metro, thêm sân đáp trực thăng chữ `H` trên nóc tháp khách sạn đôi 5★ và thêm `LiveRingRoadTraffic` (16 xe buýt + 24 xe con chạy 2 chiều đường vành đai) (`src/scene/Surroundings.tsx`).

## 变更

- `src/scene/BowlStands.tsx`, `src/scene/RoofStructure.tsx`: Mặt cắt `0.45π..1.95π` bảo toàn Podium Nam nối Skywalk, tiết diện cột-sàn rỗng lộ thiên, khán giả ngồi chuẩn 12 bậc thềm không chìm chân.
- `src/scene/Pitch.tsx`: Vạch sân FIFA đầy đủ chuẩn quốc tế, lưới gôn 4 mặt hở miệng gôn, dugout ghế đỏ + 2 HLV trưởng + cánh tay cầu thủ đánh vung ngược pha chân.
- `src/scene/Surroundings.tsx`: Nóc Metro sạch không sọc wireframe chéo, sân đỗ trực thăng VIP trên tháp đôi khách sạn, 40 phương tiện chạy trên 2 chiều đường vành đai ngoài.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi.
- Camera `Khán đài VIP` tại `[0, 22.8, 72]`, `Tầng 4 Sky` và `Mặt cắt 90°` thông thoáng 100%, không còn vật cản hay đứt gãy Skywalk.

## 测试

- `npm.cmd test`: 12/12 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công.

## API 接口文档

无接口变动

## 剩余风险

Chờ nghiệm thu trực quan 4 góc nhìn cuối trên trình duyệt trước khi commit/push.
