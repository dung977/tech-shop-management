let currentCusData = [];
let currentCusPage = 1;
const cusRowsPerPage = 5;

document.addEventListener("DOMContentLoaded", () => executeCusSearch());

function executeCusSearch() {
    let keyword = document.getElementById('cusSearchInput').value;
    let areaFilter = document.getElementById('filterArea').value;
    fetch('http://127.0.0.1:5000/customers/search?keyword=' + keyword, { method: 'POST' })
        .then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
            return res.json();
        })
        .then(data => {
            if (areaFilter !== "All") {
                data = data.filter(c => c.Address && c.Address.includes(areaFilter));
            }
            currentCusData = data;
            currentCusPage = 1;
            renderCusTable();
        })
        .catch(err => {
            document.getElementById('cusTableBody').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi: ${err.message}</td></tr>`;
        });
}

function renderCusTable() {
    const tableBody = document.getElementById('cusTableBody');
    let startIndex = (currentCusPage - 1) * cusRowsPerPage;
    let paginatedData = currentCusData.slice(startIndex, startIndex + cusRowsPerPage);

    tableBody.innerHTML = paginatedData.map(cus => {
        let firstLetter = cus.FullName ? cus.FullName.charAt(0).toUpperCase() : '?';
        return `
        <tr>
            <td><strong>${cus.CustomerID}</strong></td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2" style="width: 35px; height: 35px; font-weight: bold;">${firstLetter}</div>
                    ${cus.FullName}
                </div>
            </td>
            <td>${cus.Phone}</td>
            <td>${cus.Email || ''}</td>
            <td>${cus.Address || ''}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-light text-success" title="Lịch sử mua hàng"><i class="fas fa-shopping-bag" onclick="viewCustomerHistory('${cus.CustomerID}', '${cus.FullName}')"></i></button>
                <button class="btn btn-sm btn-light text-primary" title="Sửa" onclick="openEditCusModal('${cus.CustomerID}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-light text-danger" title="Xóa" onclick="deleteCustomer('${cus.CustomerID}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
    renderCusPagination();
}

function renderCusPagination() {
    let totalPages = Math.ceil(currentCusData.length / cusRowsPerPage);
    let html = '';

    // Nếu không có dữ liệu hoặc chỉ có 1 trang thì không cần hiện phân trang
    if (totalPages <= 1) {
        document.querySelector('.pagination').innerHTML = '';
        return;
    }

    // Nút "Trước" (Previous)
    // Nếu đang ở trang 1 thì thêm class 'disabled' để không cho bấm
    html += `
        <li class="page-item ${currentCusPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeCusPage(event, ${currentCusPage - 1})">Trước</a>
        </li>`;

    // Các nút số trang (1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentCusPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeCusPage(event, ${i})">${i}</a>
            </li>`;
    }

    // Nút "Sau" (Next)
    // Nếu đang ở trang cuối cùng thì thêm class 'disabled'
    html += `
        <li class="page-item ${currentCusPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeCusPage(event, ${currentCusPage + 1})">Sau</a>
        </li>`;

    document.querySelector('.pagination').innerHTML = html;
}

function changeCusPage(e, page) {
    e.preventDefault();
    currentCusPage = page;
    renderCusTable();
}

function saveNewCustomer() {
    const customerData = {
        FullName: document.getElementById('cusFullName').value,
        Phone: document.getElementById('cusPhone').value,
        Email: document.getElementById('cusEmail').value,
        Address: document.getElementById('cusAddress').value,
        Username: document.getElementById('cusUsername').value,
        Password: document.getElementById('cusPassword').value
    };

    if (!customerData.FullName || !customerData.Phone || !customerData.Username || !customerData.Password) {
        alert("Vui lòng nhập đầy đủ Họ tên, SĐT, Username và Password!");
        return;
    }

    fetch('http://127.0.0.1:5000/customers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
    })
        .then(response => response.json())
        .then(result => {
            if (result.mess === "Add Successful") { 
                alert("Thêm khách hàng thành công!");
                bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
                document.getElementById('formAddCustomer').reset();
                executeCusSearch();
            } else {
                alert("Lỗi: " + (result.error || result.mess));
            }
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert("Không thể kết nối đến Server Python!");
        });
}


function deleteCustomer(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng [${id}]?`)) return;

    fetch(`http://127.0.0.1:5000/customers/delete/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(result => {
            if (result.mess === "Delete successful") {
                alert("Đã xóa khách hàng thành công!");
                executeCusSearch();
            } else {
                alert("Lỗi: " + (result.mess || result.error));
            }
        })
        .catch(error => console.error('Lỗi khi xóa:', error));
}

function openEditCusModal(id) {
    fetch(`http://127.0.0.1:5000/customers/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                let cus = data[0];
                document.getElementById('editCustomerId').value = cus.CustomerID;
                document.getElementById('editCusFullName').value = cus.FullName;
                document.getElementById('editCusPhone').value = cus.Phone;
                document.getElementById('editCusEmail').value = cus.Email || '';
                document.getElementById('editCusAddress').value = cus.Address || '';

                var editModal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
                editModal.show();
            }
        })
        .catch(error => console.error('Lỗi lấy data khách hàng:', error));
}

