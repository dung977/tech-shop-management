let currentAccData = [];
let currentAccPage = 1;
const accRowsPerPage = 5;
let currentEditAccId = null; // Biến lưu ID tài khoản đang được sửa mật khẩu

document.addEventListener("DOMContentLoaded", function () {
    loadAccounts();
});

// ==========================================
// 1. TẢI VÀ TÌM KIẾM TÀI KHOẢN
// ==========================================
function loadAccounts() {
    document.getElementById('accSearchInput').value = '';
    fetch('http://127.0.0.1:5000/accounts/getall')
        .then(res => res.json())
        .then(data => {
            currentAccData = data;
            currentAccPage = 1;
            renderAccountTable();
        })
        .catch(err => showError(err.message));
}

function handleAccSearch(e) {
    if (e.key === 'Enter') searchAccounts();
}

function searchAccounts() {
    const keyword = document.getElementById('accSearchInput').value.trim();
    if (!keyword) {
        loadAccounts();
        return;
    }

    fetch(`http://127.0.0.1:5000/accounts/search?keyword=${encodeURIComponent(keyword)}`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            currentAccData = data;
            currentAccPage = 1;
            renderAccountTable();
        })
        .catch(err => showError(err.message));
}

// ==========================================
// 2. VẼ BẢNG & PHÂN TRANG
// ==========================================
function renderAccountTable() {
    const tbody = document.getElementById('accountTableBody');
    if (!currentAccData || currentAccData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4"><i>Không tìm thấy tài khoản nào.</i></td></tr>`;
        document.querySelector('.pagination-acc').innerHTML = '';
        return;
    }

    let startIndex = (currentAccPage - 1) * accRowsPerPage;
    let paginatedData = currentAccData.slice(startIndex, startIndex + accRowsPerPage);

    tbody.innerHTML = paginatedData.map(acc => {
        let roleBadge = acc.Role === 'Admin' ? 'bg-danger' : (acc.Role === 'Sales' ? 'bg-warning text-dark' : (acc.Role === 'Inventory' ? 'bg-info text-dark' : 'bg-primary'));
        let owner = acc.EmployeeID ? `<small class="text-muted">NV: ${acc.EmployeeID}</small>` : (acc.CustomerID ? `<small class="text-muted">KH: ${acc.CustomerID}</small>` : '');

        return `
        <tr>
            <td><strong>${acc.AccountID}</strong></td>
            <td>
                <span class="text-primary fw-bold d-block">${acc.Username || 'N/A'}</span>
                ${owner}
            </td>
            <td><span class="badge ${roleBadge} rounded-pill px-3 py-1">${acc.Role || 'User'}</span></td>
            <td class="text-center"><span class="badge bg-success rounded-pill px-3 py-1">Hoạt động</span></td>
            <td class="text-center pe-3">
                <button class="btn btn-sm btn-light text-warning me-1" title="Đổi mật khẩu" onclick="openEditAccountModal('${acc.AccountID}')">
                    <i class="fas fa-key"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger" title="Xóa" onclick="deleteAccount('${acc.AccountID}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    renderAccPagination();
}

function renderAccPagination() {
    let totalPages = Math.ceil(currentAccData.length / accRowsPerPage);
    let container = document.querySelector('.pagination-acc');
    let html = '';

    if (totalPages <= 1) { container.innerHTML = ''; return; }

    html += `<li class="page-item ${currentAccPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeAccPage(event, ${currentAccPage - 1})">Trước</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
        let active = currentAccPage === i ? 'style="background-color: #1b45cf; border-color: #1b45cf; color: white;"' : '';
        html += `<li class="page-item ${currentAccPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changeAccPage(event, ${i})" ${active}>${i}</a></li>`;
    }
    html += `<li class="page-item ${currentAccPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeAccPage(event, ${currentAccPage + 1})">Sau</a></li>`;
    container.innerHTML = html;
}

function changeAccPage(e, page) {
    e.preventDefault();
    let totalPages = Math.ceil(currentAccData.length / accRowsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentAccPage = page;
        renderAccountTable();
    }
}

function showError(msg) {
    document.getElementById('accountTableBody').innerHTML = `<tr><td colspan="6" class="text-center text-danger">Lỗi Backend: ${msg}</td></tr>`;
}

// ==========================================
// 3. THÊM TÀI KHOẢN MỚI
// ==========================================
function openAddAccountModal() {
    document.getElementById('addAccFullName').value = '';
    document.getElementById('addAccUsername').value = '';
    document.getElementById('addAccPassword').value = '';
    document.getElementById('addAccRole').value = 'Customer';
    new bootstrap.Modal(document.getElementById('addAccountModal')).show();
}

function submitAddAccount() {
    const data = {
        FullName: document.getElementById('addAccFullName').value.trim(),
        Username: document.getElementById('addAccUsername').value.trim(),
        Password: document.getElementById('addAccPassword').value.trim(),
        Role: document.getElementById('addAccRole').value
    };

    if (!data.FullName || !data.Username || !data.Password) {
        alert("Vui lòng điền đầy đủ Họ tên, Tên đăng nhập và Mật khẩu!");
        return;
    }

    fetch('http://127.0.0.1:5000/accounts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(result => {
            if (result.status === 201 || result.status === 200) {
                alert("Thêm tài khoản thành công! Mã tự động đã được cấp.");
                bootstrap.Modal.getInstance(document.getElementById('addAccountModal')).hide();
                loadAccounts(); // Tải lại bảng để xem acc mới
            } else {
                alert("Lỗi: " + (result.body.mess || result.body.error));
            }
        })
        .catch(err => alert("Lỗi kết nối: " + err.message));
}S// ==========================================
// 4. ĐỔI MẬT KHẨU TÀI KHOẢN
// ==========================================
function openEditAccountModal(accountId) {
    currentEditAccId = accountId;
    document.getElementById('editAccIdDisplay').innerText = accountId;
    document.getElementById('editAccPassword').value = '';
    new bootstrap.Modal(document.getElementById('editAccountModal')).show();
}

function submitEditPassword() {
    const newPwd = document.getElementById('editAccPassword').value.trim();
    if (!newPwd) {
        alert("Vui lòng nhập mật khẩu mới!");
        return;
    }

    fetch(`http://127.0.0.1:5000/accounts/edit/${currentEditAccId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Password: newPwd })
    })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(result => {
            if (result.status === 200) {
                alert("Đổi mật khẩu thành công!");
                bootstrap.Modal.getInstance(document.getElementById('editAccountModal')).hide();
            } else {
                alert("Lỗi: " + (result.body.mess || result.body.error));
            }
        })
        .catch(err => alert("Lỗi kết nối: " + err.message));
}

// ==========================================
// 5. XÓA TÀI KHOẢN
// ==========================================
function deleteAccount(id) {
    if (confirm(`Bạn có chắc muốn vô hiệu hóa tài khoản ${id} không?`)) {
        fetch(`http://127.0.0.1:5000/accounts/delete/${id}`, { method: 'PUT' })
            .then(res => res.json())
            .then(data => {
                alert(data.mess || data.error || "Thành công!");
                searchAccounts(); // Giữ nguyên thanh tìm kiếm và tải lại
            })
            .catch(err => alert("Lỗi khi xóa: " + err.message));
    }
}