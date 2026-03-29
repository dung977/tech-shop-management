USE ShopManagement;

-- =========================================================================
-- 0. XÓA BẢNG CŨ (Phải xóa bảng con trước, bảng cha sau để không lỗi khóa ngoại)
-- =========================================================================
use ShopManagement
DROP TABLE IF EXISTS BillDetail;
DROP TABLE IF EXISTS Bill;
DROP TABLE IF EXISTS PurchaseOrderDetail;
DROP TABLE IF EXISTS PurchaseOrder;
DROP TABLE IF EXISTS Account;
DROP TABLE IF EXISTS ProductVariant;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Supplier;
DROP TABLE IF EXISTS Employee;
DROP TABLE IF EXISTS Customer;

GO
-- =========================================================================
-- 1. TẠO BẢNG (TABLES)
-- =========================================================================

-- Bảng Category (Danh mục)
CREATE TABLE Category (
    CategoryID VARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
);

-- Bảng Supplier (Nhà cung cấp)
CREATE TABLE Supplier (
    SupplierID VARCHAR(50) PRIMARY KEY,
    SupplierName NVARCHAR(100) NOT NULL,
    Address NVARCHAR(255),
    Phone VARCHAR(20),
    Email VARCHAR(100)
);

-- Bảng Employee (Nhân viên)
CREATE TABLE Employee (
    EmployeeID VARCHAR(50) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Role NVARCHAR(50)
);

-- Bảng Customer (Khách hàng)
CREATE TABLE Customer (
    CustomerID VARCHAR(50) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20) UNIQUE,
    Email VARCHAR(100),
    Address NVARCHAR(255)
);

-- Bảng Account (Tài khoản) - Đã liên kết với Employee và Customer
CREATE TABLE Account (
    AccountID VARCHAR(50) PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL, 
    Role VARCHAR(50),
    IsActive BIT DEFAULT 1,
    EmployeeID VARCHAR(50) FOREIGN KEY REFERENCES Employee(EmployeeID) NULL,
    CustomerID VARCHAR(50) FOREIGN KEY REFERENCES Customer(CustomerID) NULL
);

-- Bảng Product (Sản phẩm) - ĐÃ XÓA DESCRIPTION
CREATE TABLE Product (
    ProductID VARCHAR(50) PRIMARY KEY,
    ProductName NVARCHAR(150) NOT NULL,
    Brand NVARCHAR(50),
    Image VARCHAR(255),
    Information NVARCHAR(MAX), 
    Status VARCHAR(50),
    CategoryID VARCHAR(50) FOREIGN KEY REFERENCES Category(CategoryID)
);

