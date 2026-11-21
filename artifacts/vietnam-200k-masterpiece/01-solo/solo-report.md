<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Stadium Architectural Overhaul

## 范围

Tái thiết kế toàn diện kiến trúc 3D của `d:\chaybo` (Vietnam 200K Stadium) theo chuẩn sân vận động quốc gia thế hệ mới kết hợp bản sắc Trống đồng Đông Sơn, sử dụng hoàn toàn biên dạng Super-Ellipse ôm sát mặt sân bóng đá, vỏ bao mặt dựng kiến trúc hoàn chỉnh và quy hoạch tổng mặt bằng đô thị.

## 计划

1. Thêm hàm `superEllipsePoint(angle, rx, rz, power=2.4)` trong `src/config/stadiumSpecs.ts` & unit test trong `src/config/stadiumSpecs.test.ts`.
2. Xây dựng lại `src/scene/BowlStands.tsx`: 4 tầng khán đài bậc thang thật + texture ghế chi tiết (36 lối cầu thang bộ + cửa hầm vomitory), sàn hành lang bê tông ngang, lan can kính an toàn, màn hình LED 360° Halo Video Board treo dưới vành căng trong và chế độ cắt góc 90°.
3. Xây dựng lại `src/scene/RoofStructure.tsx`: vách kính mặt dựng đa tầng phát sáng bên trong, vỏ lưới thép vàng đồng Trống đồng (`diagCw`/`diagCcw`), vành nén ngoài / vành căng trong và mái trượt Oculus cong.
4. Xây dựng lại `src/scene/Surroundings.tsx`: khối đế granite 3 cấp tam cấp, texture tổng mặt bằng `2048×2048` (quảng trường Trống đồng, 4 đại lộ, đường vành đai 6 làn xe), cây tán tròn 2 tầng và 48 cột đèn quảng trường.
5. Bổ sung bầu trời gradient `SkyDome` và `ACESFilmicToneMapping` trong `src/scene/StadiumScene.tsx`.

## 变更

- `src/config/stadiumSpecs.ts` & `src/config/stadiumSpecs.test.ts`: Bổ sung `superEllipsePoint` và 8/8 unit tests.
- `src/scene/BowlStands.tsx`: Bậc thang hình học, `createSeatingBowlTexture`, `createConcourseSlabGeometry`, `HaloLedRing` 360°, cắt góc 90° (`startAngle = 0.52π .. 1.98π`).
- `src/scene/RoofStructure.tsx`: `createCurtainWallTexture`, `createCurtainWallGeometry`, 48 vì kèo & hệ lưới vàng đồng `diagCw`/`diagCcw`, 3 vành thép nén/căng.
- `src/scene/Surroundings.tsx`: `createPlinthTerraceGeometry`, `createMasterplanGroundTexture`, `LushBoulevardLandscaping`.
- `src/scene/StadiumScene.tsx`: `SkyDome` shader & `ACESFilmicToneMapping`.

## 自审

- Kiểm tra strict TypeScript (`tsc -b`): 0 lỗi, 0 cảnh báo.
- Toàn bộ hình học khán đài, mặt dựng ngoài, mái vòm và khối đế granite dùng chung `superEllipsePoint` nên khớp khít 100%, không hở hay lơ lửng.

## 测试

- `npm.cmd test`: 8/8 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công.

## API 接口文档

无接口变动

## 剩余风险

无
