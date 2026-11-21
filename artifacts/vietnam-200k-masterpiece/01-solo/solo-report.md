<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Live Match Physics, 100% Full Crowd & Pedestrian Circulation Simulation

## 范围

Tích hợp hệ thống mô phỏng vật lý trận đấu 3D, 100% khán đài phủ kín `200,000` chỗ (`5,600` nhân vật khán giả 3D chuyển động sóng cổ vũ), dòng người đi bộ `Weidmann / Fruin` qua cầu kính Skywalk, 5 đại cầu thang, 16 lõi ram dốc đứng, 3 tầng hành lang và đoàn tàu Metro chuyển động theo thời gian thực tại `d:\chaybo`.

## 计划

1. Thêm `calculateCrowdPhysicsMetrics()` (động học Weidmann, chuẩn Fruin LOS, tải trọng động ISO 10137 `f_n = 5.8 Hz`) và `evaluateBallProjectile()` (quỹ đạo bóng trọng lực & độ nảy `e = 0.62`) trong `src/config/stadiumSpecs.ts` cùng 3 unit test kiểm chứng trong `src/config/stadiumSpecs.test.ts`.
2. Thêm `LiveMatchSimulation` trong `src/scene/Pitch.tsx` mô phỏng 22 cầu thủ + 3 trọng tài + quỹ đạo bóng bay và bóng đổ thời gian thực.
3. Thêm `VerticalCirculationCores` (16 lõi ram dốc xoắn), `LiveSeatedSpectatorCrowd` (5,600 khán giả 3D phủ 4 tầng khán đài chuyển động sóng cổ vũ) và `LiveConcoursePedestrians` (900 người đi bộ trên 3 tầng hành lang & ram dốc) trong `src/scene/BowlStands.tsx`.
4. Thêm `LiveExteriorPedestrianFlows` (1,500 người đi bộ trên 5 cầu thang Travertine, cầu kính Skywalk, vành đai Podium và 4 đại lộ) cùng tàu Metro di chuyển 2 ray trong `src/scene/Surroundings.tsx`.
5. Đặt mặc định `occupancyPercent = 100` & `liveSimActive = true` trong `src/App.tsx` và hiển thị bảng thông số Weidmann / ISO 10137 + nút điều khiển mô phỏng trong `src/components/ControlPanel.tsx`.

## 变更

- `src/config/stadiumSpecs.ts`, `src/config/stadiumSpecs.test.ts`: Công thức vật lý đám đông Weidmann/Fruin/ISO 10137 & quỹ đạo bóng 3D + 12 unit tests.
- `src/scene/Pitch.tsx`: Mô phỏng trận đấu 25 nhân vật có khớp chân, hướng vận tốc & bóng 3D.
- `src/scene/BowlStands.tsx`: 16 lõi ram dốc đứng, 5,600 khán giả 3D cập nhật trực tiếp ma trận `instanceMatrix`, 900 người đi bộ nội khu.
- `src/scene/Surroundings.tsx`: 1,500 người đi bộ ngoại khu đúng cao độ đại sảnh/cầu thang/Skywalk + tàu Metro chuyển động trên cầu cạn `520m`.
- `src/App.tsx`, `src/scene/StadiumScene.tsx`, `src/components/ControlPanel.tsx`: Tích hợp UI 100% công suất & thống kê động lực học đám đông.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi.
- Phép chiếu cao độ trên 5 đại cầu thang Travertine (`y: 0.75m -> 11.2m`), Skywalk (`y: 11.08m`), Podium (`y: 10.55m`), Concourse (`+17.8m`, `+32.8m`, `+52.8m`) khớp chính xác với hình học kết cấu.

## 测试

- `npm.cmd test`: 12/12 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công (2158 modules, 13.82s).

## API 接口文档

无接口变动

## 剩余风险

Chờ nghiệm thu ảnh chụp màn hình 4 góc nhìn (mặt sân, VIP, quy hoạch ngoại khu, mặt cắt 90° hành lang nội khu) và console trình duyệt.
