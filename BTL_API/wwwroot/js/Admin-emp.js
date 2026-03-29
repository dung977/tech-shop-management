

// ==========================================
// 1. CÁC BIẾN TOÀN CỤC CHO PHÂN TRANG 
// ==========================================
let currentData = []; // Mảng nhớ tạm dữ liệu
let currentPage = 1;  // Trang hiện hành
const rowsPerPage = 5; // Số nhân viên hiển thị trên 1 trang

document.addEventListener("DOMContentLoaded", function () {
    executeSearch();
});

// ==========================================
// 2. HÀM TÌM KIẾM
// ==========================================
function executeSearch() {
    let keyword = document.getElementById('searchInput').value;
    let roleFilter = document.getElementById('filterRole').value;

    fetch('http://127.0.0.1:5000/employees/search?keyword=' + keyword, {
        method: 'POST'
    })
        .then(response => {
            if (!response.ok) {
                // NẾU PYTHON LỖI 400/500, DỊCH LỖI ĐỂ TRUYỀN XUỐNG CATCH
                return response.json().then(err => { throw new Error(err.error || "Lỗi Server Python") });
            }
            return response.json();
        })
        .then(data => {
            // ĐẢM BẢO DATA LÀ MẢNG THÌ MỚI XỬ LÝ
            if (Array.isArray(data)) {
                if (roleFilter !== "All") {
                    data = data.filter(emp => emp.Role === roleFilter);
                }
                currentData = data;
            } else {
                currentData = []; 
            }

            currentPage = 1;
            renderTable();
        })
        .catch(error => {
            console.error('Lỗi khi tìm kiếm:', error);
            currentData = []; // Tránh lỗi slice()
            const tableBody = document.getElementById('employeeTableBody');
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4"><b>Lỗi Backend:</b> ${error.message}</td></tr>`;
            document.querySelector('.pagination').innerHTML = '';
        });
}

