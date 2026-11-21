<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Stadium Masterpiece 3D

## 范围

Nâng cấp dự án `d:\chaybo` (Vietnam 200K Stadium 3D) tận dụng tối đa hệ thống LoopForge DevFlow và bộ ngôn ngữ thiết kế Grasp + Harness UI trong `d:\LoopForge-main\design.md`. Phạm vi giới hạn trong cấu hình thông số (`src/config/stadiumSpecs.ts`), các thành phần 3D (`src/scene/*`), bảng điều khiển (`src/components/ControlPanel.tsx`) và kiểm thử (`src/config/stadiumSpecs.test.ts`).

## 计划

1. Mở rộng `src/config/stadiumSpecs.ts` & `src/config/stadiumSpecs.test.ts` với công thức âm học (`dB`), điện năng (`MW`), trọng lượng thép mái (`28,500 tấn`) và danh sách 7 node LoopForge SOP.
2. Nâng cấp `src/scene/Pitch.tsx` (họa tiết Trống đồng & ngôi sao tâm sân, 22 cầu thủ & bóng chuyển động thời gian thực, băng ghế huấn luyện).
3. Nâng cấp `src/scene/BowlStands.tsx` (hiệu ứng sóng khán giả `InstancedMesh` và 24 tia dẫn hướng thoát hiểm 3D màu xanh lục).
4. Nâng cấp `src/scene/RoofStructure.tsx` (mái trượt trung tâm Oculus đóng/mở 0–100% và hệ thống 360 hạt pháo hoa Lễ Khai Mạc).
5. Nâng cấp `src/scene/Surroundings.tsx` (4 cầu đi bộ Skybridge và đài phun nước hồ Bắc–Nam).
6. Cập nhật `src/scene/StadiumScene.tsx`, `src/components/ControlPanel.tsx` (2 tab `Kỹ thuật & Mô phỏng` | `LoopForge SOP`, bảng màu `#141417` / `#0a0a0b` / `#26262b`), và `src/App.tsx`.

## 变更

- `src/config/stadiumSpecs.ts`: Thêm `StructuralMetrics`, `calculateStructuralMetrics`, `LOOPFORGE_SOP_NODES`.
- `src/config/stadiumSpecs.test.ts`: Bổ sung unit test cho thông số âm học, công suất điện và 7 SOP nodes.
- `src/scene/Pitch.tsx`: Bổ sung `AnimatedPlayersAndBall`, `TeamDugouts` và họa tiết Trống đồng tại tâm sân cỏ.
- `src/scene/BowlStands.tsx`: Bổ sung `crowdWave` animation và `EvacuationFlowPaths`.
- `src/scene/RoofStructure.tsx`: Bổ sung `RetractableOculusPanels` (0–100%) và `CeremonyFireworks`.
- `src/scene/Surroundings.tsx`: Bổ sung 4 cầu đi bộ Skybridge và các cột phun nước cảnh quan.
- `src/scene/StadiumScene.tsx`, `src/components/ControlPanel.tsx`, `src/App.tsx`: Kết nối toàn bộ trạng thái 3D và giao diện 2 tab chuẩn Grasp + Harness UI.

## 自审

- Đã kiểm tra TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, `strict: true`): không có biến dư thừa hoặc lỗi kiểu dữ liệu.
- Đảm bảo tương thích đồng thời chế độ Mặt cắt (`halfCutaway`) và X-Ray mái (`xrayRoof`) với hệ thống ghế khán giả và đèn pha.

## 测试

- `npm.cmd test`: 7/7 unit tests trong `src/config/stadiumSpecs.test.ts` pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công, tạo bundle sạch trong `dist/`.

## API 接口文档

无接口变动

## 剩余风险

无
