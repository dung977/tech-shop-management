// ==========================================
// CÁC BIẾN TOÀN CỤC CHO PHÂN TRANG
// ==========================================
let currentOrderData = [];
let currentOrderPage = 1;
const orderRowsPerPage = 5; // Số dòng trên 1 trang 

document.addEventListener("DOMContentLoaded", function () {
    loadPurchaseOrders();
});

// ==========================================
// 1. TẢI DỮ LIỆU TỪ FLASK
// ==========================================
function loadPurchaseOrders() {

    fetch('http://127.0.0.1:5000/purchase_orders/getall')
        .then(res => {
            if (!res.ok) throw new Error("Lỗi 404: Kiểm tra lại url_prefix trong app.py của Flask!");
            return res.json();
        })
        .then(data => {
            if (data.message && data.message.includes("Can't get")) {
                document.getElementById('purchaseOrderTableBody').innerHTML = `<tr><td colspan="7" class="text-center text-muted">${data.message}</td></tr>`;
            } else {
                currentOrderData = data;
                currentOrderPage = 1; // Reset về trang 1 mỗi khi load lại
                renderOrderTable();
            }
        })
        .catch(err => {
            document.getElementById('purchaseOrderTableBody').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi Backend: ${err.message}</td></tr>`;
        });
}

// ==========================================
// 2. VẼ BẢNG + CẮT DỮ LIỆU THEO TRANG
// ==========================================
function renderOrderTable() {
    const tbody = document.getElementById('purchaseOrderTableBody');

    if (!currentOrderData || currentOrderData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i>Chưa có phiếu nhập nào.</i></td></tr>`;
        document.querySelector('.pagination').innerHTML = '';
        return;
    }

    // Tính toán cắt mảng dữ liệu cho trang hiện tại
    let startIndex = (currentOrderPage - 1) * orderRowsPerPage;
    let endIndex = startIndex + orderRowsPerPage;
    let paginatedData = currentOrderData.slice(startIndex, endIndex);

    // Vẽ các dòng của trang hiện tại
    tbody.innerHTML = paginatedData.map(po => {
        let badgeClass = "bg-primary";
        if (po.Status === "Completed") badgeClass = "bg-success";
        else if (po.Status === "Pending Payment") badgeClass = "bg-warning text-dark";
        else if (po.Status === "Draft") badgeClass = "bg-secondary";
        else if (po.Status === "Shipping") badgeClass = "bg-info";

        let actionButtons = `
           <button class="btn btn-sm btn-light text-primary me-1" title="Xem chi tiết" onclick="viewOrderDetail('${po.PurchaseOrderID}')">
                <i class="fas fa-eye"></i>
           </button>
            <button class="btn btn-sm btn-light text-primary me-1" title="In phiếu"><i class="fas fa-print"></i></button>
        `;

        if (po.Status === "Draft") {
            actionButtons += `<button class="btn btn-sm btn-light text-danger" title="Xóa nháp"><i class="fas fa-trash"></i></button>`;
        }

        
        let dateDisplay = 'Đang cập nhật';
        if (po.OrderDate) {
            let d = new Date(po.OrderDate);
            dateDisplay = d.toLocaleDateString('vi-VN');
        }

        return `
        <tr>
            <td class="ps-3"><input type="checkbox" class="form-check-input"></td>
            <td><strong>${po.PurchaseOrderID}</strong></td>
            <td>${po.SupplierName || po.SupplierID}</td> 
            <td>${po.EmployeeName || po.EmployeeID}</td>
            <td>${dateDisplay}</td>
            <td class="text-center">
                <span class="badge ${badgeClass} rounded-pill px-3 py-2">${po.Status}</span>
            </td>
            <td class="text-center pe-3">
                ${actionButtons}
            </td>
        </tr>`;
    }).join('');

    // Gọi hàm vẽ nút phân trang
    renderOrderPagination();
}

// ==========================================
// 3. VẼ CÁC NÚT PHÂN TRANG (Trước 1 2 3 Sau)
// ==========================================
function renderOrderPagination() {
    let totalPages = Math.ceil(currentOrderData.length / orderRowsPerPage);
    let paginationContainer = document.querySelector('.pagination');
    let html = '';

    // Ẩn phân trang nếu chỉ có 1 trang
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    // Nút "Trước"
    html += `<li class="page-item ${currentOrderPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeOrderPage(event, ${currentOrderPage - 1})">Trước</a>
             </li>`;

    // Vòng lặp vẽ các số 1, 2, 3...
    for (let i = 1; i <= totalPages; i++) {
        let activeStyle = currentOrderPage === i ? 'style="background-color: #1b45cf; border-color: #1b45cf; color: white;"' : '';
        html += `<li class="page-item ${currentOrderPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changeOrderPage(event, ${i})" ${activeStyle}>${i}</a>
                 </li>`;
    }

    // Nút "Sau"
    html += `<li class="page-item ${currentOrderPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeOrderPage(event, ${currentOrderPage + 1})">Sau</a>
             </li>`;

    paginationContainer.innerHTML = html;
}

// ==========================================
// 4. SỰ KIỆN KHI BẤM CHUYỂN TRANG
// ==========================================
function changeOrderPage(e, page) {
    e.preventDefault(); // Ngăn web bị giật lên đầu trang khi bấm
    let totalPages = Math.ceil(currentOrderData.length / orderRowsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentOrderPage = page;
        renderOrderTable(); // Vẽ lại bảng với dữ liệu của trang mới
    }
}

// ==========================================
// MỞ FORM THÊM PHIẾU NHẬP
// ==========================================
function openAddOrderModal() {
    document.getElementById('addSupplierID').value = '';
    document.getElementById('addEmployeeID').value = '';
    document.getElementById('orderDetailArea').innerHTML = '';
    addDetailRow(); // Mặc định có sẵn 1 dòng trống
    new bootstrap.Modal(document.getElementById('addOrderModal')).show();
}

function addDetailRow() {
    const id = Date.now();
    const html = `
        <div class="row g-2 mb-2 detail-row align-items-center" id="row-${id}">
            <div class="col-md-4">
                <input type="text" class="form-control d-var-id" placeholder="Mã biến thể (VD: VAR1)" required>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control d-num" placeholder="Số lượng" min="1" required>
            </div>
            <div class="col-md-4">
                <input type="number" class="form-control d-price" placeholder="Giá nhập (VNĐ)" min="0" required>
            </div>
            <div class="col-md-1 text-end">
                <button class="btn btn-outline-danger" onclick="document.getElementById('row-${id}').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    document.getElementById('orderDetailArea').insertAdjacentHTML('beforeend', html);
}

// ==========================================
// LƯU PHIẾU NHẬP VÀ CÁC CHI TIẾT (LƯU GỘP)
// ==========================================
async function submitFullOrder() {
    const supplierId = document.getElementById('addSupplierID').value.trim();
    const employeeId = document.getElementById('addEmployeeID').value.trim();

    if (!supplierId || !employeeId) {
        alert("Vui lòng nhập Mã Nhà cung cấp và Nhân viên!"); return;
    }

    // 1. Gom dữ liệu các dòng chi tiết
    const rows = document.querySelectorAll('.detail-row');
    if (rows.length === 0) {
        alert("Phải có ít nhất 1 sản phẩm nhập!"); return;
    }

    let details = [];
    let isValid = true;
    rows.forEach(row => {
        const vId = row.querySelector('.d-var-id').value.trim();
        const num = row.querySelector('.d-num').value;
        const price = row.querySelector('.d-price').value;
        if (!vId || !num || !price) isValid = false;
        details.push({ ProductVariantID: vId, NumOrder: parseInt(num), ImportPrice: parseFloat(price) });
    });

    if (!isValid) {
        alert("Vui lòng điền đầy đủ Mã biến thể, Số lượng và Giá nhập cho tất cả các dòng!"); return;
    }

    try {
        // 2. Gọi API Tạo Phiếu Nhập Cha
        const poRes = await fetch('http://127.0.0.1:5000/purchase_orders/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ SupplierID: supplierId, EmployeeID: employeeId, Status: 'Draft' })
        });

        const poData = await poRes.json();
        if (!poRes.ok) throw new Error(poData.message || "Lỗi tạo phiếu nhập");

        // Lấy mã PO vừa tạo (Nhờ bước 1 sửa Backend)
        const newPoId = poData.PurchaseOrderID;
        if (!newPoId) throw new Error("Backend chưa trả về PurchaseOrderID!");

        // 3. Vòng lặp gọi API Lưu từng dòng Chi tiết
        for (const item of details) {
            item.PurchaseOrderID = newPoId; // Gắn ID cha vào
            const detRes = await fetch('http://127.0.0.1:5000/purchase_order_details/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!detRes.ok) {
                console.error("Lỗi dòng chi tiết:", item);
            }
        }

        alert("Tạo phiếu nhập và chi tiết thành công!");
        location.reload(); // Tải lại trang để thấy dữ liệu mới

    } catch (err) {
        alert("Lỗi: " + err.message);
    }
}

// ==========================================
// XEM CHI TIẾT MỘT PHIẾU NHẬP
// ==========================================
function viewOrderDetail(poId) {
    fetch(`http://127.0.0.1:5000/purchase_orders/${poId}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('detailPoId').innerText = poId;
            const tbody = document.getElementById('detailOrderTableBody');

            // API trả về lỗi hoặc mảng rỗng
            if (data.message || !Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Không có dữ liệu chi tiết.</td></tr>`;
            } else {
                tbody.innerHTML = data.map(d => {
                    const thanhTien = (d.NumOrder * d.ImportPrice).toLocaleString('vi-VN');
                    const giaNhap = parseFloat(d.ImportPrice).toLocaleString('vi-VN');
                    return `
                        <tr>
                            <td><strong>${d.PurchaseOrderDetailID}</strong></td>
                            <td><span class="badge bg-secondary">${d.ProductVariantID}</span></td>
                            <td class="text-center">${d.NumOrder}</td>
                            <td class="text-end text-danger fw-bold">${giaNhap} đ</td>
                            <td class="text-end text-danger fw-bold">${thanhTien} đ</td>
                        </tr>
                    `;
                }).join('');
            }
            new bootstrap.Modal(document.getElementById('detailOrderModal')).show();
        })
        .catch(err => alert("Lỗi tải chi tiết: " + err.message));
}