// ==========================================
// 3. HÀM VẼ BẢNG (ĐÃ TÍCH HỢP CẮT MẢNG)
// ==========================================
function renderTable() {
    const tableBody = document.getElementById('employeeTableBody');
    let htmlContent = '';

    if (!currentData || currentData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i>Không tìm thấy nhân viên nào phù hợp với bộ lọc.</i></td></tr>`;
        document.querySelector('.pagination').innerHTML = ''; // Giấu luôn nút phân trang nếu ko có ai
        return;
    }

    // THUẬT TOÁN CẮT MẢNG (Chỉ lấy 5 ông)
    let startIndex = (currentPage - 1) * rowsPerPage;
    let endIndex = startIndex + rowsPerPage;
    let paginatedData = currentData.slice(startIndex, endIndex);

    // Dùng mảng đã cắt để vẽ
    paginatedData.forEach(emp => {
        let firstLetter = emp.FullName ? emp.FullName.charAt(0).toUpperCase() : '?';
        let badgeClass = 'bg-secondary';
        let role = emp.Role;
        if (role === 'Quản lý') badgeClass = 'bg-danger';
        else if (role === 'Bán hàng') badgeClass = 'bg-primary';
        else if (role === 'Thủ kho') badgeClass = 'bg-dark';
        else if (role === 'Thu ngân') badgeClass = 'bg-success';
        else if (role === 'Kỹ thuật') badgeClass = 'bg-info text-dark';

        htmlContent += `
            <tr>
                <td class="ps-3"><input type="checkbox" class="form-check-input"></td>
                <td><strong>${emp.EmployeeID}</strong></td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2" style="width: 35px; height: 35px; font-weight: bold;">
                            ${firstLetter}
                        </div>
                        ${emp.FullName}
                    </div>
                </td>
                <td>${emp.Phone || ''}</td>
                <td>${emp.Email || ''}</td>
                <td class="text-center">
                    <span class="badge ${badgeClass} rounded-pill px-3 py-2">${emp.Role}</span>
                </td>
                <td class="text-center pe-3">
                    <button class="btn btn-sm btn-light text-primary" title="Sửa" onclick="openEditModal('${emp.EmployeeID}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger" title="Xóa" onclick="deleteEmployee('${emp.EmployeeID}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = htmlContent;

    // VẼ THÊM CÁC NÚT BẤM DƯỚI ĐÁY BẢNG
    renderPagination();
}

// ==========================================
// 4. HÀM VẼ NÚT PHÂN TRANG (1, 2, 3...)
// ==========================================
function renderPagination() {
    let totalPages = Math.ceil(currentData.length / rowsPerPage);
    let paginationUl = document.querySelector('.pagination');
    let html = '';

    // Nút "Trước"
    let prevDisabled = (currentPage === 1) ? 'disabled' : '';
    html += `<li class="page-item ${prevDisabled}"><a class="page-link" href="#" onclick="changePage(event, ${currentPage - 1})">Trước</a></li>`;

    // Nút số 1, 2, 3
    for (let i = 1; i <= totalPages; i++) {
        let activeClass = (i === currentPage) ? 'active' : '';
        let style = (i === currentPage) ? 'style="background-color: #1b45cf; border-color: #1b45cf; color: white;"' : '';
        html += `<li class="page-item ${activeClass}"><a class="page-link" href="#" ${style} onclick="changePage(event, ${i})">${i}</a></li>`;
    }

    // Nút "Sau"
    let nextDisabled = (currentPage === totalPages || totalPages === 0) ? 'disabled' : '';
    html += `<li class="page-item ${nextDisabled}"><a class="page-link" href="#" onclick="changePage(event, ${currentPage + 1})">Sau</a></li>`;

    paginationUl.innerHTML = html;
}

// ==========================================
// 5. HÀM CHUYỂN TRANG
// ==========================================
function changePage(event, newPage) {
    event.preventDefault(); // Ngăn web bị giật lên đầu trang
    let totalPages = Math.ceil(currentData.length / rowsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
    }
}
function saveNewEmployee() {
    // 1. Lấy dữ liệu từ các ô input mà người dùng vừa gõ
    const empData = {
        FullName: document.getElementById('addFullName').value,
        Role: document.getElementById('addRole').value,
        Phone: document.getElementById('addPhone').value,
        Email: document.getElementById('addEmail').value,
        Username: document.getElementById('addUsername').value,
        Password: document.getElementById('addPassword').value
    };

    // Kiểm tra sơ bộ xem có để trống ô nào không
    if (!empData.FullName || !empData.Phone || !empData.Username || !empData.Password) {
        alert("Vui lòng điền đầy đủ các trường bắt buộc!");
        return;
    }

    // 2. Dùng Fetch API gọi sang cổng 5000 của Python
    fetch('http://127.0.0.1:5000/employees/add', {
        method: 'POST', // Chuyển phương thức thành POST
        headers: {
            'Content-Type': 'application/json' // Báo cho Python biết tao gửi JSON đấy nhé
        },
        body: JSON.stringify(empData) // Ép cái Object empData thành chuỗi JSON
    })
        .then(response => {
            return response.json().then(data => ({ status: response.status, body: data }));
        })
        .then(result => {
            // Nếu Python trả về HTTP Status 200 (Thành công)
            if (result.status === 200) {
                alert("Thêm nhân viên thành công!");

                // Xóa trắng form để lần sau mở lên nhập tiếp
                document.getElementById('formAddEmployee').reset();

                // Đóng cái cửa sổ Modal đi
                var myModalEl = document.getElementById('addEmployeeModal');
                var modal = bootstrap.Modal.getInstance(myModalEl);
                modal.hide();

             
                executeSearch();
            }
            // Nếu Python báo lỗi (Trùng Username, SĐT... - Status 400 hoặc 500)
            else {
                alert("Lỗi: " + (result.body.mess || result.body.error));
            }
        })
        .catch(error => {
            console.error('Lỗi khi lưu dữ liệu:', error);
            alert("Không kết nối được với Server Python!");
        });
}
// Hàm Xóa nhân viên
function deleteEmployee(id) {
    // 1. Cảnh báo trước khi xóa (Cực kỳ quan trọng trong UI/UX)
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên có mã [${id}] không? Hành động này sẽ xóa luôn cả tài khoản đăng nhập của người này và không thể khôi phục!`)) {
        return; // Nếu user bấm Cancel (Hủy) thì dừng luôn không làm gì cả
    }

    fetch(`http://127.0.0.1:5000/employees/delete/${id}`, {
        method: 'DELETE' 
    })
        .then(response => {
            return response.json().then(data => ({ status: response.status, body: data }));
        })
        .then(result => {
            // Nếu Python trả về HTTP Status 200 (Xóa thành công)
            if (result.status === 200) {
                alert("Đã tiễn nhân viên lên đường thành công!");

                executeSearch();
            }
            
            else {
                alert("Không thể xóa: " + (result.body.mess || result.body.error));
            }
        })
        .catch(error => {
            console.error('Lỗi khi gọi API xóa:', error);
            alert("Lỗi kết nối đến Server Python! Hãy kiểm tra lại backend.");
        });
}
// 1. Hàm Mở Modal và lấy thông tin cũ điền vào
function openEditModal(id) {
    // Gọi API lấy thông tin chi tiết của 1 nhân viên (GET /employees/get/<id>)
    fetch('http://127.0.0.1:5000/employees/' + id)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                let emp = data[0]; // Lấy object đầu tiên trong mảng trả về

                // Đổ dữ liệu vào các ô input của Form Sửa
                document.getElementById('editEmployeeId').value = emp.EmployeeID;
                document.getElementById('editFullName').value = emp.FullName;
                document.getElementById('editRole').value = emp.Role;
                document.getElementById('editPhone').value = emp.Phone;
                document.getElementById('editEmail').value = emp.Email;

                // Dùng lệnh của Bootstrap để gọi cái Modal bật lên
                var editModal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
                editModal.show();
            } else {
                alert("Không tìm thấy thông tin nhân viên này trong CSDL!");
            }
        })
        .catch(error => console.error('Lỗi lấy thông tin:', error));
}

// 2. Hàm Lưu thay đổi khi bấm nút "Lưu Thay Đổi"
function submitEditEmployee() {
    // Lấy ID bị ẩn ra để biết đang sửa nhân viên nào
    let id = document.getElementById('editEmployeeId').value;

    // Gom dữ liệu mới trên form thành JSON
    const updateData = {
        FullName: document.getElementById('editFullName').value,
        Role: document.getElementById('editRole').value,
        Phone: document.getElementById('editPhone').value,
        Email: document.getElementById('editEmail').value
    };

    // Bắn API Update (PUT) sang Python
    fetch(`http://127.0.0.1:5000/employees/update/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
        .then(response => {
            return response.json().then(data => ({ status: response.status, body: data }));
        })
        .then(result => {
            if (result.status === 200) {
                alert("Cập nhật thông tin thành công!");

                // Tắt Modal Sửa đi
                var myModalEl = document.getElementById('editEmployeeModal');
                var modal = bootstrap.Modal.getInstance(myModalEl);
                modal.hide();

                // Load lại bảng để thấy chữ mới vừa sửa
                executeSearch();
            } else {
                alert("Lỗi khi cập nhật: " + (result.body.mess || result.body.error));
            }
        })
        .catch(error => {
            console.error('Lỗi khi Update:', error);
            alert("Lỗi kết nối Server Python!");
        });
}