function submitEditCustomer() {
    let id = document.getElementById('editCustomerId').value;
    const updateData = {
        FullName: document.getElementById('editCusFullName').value,
        Phone: document.getElementById('editCusPhone').value,
        Email: document.getElementById('editCusEmail').value,
        Address: document.getElementById('editCusAddress').value
    };

    fetch(`http://127.0.0.1:5000/customers/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    })
        .then(response => response.json())
        .then(result => {
            if (result.mess === "Update successful") {
                alert("Cập nhật khách hàng thành công!");
                bootstrap.Modal.getInstance(document.getElementById('editCustomerModal')).hide();
                executeCusSearch();
            } else {
                alert("Lỗi: " + (result.error || result.mess));
            }
        })
        .catch(error => console.error('Lỗi cập nhật:', error));
}
// ==========================================
// XEM LỊCH SỬ MUA HÀNG CỦA KHÁCH HÀNG
// ==========================================
function viewCustomerHistory(customerId, customerName) {
    // 1. Gắn tên khách hàng lên tiêu đề Modal
    document.getElementById('historyCustomerName').innerText = customerName;
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin me-2"></i> Đang tải dữ liệu...</td></tr>`;

    // 2. Mở Modal lên trước cho trải nghiệm mượt mà
    new bootstrap.Modal(document.getElementById('customerHistoryModal')).show();

    // 3. Gọi API lấy toàn bộ Bill (API này đã join sẵn EmployeeName ở Backend)
    fetch('http://127.0.0.1:5000/bills/getall')
        .then(res => res.json())
        .then(data => {
            // Lọc ra hóa đơn thuộc về CustomerID này
            const customerBills = data.filter(b => b.CustomerID === customerId);

            if (customerBills.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5"><i>Khách hàng này chưa phát sinh giao dịch nào.</i></td></tr>`;
                return;
            }

            // Vẽ dữ liệu ra bảng
            tbody.innerHTML = customerBills.map(b => {
                // Xử lý màu sắc Badge
                let badgeClass = "bg-primary";
                if (b.Status === "Completed") badgeClass = "bg-success";
                else if (b.Status === "Cancelled") badgeClass = "bg-danger";
                else if (b.Status === "Draft") badgeClass = "bg-secondary";

                // Xử lý format Ngày tháng và Tiền tệ
                let dateDisplay = b.DateOrder ? new Date(b.DateOrder).toLocaleString('vi-VN') : 'N/A';
                let totalFormat = (b.TotalPrice || 0).toLocaleString('vi-VN');

                return `
                <tr>
                    <td class="ps-3"><strong>${b.BillID}</strong></td>
                    <td>${dateDisplay}</td>
                    <td>${b.EmployeeName || b.EmployeeID || 'Vãng lai'}</td>
                    <td class="text-end text-danger fw-bold">${totalFormat}đ</td>
                    <td class="text-center pe-3"><span class="badge ${badgeClass} rounded-pill px-3 py-1">${b.Status}</span></td>
                </tr>`;
            }).join('');
        })
        .catch(err => {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Lỗi tải lịch sử: ${err.message}</td></tr>`;
        });
}