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
                <button class="btn btn-sm btn-light text-success" title="Lịch sử mua hàng"><i class="fas fa-shopping-bag"></i></button>
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
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentCusPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changeCusPage(event, ${i})">${i}</a>
                 </li>`;
    }
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