-- CREATE DATABASE ShopManagement;
USE ShopManagement;
GO

-- =========================================================================
-- 0. XÓA BẢNG CŨ (Theo thứ tự ưu tiên khóa ngoại)
-- =========================================================================
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
-- 1. TẠO BẢNG (TABLES) - ĐÃ GỘP CÁC LỆNH ALTER
-- =========================================================================

CREATE TABLE Category (
    CategoryID VARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    IsDeleted BIT DEFAULT 0
);

CREATE TABLE Supplier (
    SupplierID VARCHAR(50) PRIMARY KEY,
    SupplierName NVARCHAR(100) NOT NULL,
    Address NVARCHAR(255),
    Phone VARCHAR(20),
    Email VARCHAR(100),
    IsDeleted BIT DEFAULT 0
);

CREATE TABLE Employee (
    EmployeeID VARCHAR(50) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Role NVARCHAR(50),
    IsDeleted BIT DEFAULT 0
);

CREATE TABLE Customer (
    CustomerID VARCHAR(50) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20) UNIQUE,
    Email VARCHAR(100),
    Address NVARCHAR(255),
    IsDeleted BIT DEFAULT 0
);

CREATE TABLE Account (
    AccountID VARCHAR(50) PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL, 
    Role VARCHAR(50),
    IsActive BIT DEFAULT 1,
    EmployeeID VARCHAR(50) FOREIGN KEY REFERENCES Employee(EmployeeID) NULL,
    CustomerID VARCHAR(50) FOREIGN KEY REFERENCES Customer(CustomerID) NULL,
    IsDeleted BIT DEFAULT 0
);

CREATE TABLE Product (
    ProductID VARCHAR(50) PRIMARY KEY,
    ProductName NVARCHAR(150) NOT NULL,
    Brand NVARCHAR(50),
    Images NVARCHAR(MAX),
    Information NVARCHAR(MAX), 
    CategoryID VARCHAR(50) FOREIGN KEY REFERENCES Category(CategoryID)
);

CREATE TABLE ProductVariant (
    ProductVariantID VARCHAR(50) PRIMARY KEY,
    ProductID VARCHAR(50) FOREIGN KEY REFERENCES Product(ProductID),
    Color NVARCHAR(50),
    SellingPrice DECIMAL(18,2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    Description NVARCHAR(MAX),
    Image NVARCHAR(255),
    Status VARCHAR(20) DEFAULT 'New',
    IsDeleted BIT DEFAULT 0
);

CREATE TABLE PurchaseOrder (
    PurchaseOrderID VARCHAR(50) PRIMARY KEY,
    SupplierID VARCHAR(50) FOREIGN KEY REFERENCES Supplier(SupplierID),
    EmployeeID VARCHAR(50) FOREIGN KEY REFERENCES Employee(EmployeeID),
    OrderDate DATETIME DEFAULT GETDATE(),
    Status VARCHAR(50)
);

CREATE TABLE PurchaseOrderDetail (
    PurchaseOrderDetailID VARCHAR(50) PRIMARY KEY,
    PurchaseOrderID VARCHAR(50) FOREIGN KEY REFERENCES PurchaseOrder(PurchaseOrderID),
    ProductVariantID VARCHAR(50) FOREIGN KEY REFERENCES ProductVariant(ProductVariantID),
    NumOrder INT NOT NULL,
    ImportPrice DECIMAL(18,2) NOT NULL
);

CREATE TABLE Bill (
    BillID VARCHAR(50) PRIMARY KEY,
    CustomerID VARCHAR(50) FOREIGN KEY REFERENCES Customer(CustomerID),
    EmployeeID VARCHAR(50) FOREIGN KEY REFERENCES Employee(EmployeeID),
    DateOrder DATETIME DEFAULT GETDATE(),
    TotalPrice DECIMAL(18,2) NOT NULL,
    PayMethod VARCHAR(50),
    Status VARCHAR(50)
);

CREATE TABLE BillDetail (
    BillDetailID VARCHAR(50) PRIMARY KEY,
    BillID VARCHAR(50) FOREIGN KEY REFERENCES Bill(BillID),
    ProductVariantID VARCHAR(50) FOREIGN KEY REFERENCES ProductVariant(ProductVariantID),
    Num INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL
);
GO
