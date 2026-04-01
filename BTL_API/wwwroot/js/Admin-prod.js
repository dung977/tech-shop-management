// ==========================================
// 1. CÁC BIẾN TOÀN CỤC CHO PHÂN TRANG (Giống Admin-emp.js)
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
                // Lọc thêm bằng Javascript theo Brand (giống cách bạn lọc Role/Area)
                if (brandFilter !== "All") {
                    data = data.filter(p => p.Brand === brandFilter);
                }
                currentProdData = data;
            } else {
                currentProdData = [];
            }
            currentProdPage = 1;
            renderProdTable();
        })
        .catch(err => {
            document.getElementById('productTableBody').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi Backend: ${err.message}</td></tr>`;
        });
}

// ==========================================
// 3. HÀM VẼ BẢNG & XỬ LÝ NHIỀU ẢNH JSON
// ==========================================
// ==========================================
// 3. HÀM VẼ BẢNG & XỬ LÝ NHIỀU ẢNH JSON
// ==========================================
function renderProdTable() {
    const tableBody = document.getElementById('productTableBody');
    let htmlContent = '';

    // Kiểm tra nếu mảng trống
    if (!currentProdData || currentProdData.length === 0) {
        // Cập nhật colspan thành 8 vì bảng của bạn giờ đã có 8 cột (thêm cột Thông số)
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4"><i>Không tìm thấy sản phẩm nào.</i></td></tr>`;
        document.querySelector('.pagination-prod').innerHTML = '';
        return;
    }

    // Cắt mảng để phân trang
    let startIndex = (currentProdPage - 1) * prodRowsPerPage;
    let endIndex = startIndex + prodRowsPerPage;
    let paginatedData = currentProdData.slice(startIndex, endIndex);

    // VÒNG LẶP
    paginatedData.forEach(prod => {

        let statusBadge = prod.Status === 'Active' ? 'bg-success' : 'bg-secondary';

        // Gọi các hàm phụ dịch JSON 
        let imagesHtml = renderImageJson(prod.Image);
        let infoHtml = renderInformationJson(prod.Information);

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
                    <span class="badge ${statusBadge} rounded-pill px-3">${prod.Status || 'Active'}</span>
                </td>
                <td class="text-center pe-3">
                    <button class="btn btn-sm btn-light text-info" title="Xem chi tiết" onclick="openVariantModal('${prod.ProductID}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-light text-primary" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger" title="Xóa"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }); 

    // Đổ dữ liệu ra HTML và gọi hàm vẽ phân trang
    tableBody.innerHTML = htmlContent;
    renderProdPagination();
}



// -- HÀM PHỤ: XỬ LÝ CHUỖI JSON ẢNH TỪ PYTHON TRẢ VỀ --
function renderImageJson(imageJsonString) {
    if (!imageJsonString) return '<span class="text-muted small">No IMG</span>';
    try {
        // Parse cái string JSON thành mảng JavaScript
        let imgArray = JSON.parse(imageJsonString);
        let html = '';

        // Lấy 2 ảnh đầu tiên in ra thẻ <img>
        let maxDisplay = 2;
        for (let i = 0; i < imgArray.length && i < maxDisplay; i++) {
            html += `<img src="/img/${imgArray[i]}" class="border rounded" style="width: 40px; height: 40px; object-fit: cover;">`;
        }

        // Nếu mảng có > 2 ảnh, in ra cái số +N
        if (imgArray.length > maxDisplay) {
            html += `<div class="bg-light text-muted border rounded d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; font-size: 12px; font-weight: bold;">+${imgArray.length - maxDisplay}</div>`;
        }
        return html;
    } catch (e) {
        // Nếu chuỗi gửi xuống không phải JSON hợp lệ, in thẳng nó ra như 1 link bt
        return `<img src="/img/${imageJsonString}" class="border rounded" style="width: 40px; height: 40px; object-fit: cover;">`;
    }
}

// ==========================================
// 4. HÀM PHÂN TRANG 
// ==========================================
function renderProdPagination() {
    let totalPages = Math.ceil(currentProdData.length / prodRowsPerPage);
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        let activeClass = (i === currentProdPage) ? 'active' : '';
        let style = (i === currentProdPage) ? 'style="background-color: #1b45cf; border-color: #1b45cf; color: white;"' : '';
        html += `<li class="page-item ${activeClass}">
                    <a class="page-link" href="#" ${style} onclick="changeProdPage(event, ${i})">${i}</a>
                 </li>`;
    }
    document.querySelector('.pagination-prod').innerHTML = html;
}

function changeProdPage(e, page) {
    e.preventDefault();
    currentProdPage = page;
    renderProdTable();
}

// ==========================================
// 5. HÀM MỞ MODAL XEM CHI TIẾT BIẾN THỂ (Con Mắt)
// ==========================================
function openVariantModal(productId) {
    fetch(`http://127.0.0.1:5000/products/${productId}/variants`)
        .then(response => {
            // Nếu Backend trả về 404 (Sản phẩm chưa có biến thể nào)
            if (response.status === 404) {
                return [];
            }
            if (!response.ok) throw new Error("Lỗi kết nối Server");
            return response.json();
        })
        .then(data => {
            const tbody = document.getElementById('variantTableBody');
            let html = '';

            // Xử lý trường hợp mảng rỗng hoặc chứa key "message" báo lỗi
            if (!data || data.length === 0 || data.message) {
                html = `<tr><td colspan="5" class="text-center text-muted py-4">Sản phẩm này chưa có biến thể nào.</td></tr>`;
            } else {
                // Duyệt mảng và vẽ từng dòng
                data.forEach(v => {
                    html += `
                        <tr>
                            <td><strong>${v.ProductVariantID}</strong></td>
                            <td>${v.Color || 'N/A'}</td>
                            <td class="text-danger fw-bold">${v.SellingPrice ? v.SellingPrice.toLocaleString() + ' đ' : '0 đ'}</td>
                            <td class="text-center">
                                <span class="badge bg-info text-dark rounded-pill px-3">${v.StockQuantity || 0}</span>
                            </td>
                            <td><small class="text-muted">${v.Description || ''}</small></td>
                        </tr>
                    `;
                });
            }

            // Đổ HTML vào bảng
            tbody.innerHTML = html;

            // Bật Modal lên
            var myModal = new bootstrap.Modal(document.getElementById('variantModal'));
            myModal.show();
        })
        .catch(error => {
            console.error('Lỗi khi tải biến thể:', error);
            alert("Không thể tải danh sách biến thể!");
        });
}
// -- HÀM PHỤ: XỬ LÝ CHUỖI JSON THÔNG SỐ (INFORMATION) --
function renderInformationJson(infoString) {
    if (!infoString) return '<span class="text-muted small">Không có thông số</span>';

    try {
        // Dịch chuỗi thành Object JS
        let infoObj = JSON.parse(infoString);
        let html = '<ul class="list-unstyled mb-0" style="font-size: 0.8rem;">';

        // Lặp qua từng key-value (VD: CPU - A17 Pro)
        for (const [key, value] of Object.entries(infoObj)) {
            html += `<li><strong>${key}:</strong> <span class="text-muted">${value}</span></li>`;
        }
        html += '</ul>';
        return html;
    } catch (e) {
        // Lỡ dữ liệu nhập vào không phải chuẩn JSON thì in ra chữ bình thường
        return `<small class="text-muted">${infoString}</small>`;
    }
}