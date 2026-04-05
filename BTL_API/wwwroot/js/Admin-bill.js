// ==========================================
// 1. CÁC BIẾN TOÀN CỤC CHO PHÂN TRANG 
// ==========================================
// Đổi tên biến cho chuẩn, tránh đụng hàng với trang khác
let currentBillData = [];
let currentBillPage = 1;
const billRowsPerPage = 5;

document.addEventListener("DOMContentLoaded", function () {
    executeBillSearch(); // Gọi đúng tên hàm
});

function executeBillSearch() {
    let keyword = document.getElementById('billSearchInput').value;
    let statusFilter = document.getElementById('filterBill').value;

    fetch('http://127.0.0.1:5000/bills/getall')
        .then(res => res.json())
        .then(data => {
            if (statusFilter !== "All") {
                data = data.filter(bill => bill.Status === statusFilter);
            }

            if (keyword !== "") {
                const kw = keyword.toLowerCase();
                data = data.filter(bill =>
                    (bill.BillID && bill.BillID.toLowerCase().includes(kw)) ||
                    (bill.CustomerID && bill.CustomerID.toLowerCase().includes(kw)) ||
                    (bill.CustomerName && bill.CustomerName.toLowerCase().includes(kw)) || // TÌM THEO TÊN KHÁCH HÀNG
                    (bill.EmployeeName && bill.EmployeeName.toLowerCase().includes(kw))    // TÌM THEO TÊN NHÂN VIÊN
                );
            }
            currentBillData = data; // Không cần .reverse() nữa vì Python đã ORDER BY DESC rồi
            currentBillPage = 1;
            renderBillTable();
        })
        .catch(err => {
            document.getElementById('billTableBody').innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4"><i>Lỗi khi tải dữ liệu: ${err.message}</i></td></tr>`;
        });
}

