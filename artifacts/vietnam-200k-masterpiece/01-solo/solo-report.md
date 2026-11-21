<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K National Complex (Investor Masterplan & Equilibrium BIM)

## 范围

Hoàn thiện đồ án tổng thể Khu Liên hợp Thể thao Quốc gia 200.000 chỗ ngồi tại `d:\chaybo` đạt tiêu chuẩn trình Chủ đầu tư: giải quyết triệt để bài toán cân bằng lực kết cấu (`ΣM = 0`), bài toán giao thông tiếp cận/thoát hiểm cho 200.000 khán giả và quy hoạch 5 khu phức hợp dịch vụ đi kèm trên khu đất `1000m × 1000m`.

## 计划

1. Mở rộng `src/config/stadiumSpecs.ts` & `src/config/stadiumSpecs.test.ts` với thông số `MASTERPLAN_ZONES`, camera `Quy hoạch` (`[385, 225, 375]`), thông số đôi vòm thép `390m / 124m`, `24` tháp dây văng và `8` tháp xoắn ốc.
2. Nâng cấp `src/scene/BowlStands.tsx`: bổ sung chân chống xiên chữ A (`Inclined Buttress Struts`) cho 48 mố trụ `Grid E`, lấp đầy gầm khán đài bằng `ConcourseServiceVolumes` (F&B, VIP Lounge, phòng thay đồ, MEP), và dựng **8 Tháp đường dốc xoắn ốc (`HelicalRampTowers`)** nối vào các tầng `+10.5m, +18m, +33m, +53m`.
3. Nâng cấp `src/scene/RoofStructure.tsx`: dựng **24 Cột tháp dây văng (`CableStayedPylonSystem`)** với cáp treo trước & cáp neo đối trọng xuống 24 mố neo bê tông (`r=196m`), và **Đôi Vòm Thép Giàn Không Gian Siêu Trường (`TwinMegaArches`, nhịp 390m, cao 124m)**.
4. Nâng cấp `src/scene/Surroundings.tsx`: dựng Khối đế Thương mại 2 tầng (`36` cổng soát vé + Quảng trường trên cao `+10.5m`), **8 Cầu thang đại sảnh**, **Nhà ga Metro + Cầu vượt Skywalk**, **Tháp đôi Khách sạn 5★ + IBC**, **Nhà thi đấu 15K + Cung dưới nước**, và **Sân tập FIFA + 4 Nhà để xe 5 tầng**.
5. Cập nhật `src/components/ControlPanel.tsx` (3 tab `Kết cấu` | `5 Khu Dịch vụ` | `DevFlow SOP`), `src/scene/StadiumScene.tsx` và `src/App.tsx`.

## 变更

- `src/config/stadiumSpecs.ts` & `src/config/stadiumSpecs.test.ts`: Thêm `MASTERPLAN_ZONES`, preset `masterplan` và 9/9 unit tests.
- `src/scene/BowlStands.tsx`: Thêm chân chống xiên chữ A, `serviceVolumes` dưới gầm khán đài và `HelicalRampTowers`.
- `src/scene/RoofStructure.tsx`: Thêm `CableStayedPylonSystem` và `TwinMegaArches`.
- `src/scene/Surroundings.tsx`: Thêm `CommercialPodium`, `GrandApproachStaircases` và `ServiceComplexBuildings` (5 phân khu phức hợp).
- `src/components/ControlPanel.tsx`, `src/scene/StadiumScene.tsx`, `src/App.tsx`: Thêm tab `5 Khu Dịch vụ`, mở rộng tầm nhìn `1000m × 1000m` và mặc định góc `Quy hoạch`.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi, 0 cảnh báo.
- Toàn bộ kết cấu chịu lực bảo đảm nguyên lý cân bằng mô-men: mái công-xôn 100m được treo đồng thời bởi 24 tháp dây văng có mố neo đối trọng sau và đôi vòm thép 390m, đặt trên 48 mố trụ vách cứng chữ A.

## 测试

- `npm.cmd test`: 9/9 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công.

## API 接口文档

无接口变动

## 剩余风险

无
