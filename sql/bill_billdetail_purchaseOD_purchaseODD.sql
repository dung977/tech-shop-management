USE DuLieu;

GO

-- ==========================================
-- 1. THÊM DỮ LIỆU HÓA ĐƠN (BILL) - Đã chuẩn hóa Tiếng Anh
-- ==========================================
INSERT INTO Bill (BillID, CustomerID, EmployeeID, DateOrder, TotalPrice, PayMethod, Status) VALUES 
('BILL01', 'CUS01', 'EMP02', '2026-03-25 10:15:00', 15340000.00, 'Cash', 'Completed'),
('BILL02', 'CUS05', 'EMP04', '2026-03-26 14:30:00', 6588000.00, 'Bank Transfer', 'Completed'),
('BILL03', 'CUS10', 'EMP07', '2026-04-01 09:00:00', 3900000.00, 'Credit Card', 'Processing'),
('BILL04', 'CUS12', 'EMP11', '2026-04-02 16:45:00', 1180000.00, 'Cash', 'Completed'),
('BILL05', 'CUS15', 'EMP02', '2026-04-03 11:20:00', 2250000.00, 'Bank Transfer', 'Cancelled');
GO

-- ==========================================
-- 2. THÊM CHI TIẾT HÓA ĐƠN (BILL DETAIL)
-- ==========================================
INSERT INTO BillDetail (BillDetailID, BillID, ProductVariantID, Num, Price) VALUES 
('BD01', 'BILL01', 'VAR1', 1, 14990000.00),
('BD02', 'BILL01', 'VAR7', 1, 350000.00),
('BD03', 'BILL02', 'VAR6', 2, 3294000.00),
('BD04', 'BILL03', 'VAR11', 1, 3900000.00),
('BD05', 'BILL04', 'VAR18', 2, 590000.00),
('BD06', 'BILL05', 'VAR54', 1, 2250000.00);
GO

-- ==========================================
-- 1. THÊM DỮ LIỆU ĐƠN NHẬP HÀNG (PURCHASE ORDER)
-- ==========================================
-- Ghi chú Status: Completed (Hoàn thành), Processing (Đang xử lý), Cancelled (Đã hủy)
INSERT INTO PurchaseOrder (PurchaseOrderID, SupplierID, EmployeeID, OrderDate, Status) VALUES 
('PO01', 'SUP01', 'EMP03', '2026-03-20 08:30:00', 'Completed'),
('PO02', 'SUP02', 'EMP08', '2026-03-22 10:00:00', 'Completed'),
('PO03', 'SUP04', 'EMP03', '2026-04-01 14:15:00', 'Processing'),
('PO04', 'SUP03', 'EMP08', '2026-04-02 09:45:00', 'Processing'),
('PO05', 'SUP05', 'EMP03', '2026-04-03 15:20:00', 'Cancelled');
GO

-- ==========================================
-- 2. THÊM CHI TIẾT ĐƠN NHẬP HÀNG (PURCHASE ORDER DETAIL)
-- ==========================================
INSERT INTO PurchaseOrderDetail (PurchaseOrderDetailID, PurchaseOrderID, ProductVariantID, NumOrder, ImportPrice) VALUES 
-- Chi tiết PO01: Nhập hàng từ Apple Việt Nam
('POD01', 'PO01', 'VAR1', 50, 12000000.00), -- Nhập 50 AirPods Max 2
('POD02', 'PO01', 'VAR11', 100, 2500000.00), -- Nhập 100 Bao da iPad

-- Chi tiết PO02: Nhập hàng từ Samsung Vina
('POD03', 'PO02', 'VAR295', 20, 100000000.00), -- Nhập 20 cái màn hình Samsung OLED 

-- Chi tiết PO03: Nhập phụ kiện từ Digiworld
('POD04', 'PO03', 'VAR18', 30, 400000.00), -- Nhập 30 Bàn phím cơ E-Dra
('POD05', 'PO03', 'VAR61', 50, 100000.00), -- Nhập 50 Chuột Xiaomi

-- Chi tiết PO04: Nhập laptop từ Synnex FPT
('POD06', 'PO04', 'VAR278', 10, 35000000.00), -- Nhập 10 máy Macbook

-- Chi tiết PO05: Đơn bị hủy từ PETROSETCO
('POD07', 'PO05', 'VAR75', 15, 600000.00);
GO