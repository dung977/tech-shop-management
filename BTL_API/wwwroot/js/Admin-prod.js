// ==========================================
// 1. CÁC BIẾN TOÀN CỤC CHO PHÂN TRANG
// ==========================================
let currentProdData = [];
let currentProdPage = 1;
const prodRowsPerPage = 5;

document.addEventListener("DOMContentLoaded", function () {
    executeProdSearch(); // Tự động load khi vào trang
});

// ==========================================
// 2. HÀM TÌM KIẾM & LẤY DỮ LIỆU
// ==========================================
function executeProdSearch() {
    let keyword = document.getElementById('prodSearchInput').value;
    let brandFilter = document.getElementById('filterBrand').value;

    fetch('http://127.0.0.1:5000/products/search?keyword=' + keyword, { method: 'POST' })
        .then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                if (brandFilter !== "All") {
                    data = data.filter(p =>
                        p.Brand && p.Brand.toString().toLowerCase().includes(brandFilter.trim().toLowerCase())
                    );
                }
                currentProdData = data;
            } else {
                currentProdData = [];
            }
            currentProdPage = 1;
            renderProdTable();
        })
        .catch(err => {
            document.getElementById('productTableBody').innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi Backend: ${err.message}</td></tr>`;
        });
}

// ==========================================
// 3. HÀM VẼ BẢNG
// ==========================================
// ==========================================
// 3. HÀM VẼ BẢNG & XỬ LÝ NHIỀU ẢNH JSON
// ==========================================
// ==========================================
// 3. HÀM VẼ BẢNG
// ==========================================
function renderProdTable() {
    const tableBody = document.getElementById('productTableBody');
    let htmlContent = '';

    if (!currentProdData || currentProdData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4"><i>Không tìm thấy sản phẩm nào.</i></td></tr>`;
        document.querySelector('.pagination-prod').innerHTML = '';
        return;
    }

    let startIndex = (currentProdPage - 1) * prodRowsPerPage;
    let endIndex = startIndex + prodRowsPerPage;
    let paginatedData = currentProdData.slice(startIndex, endIndex);

    paginatedData.forEach(prod => {
        // Gọi hàm dịch ảnh
        let imagesHtml = renderImageJson(prod.Images);

        // Đã xóa cột Thông số (infoHtml) và cột Trạng thái để khớp với 5 cột HTML
        htmlContent += `
            <tr>
                <td><strong>${prod.ProductID}</strong></td>
                <td>
                    <div class="d-flex gap-1 align-items-center">
                        ${imagesHtml}
                    </div>
                </td>
                <td class="fw-bold text-dark">${prod.ProductName}</td>
                <td>${prod.Brand || ''}</td>
                <td class="text-center pe-3">
                    <button class="btn btn-sm btn-primary me-1" title="Quản lý biến thể"
                        onclick="window.location.href='/Admin/VariantProduct/Index?productId=${prod.ProductID}'">
                        <i class="fas fa-sitemap"></i> Chi tiết
                    </button>
                    <button class="btn btn-sm btn-light text-warning me-1" title="Sửa"
                        onclick="openEditModal('${prod.ProductID}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-light text-danger" title="Xóa" 
                        onclick="deleteProduct('${prod.ProductID}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = htmlContent;
    renderProdPagination();
}

// ==========================================
// -- HÀM PHỤ: XỬ LÝ CHUỖI JSON ẢNH TỪ PYTHON TRẢ VỀ --
// ==========================================
// Đã xóa bỏ dấu trừ lỗi ở đây
function renderImageJson(imageJsonString) {
    if (!imageJsonString) return '<span class="text-muted small">No IMG</span>';

    let imgSrc = '';

    try {
        let imgArray = JSON.parse(imageJsonString);
        // Trích xuất đúng cái link ảnh đầu tiên để làm avatar
        if (imgArray.length > 0) imgSrc = imgArray[0];
    } catch (e) {
        // Lỡ trong DB chỉ lưu 1 chuỗi text bình thường
        imgSrc = imageJsonString;
    }

    if (!imgSrc) return '<span class="text-muted small">No IMG</span>';

    // Trả về đúng 1 thẻ img
    return `
        <img src="${imgSrc}" class="border rounded bg-white shadow-sm" 
             style="width: 50px; height: 50px; object-fit: contain;">
    `;
}

// ==========================================
// 4. HÀM PHÂN TRANG 
// ==========================================
function renderProdPagination() {
    let totalPages = Math.ceil(currentProdData.length / prodRowsPerPage);
    let html = '';

    // Nếu chỉ có 1 trang hoặc không có data thì ẩn luôn thanh phân trang
    if (totalPages <= 1) {
        document.querySelector('.pagination-prod').innerHTML = '';
        return;
    }

    // Nút "Trước" (Lùi 1 trang)
    html += `<li class="page-item ${currentProdPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeProdPage(event, ${currentProdPage - 1})">Trước</a>
             </li>`;

    // Phần ở giữa: Hiển thị thông tin "Trang hiện tại / Tổng số trang"
    html += `<li class="page-item disabled">
                <span class="page-link bg-light text-dark fw-bold border-0">Trang ${currentProdPage} / ${totalPages}</span>
             </li>`;

    // Nút "Sau" (Tiến 1 trang)
    html += `<li class="page-item ${currentProdPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeProdPage(event, ${currentProdPage + 1})">Sau</a>
             </li>`;

    document.querySelector('.pagination-prod').innerHTML = html;
}

function changeProdPage(e, page) {
    e.preventDefault();
    currentProdPage = page;
    renderProdTable();
}
// Cấu hình gợi ý các trường nhập liệu theo Category
const specSuggestions = {
    "CAT8": ["Màn hình", "CPU", "RAM", "Ổ cứng", "VGA"],
    "CAT5": ["Màn hình", "Chipset", "Pin", "Camera sau"],
    "CAT1": ["Chất liệu", "Kết nối", "Tương thích"],
    "CAT4": ["Độ phân giải", "Ống kính", "Cảm biến"]
}
// Hàm vẽ các ô input gợi ý và khu vực nhập thêm
function renderDynamicFields() {
    const categoryId = document.getElementById('addCategorySelect').value;
    const area = document.getElementById('dynamicSpecArea');

    // Tạo cấu trúc: Các ô gợi ý phía trên, các ô tự thêm phía dưới
    area.innerHTML = `
        <div id="suggestedFields" class="row g-3"></div>
        <div class="col-12 mt-3 border-top pt-2">
            <div id="customFieldsContainer" class="row g-2"></div>
            <button type="button" class="btn btn-sm btn-outline-secondary mt-2" onclick="addMoreSpecField()">
                <i class="fas fa-plus me-1"></i> Thêm thông số khác (Tự định nghĩa)
            </button>
        </div>
    `;

    const suggestedContainer = document.getElementById('suggestedFields');
    const fields = specSuggestions[categoryId] || [];

    fields.forEach(field => {
        suggestedContainer.innerHTML += `
            <div class="col-md-6">
                <label class="small text-muted mb-1">${field}</label>
                <input type="text" class="form-control form-control-sm spec-field" 
                       data-key="${field}" placeholder="Nhập ${field}...">
            </div>
        `;
    });
}

// Gọi ngay khi load trang để mặc định hiện Laptop
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('addCategorySelect')) renderDynamicFields();
});

// Hàm gửi dữ liệu lên Flask
function submitAddProduct() {
    const form = document.getElementById('addProductForm');
    const formData = new FormData(form);
    let payload = Object.fromEntries(formData.entries());

    // 1. Lấy từ các ô gợi ý sẵn có (spec-field) [cite: 30]
    document.querySelectorAll('.spec-field').forEach(input => {
        const key = input.getAttribute('data-key');
        const val = input.value.trim();
        if (val) payload[key] = val;
    });

    // 2. Lấy từ các ô người dùng tự thêm (extra-spec-row)
    document.querySelectorAll('.extra-spec-row').forEach(row => {
        const key = row.querySelector('.extra-key').value.trim();
        const val = row.querySelector('.extra-val').value.trim();
        if (key && val) payload[key] = val;
    });

    fetch('http://127.0.0.1:5000/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            alert("Thêm sản phẩm thành công!");
            location.reload();
        })
        .catch(err => alert("Lỗi khi thêm: " + err.message));
}
function addMoreSpecField() {
    const container = document.getElementById('dynamicSpecArea');
    const id = Date.now();
    const html = `
        <div class="col-md-12 extra-spec-row" id="extra-${id}">
            <div class="input-group input-group-sm">
                <input type="text" class="form-control fw-bold extra-key" placeholder="Tên thông số (VD: Cân nặng)">
                <input type="text" class="form-control extra-val" placeholder="Giá trị...">
                <button class="btn btn-danger" type="button" onclick="document.getElementById('extra-${id}').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}
// ==========================================
// CHỨC NĂNG SỬA SẢN PHẨM
// ==========================================

function openEditModal(productId) {
    // 1. Gọi API lấy thông tin chi tiết sản phẩm
    fetch(`http://127.0.0.1:5000/products/${productId}`)
        .then(res => res.json())
        .then(prod => {
            // 2. Đổ dữ liệu cơ bản vào form
            document.getElementById('editProductID').value = prod.ProductID;
            document.getElementById('editProductIDDisplay').value = prod.ProductID;
            document.getElementById('editProductName').value = prod.ProductName;
            document.getElementById('editBrandSelect').value = prod.Brand;
            document.getElementById('editCategorySelect').value = prod.CategoryID;
            document.getElementById('editProductImages').value = prod.Images || '[]';

            // 3. Đổ thông số kỹ thuật (Từ Information) vào khu vực dynamic
            const area = document.getElementById('editDynamicSpecArea');
            area.innerHTML = '';

            // Back-end của ông đã bóc sẵn Information ra thành các key lẻ trong object 
            const excludedKeys = ['ProductID', 'ProductName', 'Brand', 'Images', 'CategoryID', 'Information', 'IsDeleted'];

            Object.keys(prod).forEach(key => {
                if (!excludedKeys.includes(key)) {
                    addEditSpecField(key, prod[key]);
                }
            });

            // 4. Mở Modal
            new bootstrap.Modal(document.getElementById('editProductModal')).show();
        })
        .catch(err => alert("Lỗi lấy dữ liệu: " + err.message));
}

// Hàm vẽ thêm ô nhập thông số trong Modal Sửa
function addEditSpecField(key = "", value = "") {
    const area = document.getElementById('editDynamicSpecArea');
    const id = Date.now() + Math.random();
    const html = `
        <div class="col-md-12 edit-spec-row" id="edit-row-${id}">
            <div class="input-group input-group-sm mb-2">
                <input type="text" class="form-control fw-bold edit-key" placeholder="Tên thông số" value="${key}">
                <input type="text" class="form-control edit-val" placeholder="Giá trị..." value="${value}">
                <button class="btn btn-outline-danger" type="button" onclick="document.getElementById('edit-row-${id}').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    area.insertAdjacentHTML('beforeend', html);
}

// Hàm gửi dữ liệu Cập nhật về Flask
function submitUpdateProduct() {
    const productId = document.getElementById('editProductID').value;
    const form = document.getElementById('editProductForm');
    const formData = new FormData(form);
    let payload = Object.fromEntries(formData.entries());

    // Gom thông số kỹ thuật
    document.querySelectorAll('.edit-spec-row').forEach(row => {
        const key = row.querySelector('.edit-key').value.trim();
        const val = row.querySelector('.edit-val').value.trim();
        if (key && val) payload[key] = val;
    });

    fetch(`http://127.0.0.1:5000/products/update/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            alert("Cập nhật thành công!");
            location.reload();
        })
        .catch(err => alert("Lỗi cập nhật: " + err.message));
}

// ==========================================
// CHỨC NĂNG XÓA SẢN PHẨM
// ==========================================

function deleteProduct(productId) {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm ${productId}? Việc này sẽ xóa cả các biến thể liên quan!`)) {
        fetch(`http://127.0.0.1:5000/products/delete/${productId}`, {
            method: 'DELETE' // Back-end của ông dùng PUT để xóa mềm 
        })
            .then(res => res.json())
            .then(data => {
                alert("Đã xóa sản phẩm thành công!");
                executeProdSearch(); // Tải lại bảng mà không cần F5
            })
            .catch(err => alert("Lỗi khi xóa: " + err.message));
    }
}