<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Stadium Masterpiece 3D & Structural Physics Remediation

## 范围

Nâng cấp dự án `d:\chaybo` (Vietnam 200K Stadium 3D) tận dụng tối đa hệ thống LoopForge DevFlow và bộ ngôn ngữ thiết kế Grasp + Harness UI trong `d:\LoopForge-main\design.md`, đồng thời khắc phục toàn bộ các điểm phi vật lý về kết cấu đỡ 3D. Phạm vi giới hạn trong `src/config/*`, `src/scene/*`, `src/components/*` và `src/App.tsx`.

## 计划

1. Mở rộng `src/config/stadiumSpecs.ts` & `src/config/stadiumSpecs.test.ts` với công thức âm học (`dB`), điện năng (`MW`), trọng lượng thép mái (`28,500 tấn`) và danh sách 7 node LoopForge SOP.
2. Khép kín tiết diện 4 tầng khán đài, thêm 36 khung cột trụ bê tông & dầm nghiêng (`StructuralSupportBents`), giàn thép treo Jumbotron (`JumbotronRig`), sóng khán giả và tuyến thoát hiểm bám sát mặt sàn/cầu dẫn trong `src/scene/BowlStands.tsx`.
3. Bổ sung 24 bệ móng bê tông, ray trượt thép và 2 nửa vòm cong Oculus trượt gọn dưới mái chính trong `src/scene/RoofStructure.tsx`.
4. Bổ sung cột trụ đỡ và đường dốc dẫn xuống quảng trường cho 4 cầu đi bộ Skybridge trong `src/scene/Surroundings.tsx`.
5. Thêm `hemisphereLight` tán xạ bầu trời trong `src/scene/StadiumScene.tsx`, tối ưu quỹ đạo bóng sát mặt cỏ trong `src/scene/Pitch.tsx` và tắt mặc định pháo hoa ban ngày trong `src/App.tsx`.

## 变更

- `src/config/stadiumSpecs.ts` & `src/config/stadiumSpecs.test.ts`: Thêm `StructuralMetrics`, `calculateStructuralMetrics`, `LOOPFORGE_SOP_NODES` và unit tests.
- `src/scene/BowlStands.tsx`: Khép kín tiết diện 4 tầng (mặt ghế + vách hậu + sàn đáy), bổ sung `StructuralSupportBents` (36 khung cột trụ & dầm nghiêng), `JumbotronRig` (giàn treo thép nối lên mái), `CrowdInstances` (sóng khán giả) và `EvacuationFlowPaths` (bám sàn & cầu dốc).
- `src/scene/RoofStructure.tsx`: Bổ sung `ButtressFoundations` chạm đất `y=0`, ray trượt thép và `RetractableOculusPanels` cong khép gọn dưới tán mái.
- `src/scene/Surroundings.tsx`: Bổ sung `GroundedSkybridge` với trụ đỡ bê tông và đường dốc dẫn nối từ Tầng 2 xuống quảng trường.
- `src/scene/Pitch.tsx`, `src/scene/StadiumScene.tsx`, `src/components/ControlPanel.tsx`, `src/App.tsx`: Thêm `hemisphereLight`, hoàn thiện bóng lăn sát cỏ và giao diện 2 tab chuẩn Grasp + Harness UI.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi, 0 biến dư thừa.
- Đã kiểm tra tính liên kết vật lý: 100% khán đài, mái vòm, cầu đi bộ và bảng điện tử đều có kết cấu chịu lực gắn liền xuống móng hoặc treo lên khung giàn mái.

## 测试

- `npm.cmd test`: 7/7 unit tests trong `src/config/stadiumSpecs.test.ts` pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công, tạo bundle sạch trong `dist/`.

## API 接口文档

无接口变动

## 剩余风险

无
