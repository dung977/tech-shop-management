// ==========================================
// CÁC BIẾN TOÀN CỤC CHO PHÂN TRANG VÀ LỌC
// ==========================================
let originalOrderData = []; // Dữ liệu gốc từ API
let filteredOrderData = []; // Dữ liệu sau khi lọc
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
                originalOrderData = data;
                filteredOrderData = data; // Mặc định chưa lọc thì 2 mảng giống nhau
                currentOrderPage = 1;
                renderOrderTable();
            }
        })
        .catch(err => {
            document.getElementById('purchaseOrderTableBody').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi Backend: ${err.message}</td></tr>`;
        });
}

// ==========================================
// HÀM LỌC (LỌC TRẠNG THÁI & TÌM KIẾM MÃ PHIẾU)
// ==========================================
function filterOrders() {
    // Lấy phần tử HTML (kiểm tra tồn tại để tránh lỗi nếu chưa kịp update HTML)
    const statusSelect = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchOrderInput');

    const statusVal = statusSelect ? statusSelect.value : "All";
    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : "";

    // Lọc từ mảng gốc
    filteredOrderData = originalOrderData.filter(po => {
        let matchStatus = true;
        if (statusVal !== "All" && statusVal !== "Tất cả trạng thái...") {
            matchStatus = po.Status === statusVal;
        }

        let matchSearch = true;
        if (searchVal) {
            matchSearch = po.PurchaseOrderID.toLowerCase().includes(searchVal);
        }

        return matchStatus && matchSearch;
    });

    currentOrderPage = 1; // Về trang 1 sau khi lọc
    renderOrderTable();
}

// ==========================================
// 2. VẼ BẢNG + CẮT DỮ LIỆU THEO TRANG
// ==========================================
function renderOrderTable() {
    const tbody = document.getElementById('purchaseOrderTableBody');

    // Chú ý: Dùng filteredOrderData thay vì currentOrderData
    if (!filteredOrderData || filteredOrderData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i>Không tìm thấy phiếu nhập nào phù hợp.</i></td></tr>`;
        document.querySelector('.pagination').innerHTML = '';
        return;
    }

    let startIndex = (currentOrderPage - 1) * orderRowsPerPage;
    let endIndex = startIndex + orderRowsPerPage;
    let paginatedData = filteredOrderData.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedData.map(po => {
        let badgeClass = "bg-primary";
        if (po.Status === "Completed") badgeClass = "bg-success";
        else if (po.Status === "Draft") badgeClass = "bg-secondary";
        else if (po.Status === "Shipping") badgeClass = "bg-info";

        let actionButtons = `
           <button class="btn btn-sm btn-light text-primary me-1" title="Xem chi tiết" onclick="viewOrderDetail('${po.PurchaseOrderID}')">
                <i class="fas fa-eye"></i>
        `;

        if (po.Status === "Draft") {
           
            actionButtons += `<button class="btn btn-sm btn-light text-success me-1" title="Duyệt & Nhập kho" onclick="confirmOrder('${po.PurchaseOrderID}')"><i class="fas fa-check-circle"></i></button>`;
           
            actionButtons += `<button class="btn btn-sm btn-light text-danger" title="Xóa nháp"><i class="fas fa-trash"></i></button>`;
        }
        // Giả sử sau khi duyệt xong trạng thái là Processing/Pending, có thể thêm nút Thanh toán
        else if (po.Status === "Processing" || po.Status === "Pending Payment") {
            actionButtons += `<button class="btn btn-sm btn-light text-success me-1" title="Thanh toán & Hoàn thành" onclick="payOrder('${po.PurchaseOrderID}')"><i class="fas fa-dollar-sign"></i></button>`;
        }

        let dateDisplay = 'Đang cập nhật';
        if (po.OrderDate) {
            let d = new Date(po.OrderDate);
            dateDisplay = d.toLocaleDateString('vi-VN');
        }

        return `
        <tr>
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

    renderOrderPagination();
}

// ==========================================
// 3. VẼ CÁC NÚT PHÂN TRANG
// ==========================================
function renderOrderPagination() {
    let totalPages = Math.ceil(filteredOrderData.length / orderRowsPerPage);
    let paginationContainer = document.querySelector('.pagination');
    let html = '';

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    html += `<li class="page-item ${currentOrderPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeOrderPage(event, ${currentOrderPage - 1})">Trước</a>
             </li>`;

    for (let i = 1; i <= totalPages; i++) {
        let activeStyle = currentOrderPage === i ? 'style="background-color: #1b45cf; border-color: #1b45cf; color: white;"' : '';
        html += `<li class="page-item ${currentOrderPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changeOrderPage(event, ${i})" ${activeStyle}>${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${currentOrderPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeOrderPage(event, ${currentOrderPage + 1})">Sau</a>
             </li>`;

    paginationContainer.innerHTML = html;
}

// ==========================================
// 4. SỰ KIỆN KHI BẤM CHUYỂN TRANG
// ==========================================
function changeOrderPage(e, page) {
    e.preventDefault();
    let totalPages = Math.ceil(filteredOrderData.length / orderRowsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentOrderPage = page;
        renderOrderTable();
    }
}


// ==========================================
// MỞ FORM THÊM PHIẾU NHẬP
// ==========================================
function openAddOrderModal() {
    document.getElementById('addSupplierID').value = '';
    document.getElementById('orderDetailArea').innerHTML = '';
    addDetailRow();

    
    let empInput = document.getElementById('addEmployeeID');
    let empIdFromJS = localStorage.getItem('EmployeeID');

    if (empIdFromJS) {
        empInput.value = empIdFromJS;
        // Khóa luôn ô nhập, không cho sửa thành mã người khác
        empInput.setAttribute('readonly', 'true');
        empInput.classList.add('bg-light');
    } else {
        empInput.value = '';
        empInput.removeAttribute('readonly');
        empInput.classList.remove('bg-light');
    }

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
// LƯU PHIẾU NHẬP VÀ CÁC CHI TIẾT
// ==========================================
async function submitFullOrder() {
    const supplierId = document.getElementById('addSupplierID').value.trim();
    const employeeId = document.getElementById('addEmployeeID').value.trim();

    if (!supplierId || !employeeId) {
        alert("Vui lòng nhập Mã Nhà cung cấp và Nhân viên!"); return;
    }

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
        const poRes = await fetch('http://127.0.0.1:5000/purchase_orders/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ SupplierID: supplierId, EmployeeID: employeeId, Status: 'Draft' })
        });

        const poData = await poRes.json();
        if (!poRes.ok) throw new Error(poData.message || "Lỗi tạo phiếu nhập");

        const newPoId = poData.PurchaseOrderID;
        if (!newPoId) throw new Error("Backend chưa trả về PurchaseOrderID!");

        for (const item of details) {
            item.PurchaseOrderID = newPoId;
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
        location.reload();

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
// ==========================================
// DUYỆT PHIẾU VÀ CỘNG HÀNG VÀO KHO
// ==========================================
function confirmOrder(poId) {
    if (confirm(`Bạn có chắc muốn duyệt phiếu ${poId}? Số lượng sẽ được CỘNG THẲNG vào tồn kho.`)) {

        // LƯU Ý: Nếu API cộng kho của ông trong file Python tên khác, hãy sửa lại chữ '/confirm' ở link dưới cho khớp nhé.
        fetch(`http://127.0.0.1:5000/purchase_orders/${poId}/confirm`, {
            method: 'POST'
        })
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    alert(data.message); // Nó sẽ hiện dòng "Confirmed and stock updated successfully!" từ Backend
                    location.reload();
                } else {
                    alert("Lỗi: " + (data.error || "Không thể duyệt phiếu"));
                }
            })
            .catch(err => alert("Lỗi kết nối: " + err.message));
    }
}

// ==========================================
// THANH TOÁN PHIẾU NHẬP
// ==========================================
function payOrder(poId) {
    if (confirm(`Xác nhận đã thanh toán tiền cho nhà cung cấp của phiếu ${poId}?`)) {

        fetch(`http://127.0.0.1:5000/purchase_orders/${poId}/pay`, {
            method: 'POST'
        })
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    alert("Đã cập nhật trạng thái thành Completed!");
                    location.reload();
                } else {
                    alert("Lỗi: " + (data.error || "Không thể thanh toán"));
                }
            })
            .catch(err => alert("Lỗi kết nối: " + err.message));
    }
}