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
        // Đã fix: Gọi đúng prod.Image theo SQL của mày
        let imagesHtml = renderImageJson(prod.Images);

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
                
                <td>${infoHtml}</td>
                
                <td class="text-center">
                    <span class="badge bg-success rounded-pill px-3">Active</span>
                </td>
                <td class="text-center pe-3">
                    <button class="btn btn-sm btn-primary me-1" title="Quản lý biến thể"
                        onclick="window.location.href='/Admin/VariantProduct/Index?productId=${prod.ProductID}'">
                        <i class="fas fa-sitemap"></i> Chi tiết
                    </button>
                    <button class="btn btn-sm btn-light text-warning me-1" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger" title="Xóa"><i class="fas fa-trash-alt"></i></button>
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