// ==========================================
// CÁC BIẾN TOÀN CỤC
// ==========================================
let currentProductId = null;
let parentProductData = null; // Lưu để gộp Information

document.addEventListener("DOMContentLoaded", function () {
    // 1. Lấy ProductID từ thanh URL (?productId=PROD...)
    const urlParams = new URLSearchParams(window.location.search);
    currentProductId = urlParams.get('productId');

    if (currentProductId) {
        document.getElementById('parentProductIdDisplay').innerText = currentProductId;
        loadParentProductInfo();
        loadVariantsOfProduct();
    } else {
        alert("Lỗi: Không tìm thấy Mã Sản phẩm trên URL!");
        window.history.back();
    }
});

// ==========================================
// 2. LẤY THÔNG TIN SP CHA (Lấy Tên, Ảnh đại diện & Thông số chung)
// ==========================================
function loadParentProductInfo() {
    fetch(`http://127.0.0.1:5000/products/${currentProductId}`)
        .then(res => res.json())
        .then(data => {
            // Fix: Kiểm tra nó là object có chứa ProductID
            if (data && data.ProductID) {
                parentProductData = data;
                document.getElementById('parentProductName').innerText = parentProductData.ProductName;

                try {
                    let imgArray = JSON.parse(parentProductData.Images);
                    if (imgArray.length > 0) {
                        document.getElementById('parentProdImg').innerHTML = `<img src="${imgArray[0]}" class="border rounded shadow-sm bg-white" style="width: 50px; height: 50px; object-fit: contain;">`;
                    }
                } catch (e) { }
            }
        });
}

