// Chờ giao diện load xong thì mới gọi API
document.addEventListener("DOMContentLoaded", function () {
    loadEmployees();
});

function loadEmployees() {
    // Gọi sang API Python của mày đang chạy ở cổng 5000
    fetch('http://127.0.0.1:5000/employees/getall')
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi mạng hoặc API sập!');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('employeeTableBody');
            let htmlContent = '';

            // Lặp qua từng nhân viên trả về từ DB
            data.forEach(emp => {

                // 1. Lấy chữ cái đầu tiên của Tên làm Avatar
                let firstLetter = emp.FullName ? emp.FullName.charAt(0).toUpperCase() : '?';

                // 2. Xét màu cho Badge dựa vào Role
                let badgeClass = 'bg-secondary'; // Mặc định là xám
                let role = emp.Role;
                if (role === 'Quản lý') badgeClass = 'bg-danger';
                else if (role === 'Bán hàng') badgeClass = 'bg-primary';
                else if (role === 'Thủ kho') badgeClass = 'bg-dark';
                else if (role === 'Thu ngân') badgeClass = 'bg-success';
                else if (role === 'Kỹ thuật') badgeClass = 'bg-info text-dark';

                // 3. Render HTML cho 1 dòng (tr)
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
                                    <button class="btn btn-sm btn-light text-primary" title="Sửa"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-sm btn-light text-danger" title="Xóa" onclick="deleteEmployee('${emp.EmployeeID}')"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `;
            });

            // Đổ toàn bộ chuỗi HTML vừa tạo vào trong thẻ tbody
            tableBody.innerHTML = htmlContent;
        })
        .catch(error => {
            console.error('Lỗi khi fetch data:', error);
            document.getElementById('employeeTableBody').innerHTML =
                `<tr><td colspan="7" class="text-center text-danger">Không thể tải dữ liệu từ API. Hãy kiểm tra xem file main.py đã chạy chưa.</td></tr>`;
        });
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

                // QUAN TRỌNG: Gọi lại hàm load bảng để nó hiển thị ngay nhân viên mới
                loadEmployees();
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