-- Bảng ProductVariant (Biến thể sản phẩm)
CREATE TABLE ProductVariant (
    ProductVariantID VARCHAR(50) PRIMARY KEY,
    ProductID VARCHAR(50) FOREIGN KEY REFERENCES Product(ProductID),
    Color NVARCHAR(50),
    SellingPrice DECIMAL(18,2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    Description NVARCHAR(MAX) 
);

-- Bảng PurchaseOrder (Phiếu nhập hàng)
CREATE TABLE PurchaseOrder (
    PurchaseOrderID VARCHAR(50) PRIMARY KEY,
    SupplierID VARCHAR(50) FOREIGN KEY REFERENCES Supplier(SupplierID),
    EmployeeID VARCHAR(50) FOREIGN KEY REFERENCES Employee(EmployeeID),
    OrderDate DATETIME DEFAULT GETDATE(),
    Status VARCHAR(50)
);

-- Bảng PurchaseOrderDetail (Chi tiết phiếu nhập)
CREATE TABLE PurchaseOrderDetail (
    PurchaseOrderDetailID VARCHAR(50) PRIMARY KEY,
    PurchaseOrderID VARCHAR(50) FOREIGN KEY REFERENCES PurchaseOrder(PurchaseOrderID),
    ProductVariantID VARCHAR(50) FOREIGN KEY REFERENCES ProductVariant(ProductVariantID),
    NumOrder INT NOT NULL,
    ImportPrice DECIMAL(18,2) NOT NULL
);

-- Bảng Bill (Hóa đơn / Đơn hàng)
CREATE TABLE Bill (
    BillID VARCHAR(50) PRIMARY KEY,
    CustomerID VARCHAR(50) FOREIGN KEY REFERENCES Customer(CustomerID),
    EmployeeID VARCHAR(50) FOREIGN KEY REFERENCES Employee(EmployeeID),
    DateOrder DATETIME DEFAULT GETDATE(),
    TotalPrice DECIMAL(18,2) NOT NULL,
    PayMethod VARCHAR(50),
    Status VARCHAR(50)
);

-- Bảng BillDetail (Chi tiết hóa đơn)
CREATE TABLE BillDetail (
    BillDetailID VARCHAR(50) PRIMARY KEY,
    BillID VARCHAR(50) FOREIGN KEY REFERENCES Bill(BillID),
    ProductVariantID VARCHAR(50) FOREIGN KEY REFERENCES ProductVariant(ProductVariantID),
    Num INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL
);

-- =========================================================================
-- 2. INSERT DỮ LIỆU MẪU (5 DÒNG/BẢNG)
-- =========================================================================

-- Data Category
INSERT INTO Category (CategoryID, Name) VALUES 
('CAT01', N'Điện thoại'), 
('CAT02', N'Laptop'), 
('CAT03', N'Máy tính bảng'), 
('CAT04', N'Tai nghe'), 
('CAT05', N'Phụ kiện');

-- Data Supplier
INSERT INTO Supplier (SupplierID, SupplierName, Address, Phone, Email) VALUES 
('SUP01', N'Apple Việt Nam', N'Quận 1, TP HCM', '18001127', 'contact@apple.vn'),
('SUP02', N'Samsung Vina', N'Quận 1, TP HCM', '1800588889', 'info@samsung.com.vn'),
('SUP03', N'Synnex FPT', N'Cầu Giấy, Hà Nội', '02473006666', 'fpt@synnex.com'),
('SUP04', N'Digiworld', N'Quận 3, TP HCM', '02839290059', 'info@digiworld.com.vn'),
('SUP05', N'PETROSETCO', N'Bình Thạnh, TP HCM', '02838221666', 'contact@petrosetco.vn');

-- Data Employee
INSERT INTO Employee (EmployeeID, FullName, Phone, Email, Role) VALUES 
('EMP01', N'Trần Văn A', '0901234567', 'a.tran@shop.com', N'Quản lý'),
('EMP02', N'Nguyễn Thị B', '0912345678', 'b.nguyen@shop.com', N'Bán hàng'),
('EMP03', N'Lê Văn C', '0923456789', 'c.le@shop.com', N'Thủ kho'),
('EMP04', N'Phạm Thị D', '0934567890', 'd.pham@shop.com', N'Thu ngân'),
('EMP05', N'Hoàng Văn E', '0945678901', 'e.hoang@shop.com', N'Kỹ thuật');

-- Data Customer
INSERT INTO Customer (CustomerID, FullName, Phone, Email, Address) VALUES 
('CUS01', N'Vũ Đại Dương', '0988111222', 'duongvu@gmail.com', N'Đống Đa, Hà Nội'),
('CUS02', N'Đặng Mai Linh', '0977222333', 'linhdang@gmail.com', N'Hai Bà Trưng, Hà Nội'),
('CUS03', N'Lý Quang Huy', '0966333444', 'huyly@gmail.com', N'Hoàn Kiếm, Hà Nội'),
('CUS04', N'Bùi Thị Xuân', '0955444555', 'xuanbui@gmail.com', N'Tây Hồ, Hà Nội'),
('CUS05', N'Đỗ Đức Phát', '0944555666', 'phatdo@gmail.com', N'Cầu Giấy, Hà Nội');

-- Data Account (Mật khẩu '123' cho tất cả để test)
INSERT INTO Account (AccountID, Username, Password, Role, IsActive, EmployeeID, CustomerID) VALUES 
('ACC01', 'admin', '123', 'Admin', 1, 'EMP01', NULL),          
('ACC02', 'nhanvien_b', '123', 'Sales', 1, 'EMP02', NULL),       
('ACC03', 'khokho_c', '123', 'Inventory', 1, 'EMP03', NULL),     
('ACC04', 'khachhang_duong', '123', 'Customer', 1, NULL, 'CUS01'), 
('ACC05', 'khachhang_linh', '123', 'Customer', 1, NULL, 'CUS02');  

-- Data Product - ĐÃ XÓA DESCRIPTION
INSERT INTO Product (ProductID, ProductName, Brand, Image, Information, Status, CategoryID) VALUES 
('PROD01', N'iPhone 15 Pro Max', 'Apple', 'ip15pm.jpg', '{"CPU":"A17 Pro", "Screen":"6.7 inch OLED", "Camera":"48MP"}', 'Active', 'CAT01'),
('PROD02', N'Samsung Galaxy S24 Ultra', 'Samsung', 's24u.jpg', '{"CPU":"Snapdragon 8 Gen 3", "Screen":"6.8 inch Dynamic AMOLED", "Camera":"200MP"}', 'Active', 'CAT01'),
('PROD03', N'MacBook Pro 14 inch M3', 'Apple', 'macm3.jpg', '{"CPU":"Apple M3", "RAM":"16GB"}', 'Active', 'CAT02'),
('PROD04', N'iPad Pro 11 inch M4', 'Apple', 'ipadm4.jpg', '{"CPU":"Apple M4", "Screen":"11 inch OLED"}', 'Active', 'CAT03'),
('PROD05', N'AirPods Pro 2', 'Apple', 'airpods.jpg', '{"Type":"In-ear", "Battery":"6 hours"}', 'Active', 'CAT04');

-- Data ProductVariant - ĐÃ THÊM DESCRIPTION TỪ BẢNG PRODUCT SANG
-- Data ProductVariant - ĐÃ XÓA CAPACITY
INSERT INTO ProductVariant (ProductVariantID, ProductID, Color, SellingPrice, StockQuantity, Description) VALUES 
('VAR01', 'PROD01', N'Titan Tự Nhiên', 29500000, 15, N'Siêu phẩm Apple 2023'),
('VAR02', 'PROD01', N'Titan Đen', 35000000, 5, N'Siêu phẩm Apple 2023'),
('VAR03', 'PROD02', N'Xám Titan', 26000000, 20, N'Đỉnh cao AI'),
('VAR04', 'PROD03', N'Silver', 40000000, 8, N'Laptop đồ họa'),
('VAR05', 'PROD05', N'Trắng', 5500000, 50, N'Tai nghe chống ồn');
-- Data PurchaseOrder (Phiếu nhập)
INSERT INTO PurchaseOrder (PurchaseOrderID, SupplierID, EmployeeID, Status) VALUES 
('PO01', 'SUP01', 'EMP03', 'Completed'),
('PO02', 'SUP02', 'EMP03', 'Completed'),
('PO03', 'SUP03', 'EMP03', 'Pending Payment'),
('PO04', 'SUP01', 'EMP01', 'Shipping'),
('PO05', 'SUP04', 'EMP03', 'Draft');

-- Data PurchaseOrderDetail
INSERT INTO PurchaseOrderDetail (PurchaseOrderDetailID, PurchaseOrderID, ProductVariantID, NumOrder, ImportPrice) VALUES 
('POD01', 'PO01', 'VAR01', 20, 27500000), 
('POD02', 'PO01', 'VAR02', 10, 32000000), 
('POD03', 'PO02', 'VAR03', 30, 24000000),
('POD04', 'PO03', 'VAR04', 15, 37000000),
('POD05', 'PO04', 'VAR05', 100, 4800000);

-- Data Bill (Đơn hàng)
INSERT INTO Bill (BillID, CustomerID, EmployeeID, TotalPrice, PayMethod, Status) VALUES 
('BILL01', 'CUS01', 'EMP02', 29500000, 'Bank Transfer', 'Completed'),
('BILL02', 'CUS02', 'EMP02', 61000000, 'Cash', 'Completed'),
('BILL03', 'CUS03', 'EMP04', 26000000, 'Credit Card', 'Shipping'),
('BILL04', 'CUS04', 'EMP02', 5500000, 'Bank Transfer', 'Completed'),
('BILL05', 'CUS05', 'EMP04', 40000000, 'Installment', 'Pending');

-- Data BillDetail (Chi tiết hóa đơn)
INSERT INTO BillDetail (BillDetailID, BillID, ProductVariantID, Num, Price) VALUES 
('BD01', 'BILL01', 'VAR01', 1, 29500000), 
('BD02', 'BILL02', 'VAR02', 1, 35000000), 
('BD03', 'BILL02', 'VAR03', 1, 26000000),
('BD04', 'BILL03', 'VAR03', 1, 26000000),
('BD05', 'BILL04', 'VAR05', 1, 5500000);
-- Thêm 10 nhân viên mới cho bảng Employee
INSERT INTO Employee (EmployeeID, FullName, Phone, Email, Role) VALUES 
('EMP06', N'Nguyễn Văn Bình', '0956789012', 'binh.nguyen@shop.com', N'Bán hàng'),
('EMP07', N'Trần Thị Hoa', '0967890123', 'hoa.tran@shop.com', N'Thu ngân'),
('EMP08', N'Lý Hải Nam', '0978901234', 'nam.ly@shop.com', N'Thủ kho'),
('EMP09', N'Đặng Minh Tuấn', '0989012345', 'tuan.dang@shop.com', N'Kỹ thuật'),
('EMP10', N'Bùi Phương Thảo', '0990123456', 'thao.bui@shop.com', N'Chăm sóc khách hàng'),
('EMP11', N'Vũ Hoàng Long', '0909123456', 'long.vu@shop.com', N'Bán hàng'),
('EMP12', N'Phạm Bảo Anh', '0919234567', 'anh.pham@shop.com', N'Marketing'),
('EMP13', N'Đỗ Thùy Chi', '0929345678', 'chi.do@shop.com', N'Kế toán'),
('EMP14', N'Ngô Tiến Dũng', '0939456789', 'dung.ngo@shop.com', N'Bảo vệ'),
('EMP15', N'Trương Gia Bình', '0949567890', 'binh.truong@shop.com', N'Quản lý');
select * from Customer;
-- Thêm 10 khách hàng mới cho bảng Customer
-- Bản sửa lỗi: Thêm 10 khách hàng với số điện thoại không trùng lặp
INSERT INTO Customer (CustomerID, FullName, Phone, Email, Address) VALUES 
('CUS06', N'Nguyễn Hoàng Nam', '0911222331', 'nam.hoang@gmail.com', N'Thanh Xuân, Hà Nội'),
('CUS07', N'Trần Thu Hà', '0922333442', 'ha.tran88@gmail.com', N'Ba Đình, Hà Nội'),
('CUS08', N'Lê Minh Triết', '0933444553', 'triet.le@outlook.com', N'Long Biên, Hà Nội'),
('CUS09', N'Phạm Thùy Dương', '0944555664', 'duong.pham@yahoo.com', N'Nam Từ Liêm, Hà Nội'),
('CUS10', N'Hoàng Quốc Trung', '0955666775', 'trung.hq@gmail.com', N'Bắc Từ Liêm, Hà Nội'),
('CUS11', N'Vũ Phương Anh', '0966777886', 'anhvp.student@utc.edu.vn', N'Cầu Giấy, Hà Nội'),
('CUS12', N'Đỗ Kim Chi', '0977888997', 'chi.do@gmail.com', N'Hoàng Mai, Hà Nội'),
('CUS13', N'Trương Công Vinh', '0988999008', 'vinh.truong@gmail.com', N'Hà Đông, Hà Nội'),
('CUS14', N'Phan Thanh Bình', '0912999119', 'binh.pt@gmail.com', N'Tây Hồ, Hà Nội'),
('CUS15', N'Ngô Bảo Châu', '0913888220', 'chau.ngo@gmail.com', N'Hai Bà Trưng, Hà Nội');