// ==========================================
// 3. LẤY DANH SÁCH BIẾN THỂ CON VÀ VẼ BẢNG
// ==========================================
function loadVariantsOfProduct() {
    fetch('http://127.0.0.1:5000/variants/getall')
        .then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
            return res.json();
        })
        .then(data => {
            // Chỉ lấy các biến thể của con máy này và chưa bị xóa mềm
            let variants = data.filter(v => v.ProductID === currentProductId && v.IsDeleted === false);
            renderVariantTable(variants);
        })
        .catch(err => {
            document.getElementById('variantTableBody').innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi kết nối Server: ${err.message}</td></tr>`;
        });
}

function renderVariantTable(variants) {
    const tbody = document.getElementById('variantTableBody');
    if (variants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i>Sản phẩm này chưa có phiên bản/cấu hình nào.</i></td></tr>`;
        return;
    }

    tbody.innerHTML = variants.map(v => {
        let statusBadge = v.Status === 'New' ? 'bg-success' : 'bg-secondary';
        let imgSrc = v.Image ? v.Image : 'https://via.placeholder.com/50?text=No+Img';

        // Truyền cả object variant vào hàm qua JSON.stringify
        let btnView = `<button class="btn btn-sm btn-info text-white me-1" title="Xem Chi tiết" onclick='viewMergedSpecs(${JSON.stringify(v).replace(/'/g, "\\'")})'>
                           <i class="fas fa-eye"></i> Chi tiết
                       </button>`;

        return `
        <tr>
            <td><strong>${v.ProductVariantID}</strong></td>
            <td><img src="${imgSrc}" class="border rounded bg-white shadow-sm" style="width: 45px; height: 45px; object-fit: contain;"></td>
            <td><span class="fw-semibold text-dark">${v.Color || '-'}</span></td>
            <td class="text-danger fw-bold">${(v.SellingPrice || 0).toLocaleString('vi-VN')} đ</td>
            <td class="text-center"><span class="badge bg-light text-dark border">${v.StockQuantity || 0}</span></td>
            <td class="text-center"><span class="badge ${statusBadge} px-3 py-1 rounded-pill">${v.Status || 'New'}</span></td>
            <td class="text-center">
                ${btnView}
                <button class="btn btn-sm btn-light text-warning me-1" title="Sửa"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-light text-danger" title="Xóa"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');
}

// ==========================================
// 4. HÀM SIÊU CẤP: HIỂN THỊ MODAL (ẢNH TO + THÔNG SỐ GỘP)
// ==========================================
function viewMergedSpecs(variant) {
    // 1. TẠO ĐỐI TƯỢNG CHỨA TẤT CẢ THÔNG SỐ
    let fullSpecs = {};

    // 2. NHẶT TỪ CHA (parentProductData)
    // Loại bỏ các cột quản lý, còn lại là thông số kỹ thuật (RAM, CPU, Màn hình...)
    if (parentProductData) {
        let excludedParent = ['ProductID', 'ProductName', 'Brand', 'Images', 'CategoryID', 'Information', 'IsDeleted'];
        Object.keys(parentProductData).forEach(key => {
            if (!excludedParent.includes(key) && parentProductData[key] !== null && parentProductData[key] !== "") {
                fullSpecs[key] = parentProductData[key];
            }
        });
    }

    // 3. NHẶT TỪ CON (variant) - Ưu tiên đè lên nếu trùng key
    let excludedVariant = ['ProductVariantID', 'ProductID', 'Color', 'SellingPrice', 'StockQuantity', 'Image', 'Status', 'IsDeleted', 'Description'];
    Object.keys(variant).forEach(key => {
        if (!excludedVariant.includes(key) && variant[key] !== null && variant[key] !== "") {
            fullSpecs[key] = variant[key];
        }
    });

    // --- VẼ GIAO DIỆN MODAL ---
    let imgSrc = (variant.Image && variant.Image.trim() !== "") ? variant.Image : 'https://via.placeholder.com/250?text=No+Image';
    let priceFormat = (variant.SellingPrice || 0).toLocaleString('vi-VN');

    let html = `
        <div class="row mb-4">
            <div class="col-md-5 d-flex align-items-center justify-content-center bg-white border rounded p-3">
                <img src="${imgSrc}" class="img-fluid" style="max-height: 220px; object-fit: contain;">
            </div>
            <div class="col-md-7">
                <h5 class="text-danger fw-bold border-bottom pb-2 mb-3">Thông tin bán hàng</h5>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item px-0 py-1 d-flex justify-content-between"><span>Mã:</span> <strong>${variant.ProductVariantID}</strong></li>
                    <li class="list-group-item px-0 py-1 d-flex justify-content-between"><span>Màu:</span> <strong>${variant.Color || 'N/A'}</strong></li>
                    <li class="list-group-item px-0 py-1 d-flex justify-content-between"><span>Giá:</span> <strong class="text-danger">${priceFormat} đ</strong></li>
                </ul>
            </div>
        </div>
        <h5 class="text-primary fw-bold mb-3 border-bottom pb-2">Thông số kỹ thuật chi tiết</h5>
    `;

    // VẼ BẢNG THÔNG SỐ SAU KHI GỘP
    if (Object.keys(fullSpecs).length === 0) {
        html += '<p class="text-center text-muted"><i>Chưa cập nhật thông số kỹ thuật.</i></p>';
    } else {
        html += '<ul class="list-group list-group-flush border rounded">';
        for (const [key, value] of Object.entries(fullSpecs)) {
            // Nếu là nhóm thông số (Object lồng)
            if (typeof value === 'object' && value !== null) {
                html += `<li class="list-group-item bg-light fw-bold">${key}</li>`;
                for (const [subK, subV] of Object.entries(value)) {
                    html += `<li class="list-group-item d-flex justify-content-between ms-3">
                                <span class="text-muted">${subK}</span> <strong>${subV}</strong>
                             </li>`;
                }
            } else {
                html += `<li class="list-group-item d-flex justify-content-between">
                            <span class="text-muted">${key}</span> <strong>${value}</strong>
                         </li>`;
            }
        }
        html += '</ul>';
    }

    document.getElementById('fullSpecsBody').innerHTML = html;
    new bootstrap.Modal(document.getElementById('fullSpecsModal')).show();
}