function renderBillTable() {
    const tableBody = document.getElementById('billTableBody');
    if (currentBillData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Không có đơn hàng nào.</td></tr>`;
        document.getElementById('billPagination').innerHTML = '';
        return;
    }

    let startIndex = (currentBillPage - 1) * billRowsPerPage;
    let paginatedData = currentBillData.slice(startIndex, startIndex + billRowsPerPage);

    tableBody.innerHTML = paginatedData.map(bill => {
        let badge = '';
        let actionButtons = `<button class="btn btn-sm btn-light text-primary me-1" title="Xem chi tiết" onclick="viewBillDetails('${bill.BillID}', ${bill.TotalPrice})"><i class="fas fa-eye"></i></button>`;

        if (bill.Status === 'Draft') {
            badge = `<span class="badge bg-warning text-dark">Nháp (Draft)</span>`;
            actionButtons += `<button class="btn btn-sm btn-light text-success me-1" title="Duyệt đơn (Checkout)" onclick="checkoutBill('${bill.BillID}')"><i class="fas fa-check-circle"></i></button>`;
            actionButtons += `<button class="btn btn-sm btn-light text-danger" title="Hủy đơn" onclick="cancelBill('${bill.BillID}')"><i class="fas fa-times-circle"></i></button>`;
        } else if (bill.Status === 'Completed') {
            badge = `<span class="badge bg-success">Hoàn thành</span>`;
            actionButtons += `<button class="btn btn-sm btn-light text-danger" title="Hủy đơn & Hoàn kho" onclick="cancelBill('${bill.BillID}')"><i class="fas fa-undo"></i></button>`;
        } else if (bill.Status === 'Cancelled') {
            badge = `<span class="badge bg-secondary">Đã hủy</span>`;
        }

        let orderDate = bill.DateOrder ? new Date(bill.DateOrder).toLocaleString('vi-VN') : '-';

        // Tạo giao diện Tên in đậm, Mã in mờ bên dưới
        let customerDisplay = bill.CustomerName
            ? `<strong>${bill.CustomerName}</strong><br><small class="text-muted">${bill.CustomerID}</small>`
            : `<span class="text-muted">Khách vãng lai</span>`;

        let employeeDisplay = bill.EmployeeName
            ? `<strong>${bill.EmployeeName}</strong><br><small class="text-muted">${bill.EmployeeID}</small>`
            : (bill.EmployeeID ? bill.EmployeeID : '-');

        return `
        <tr>
            <td><strong>${bill.BillID}</strong></td>
            <td>${customerDisplay}</td>
            <td>${employeeDisplay}</td>
            <td>${orderDate}</td>
            <td>${bill.PayMethod || 'Tiền mặt'}</td>
            <td class="text-danger fw-bold">${(bill.TotalPrice || 0).toLocaleString()}đ</td>
            <td class="text-center">${badge}</td>
            <td class="text-center pe-3">${actionButtons}</td>
        </tr>`;
    }).join('');

    renderBillPagination();
}
// ==========================================
// 2. XEM CHI TIẾT ĐƠN HÀNG (BILL DETAIL)
// ==========================================
function viewBillDetails(billId, totalPrice) {
    document.getElementById('detailBillId').innerText = billId;
    document.getElementById('detailTotalPrice').innerText = totalPrice.toLocaleString() + 'đ';

    fetch(`http://127.0.0.1:5000/bill-details/get/${billId}`)
        .then(res => res.json())
        .then(data => {
            const detailBody = document.getElementById('billDetailTableBody');
            if (!data || data.length === 0) {
                detailBody.innerHTML = `<tr><td colspan="4" class="text-center">Chưa có sản phẩm nào trong đơn này.</td></tr>`;
            } else {
                detailBody.innerHTML = data.map(item => {
                    let subTotal = item.Num * item.Price;
                    return `
                    <tr>
                        <td>
                           <strong>${item.ProductName || 'Sản phẩm không xác định'}</strong>
                           <br/>
                           <small class="text-muted">Mã: ${item.ProductVariantID} | Màu: ${item.Color || 'Mặc định'}</small>
                        </td>
                        <td class="text-center">${item.Num}</td>
                        <td class="text-end">${item.Price.toLocaleString()}đ</td>
                        <td class="text-end text-primary fw-bold">${subTotal.toLocaleString()}đ</td>
                    </tr>`;
                }).join('');
            }
            new bootstrap.Modal(document.getElementById('viewBillDetailModal')).show();
        })
        .catch(err => alert("Lỗi khi lấy chi tiết đơn hàng!"));
}

// ==========================================
// 3. DUYỆT ĐƠN (CHECKOUT) - TRỪ TỒN KHO
// ==========================================
function checkoutBill(billId) {
    if (!confirm(`Xác nhận duyệt và xuất kho cho đơn hàng [${billId}]?`)) return;

    fetch(`http://127.0.0.1:5000/bills/${billId}/checkout`, { method: 'POST' })
        .then(res => res.json())
        .then(result => {
            // Kiểm tra xem backend có báo lỗi hết hàng không
            if (result.mess && result.mess.includes("out of stock")) {
                alert("Thất bại: Có sản phẩm trong đơn đã HẾT HÀNG trong kho!");
            } else if (result.error) {
                alert("Lỗi Server: " + result.error);
            } else {
                alert("Duyệt đơn thành công! Đã trừ tồn kho.");
                executeBillSearch(); // Load lại bảng
            }
        });
}

// ==========================================
// 4. HỦY ĐƠN (CANCEL) - HOÀN LẠI TỒN KHO
// ==========================================
function cancelBill(billId) {
    if (!confirm(`Bạn có chắc chắn muốn HỦY đơn hàng [${billId}]? Nếu đơn đã duyệt, tồn kho sẽ được cộng lại.`)) return;

    fetch(`http://127.0.0.1:5000/bills/${billId}/cancel`, { method: 'POST' })
        .then(res => res.json())
        .then(result => {
            if (result.error) {
                alert("Lỗi: " + result.error);
            } else {
                alert("Đã hủy đơn hàng thành công!");
                executeBillSearch();
            }
        });
}

// ==========================================
// 5. PHÂN TRANG (PAGINATION)
// ==========================================
function renderBillPagination() {
    let totalPages = Math.ceil(currentBillData.length / billRowsPerPage);
    let html = '';

    if (totalPages <= 1) {
        document.getElementById('billPagination').innerHTML = '';
        return;
    }

    // Nút "Trước"
    html += `
        <li class="page-item ${currentBillPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeBillPage(event, ${currentBillPage - 1})">Trước</a>
        </li>`;

    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentBillPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeBillPage(event, i)">${i}</a>
            </li>`;
    }

    // Nút "Sau"
    html += `
        <li class="page-item ${currentBillPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeBillPage(event, ${currentBillPage + 1})">Sau</a>
        </li>`;

    document.getElementById('billPagination').innerHTML = html;
}

function changeBillPage(e, page) {
    e.preventDefault();
    currentBillPage = page;
    renderBillTable();
}
// ==========================================
// 6. MỞ FORM TẠO ĐƠN HÀNG (TỰ LẤY ID NHÂN VIÊN)
// ==========================================
function openAddBillModal() {
    // Reset form
    document.getElementById('addCustomerID').value = '';
    document.getElementById('addPayMethod').value = 'Tiền mặt';
    document.getElementById('billDetailArea').innerHTML = '';
    addBillDetailRow(); // Mặc định thêm 1 dòng trống

    // Lấy ID Nhân viên đang đăng nhập từ LocalStorage
    let empInput = document.getElementById('addEmployeeID');
    let empIdFromJS = localStorage.getItem('EmployeeID');

    if (empIdFromJS) {
        empInput.value = empIdFromJS;
        empInput.setAttribute('readonly', 'true'); // Khóa lại không cho sửa
        empInput.classList.add('bg-light');
    } else {
        empInput.value = '';
        empInput.removeAttribute('readonly');
        empInput.classList.remove('bg-light');
    }

    new bootstrap.Modal(document.getElementById('addBillModal')).show();
}

// Hàm thêm 1 dòng nhập sản phẩm
function addBillDetailRow() {
    const id = Date.now();
    const html = `
        <div class="row g-2 mb-2 detail-row align-items-center" id="row-${id}">
            <div class="col-md-8">
                <input type="text" class="form-control d-var-id" placeholder="Mã sản phẩm (VD: VAR1)" required>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control d-num" placeholder="Số lượng" min="1" value="1" required>
            </div>
            <div class="col-md-1 text-end">
                <button class="btn btn-outline-danger" onclick="document.getElementById('row-${id}').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    document.getElementById('billDetailArea').insertAdjacentHTML('beforeend', html);
}

// ==========================================
// 7. LƯU ĐƠN HÀNG & CHI TIẾT LÊN SERVER
// ==========================================
async function submitFullBill() {
    const customerId = document.getElementById('addCustomerID').value.trim() || null;
    const employeeId = document.getElementById('addEmployeeID').value.trim();
    const payMethod = document.getElementById('addPayMethod').value;

    if (!employeeId) {
        alert("Thiếu mã nhân viên lập đơn!"); return;
    }

    // Gom dữ liệu sản phẩm
    const rows = document.querySelectorAll('.detail-row');
    if (rows.length === 0) {
        alert("Đơn hàng phải có ít nhất 1 sản phẩm!"); return;
    }

    let details = [];
    let isValid = true;
    rows.forEach(row => {
        const vId = row.querySelector('.d-var-id').value.trim();
        const num = row.querySelector('.d-num').value;
        if (!vId || !num || num <= 0) isValid = false;
        details.push({ ProductVariantID: vId, Num: parseInt(num) });
    });

    if (!isValid) {
        alert("Vui lòng điền đúng mã sản phẩm và số lượng > 0!"); return;
    }

    try {
        // Gọi API Tạo Đơn Bán Hàng gốc
        const billRes = await fetch('http://127.0.0.1:5000/bills/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                CustomerID: customerId,
                EmployeeID: employeeId,
                PaymentMethod: payMethod,
                Status: 'Draft',
                TotalPrice: 0 // Ban đầu là 0, API BillDetail sẽ tự cộng dồn vào sau
            })
        });

        const billData = await billRes.json();
        if (!billRes.ok) throw new Error(billData.mess || billData.error || "Lỗi tạo đơn");

        const newBillId = billData.BillID;

        // Chạy vòng lặp thêm từng chi tiết sản phẩm vào đơn
        for (const item of details) {
            item.BillID = newBillId;
            const detRes = await fetch('http://127.0.0.1:5000/bill-details/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });

            // Xử lý nếu mã SP sai hoặc không tồn tại
            if (!detRes.ok) {
                const errData = await detRes.json();
                console.error("Lỗi dòng:", item, errData);
                alert(`Lỗi khi thêm sản phẩm ${item.ProductVariantID}: ${errData.mess || 'Không xác định'}`);
            }
        }

        alert("Tạo đơn hàng thành công!");
        location.reload(); // Tải lại trang

    } catch (err) {
        alert("Lỗi: " + err.message);
    }
}