USE ShopManagement;

-- 2. BƯỚC THÊM MỚI: Thêm dữ liệu Hóa đơn bán hàng
INSERT INTO Bill (BillID, CustomerID, EmployeeID, DateOrder, TotalPrice, PayMethod, Status) VALUES 
('BILL01', 'CUS01', 'EMP02', '2026-03-25 10:15:00', 15339000.00, 'Cash', 'Completed'),
('BILL02', 'CUS05', 'EMP04', '2026-03-26 14:30:00', 6588000.00, 'Bank Transfer', 'Completed'),
('BILL03', 'CUS10', 'EMP07', '2026-04-01 09:00:00', 3900000.00, 'Credit Card', 'Processing'),
('BILL04', 'CUS12', 'EMP11', '2026-04-02 16:45:00', 1180000.00, 'Cash', 'Completed'),
('BILL05', 'CUS15', 'EMP02', '2026-04-03 11:20:00', 160000.00, 'Bank Transfer', 'Cancelled');
GO

INSERT INTO BillDetail (BillDetailID, BillID, ProductVariantID, Num, Price) VALUES 
('BD01', 'BILL01', 'VAR1', 1, 14990000.00), 
('BD02', 'BILL01', 'VAR7', 1, 349000.00),   
('BD03', 'BILL02', 'VAR6', 2, 3294000.00),  
('BD04', 'BILL03', 'VAR11', 1, 3900000.00), 
('BD05', 'BILL04', 'VAR18', 2, 590000.00),  
('BD06', 'BILL05', 'VAR75', 1, 160000.00);  
GO

-- 3. BƯỚC THÊM MỚI: Thêm dữ liệu Đơn nhập hàng
INSERT INTO PurchaseOrder (PurchaseOrderID, SupplierID, EmployeeID, OrderDate, Status) VALUES 
('PO01', 'SUP01', 'EMP03', '2026-03-20 08:30:00', 'Completed'),
('PO02', 'SUP02', 'EMP08', '2026-03-22 10:00:00', 'Completed'),
('PO03', 'SUP04', 'EMP03', '2026-04-01 14:15:00', 'Processing'),
('PO04', 'SUP03', 'EMP08', '2026-04-02 09:45:00', 'Processing'),
('PO05', 'SUP05', 'EMP03', '2026-04-03 15:20:00', 'Cancelled');
GO

INSERT INTO PurchaseOrderDetail (PurchaseOrderDetailID, PurchaseOrderID, ProductVariantID, NumOrder, ImportPrice) VALUES 
('POD01', 'PO01', 'VAR1', 50, 12000000.00), 
('POD02', 'PO01', 'VAR11', 100, 2500000.00), 
('POD03', 'PO02', 'VAR144', 20, 4500000.00), 
('POD04', 'PO03', 'VAR18', 30, 400000.00), 
('POD05', 'PO03', 'VAR61', 50, 150000.00), 
('POD06', 'PO04', 'VAR285', 10, 35000000.00), 
('POD07', 'PO05', 'VAR75', 15, 100000.00); 
GO