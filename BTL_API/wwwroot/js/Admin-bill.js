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
            // Lọc theo trạng thái
            if (statusFilter !== "All") {
                data = data.filter(bill => bill.Status === statusFilter);
            }
            // Lọc theo từ khóa (Đã fix lỗi thiếu ngoặc)
            if (keyword !== "") {
                data = data.filter(bill =>
                    (bill.BillID && bill.BillID.toLowerCase().includes(keyword.toLowerCase())) ||
                    (bill.CustomerID && bill.CustomerID.toLowerCase().includes(keyword.toLowerCase()))
                );
            }
            currentBillData = data.reverse();
            currentBillPage = 1;
            renderBillTable(); // Gọi đúng tên hàm
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

        // Đã thêm thẻ td cho Checkbox và Ngày tạo đơn để khớp với 9 cột HTML
        return `
        <tr>
            <td class="ps-3"><input type="checkbox" class="form-check-input"></td>
            <td><strong>${bill.BillID}</strong></td>
            <td>${bill.CustomerID || '<span class="text-muted">Khách vãng lai</span>'}</td>
            <td>${bill.EmployeeID || '-'}</td>
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
                        <td><strong>${item.ProductVariantID}</strong></td>
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
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentBillPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changeBillPage(event, ${i})">${i}</a>
                 </li>`;
    }
    document.getElementById('billPagination').innerHTML = html;
}

function changeBillPage(e, page) {
    e.preventDefault();
    currentBillPage = page;
    renderBillTable();
}