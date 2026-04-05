document.addEventListener("DOMContentLoaded", function () {
    loadRevenue();
    loadTopProducts();
    loadTopCustomers();
});

// 1. TẢI TỔNG DOANH THU
function loadRevenue() {
    // Lưu ý: Đổi chữ 'reports' thành URL prefix thật trong app.py của ông
    fetch('http://127.0.0.1:5000/reports/revenue')
        .then(res => res.json())
        .then(data => {
            const rev = data.TotalRevenue || 0;
            document.getElementById('totalRevenue').innerText = rev.toLocaleString('vi-VN') + " đ";
        })
        .catch(err => document.getElementById('totalRevenue').innerText = "Lỗi tải!");
}

// 2. TẢI TOP 10 SẢN PHẨM
function loadTopProducts() {
    fetch('http://127.0.0.1:5000/reports/top-products')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('topProductsTable');
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Chưa có dữ liệu bán hàng.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.map((item, index) => {
                let badgeClass = index < 3 ? 'bg-danger' : 'bg-secondary'; // Top 3 thì màu đỏ
                return `
                <tr>
                    <td class="ps-3"><span class="badge ${badgeClass}">${index + 1}</span></td>
                    <td class="fw-bold">${item.ProductName}</td>
                    <td>${item.Color || ''}</td>
                    <td class="text-center pe-3 fw-bold text-success">${item.TotalSold}</td>
                </tr>`;
            }).join('');
        })
        .catch(err => console.error("Lỗi:", err));
}

// 3. TẢI TOP 3 KHÁCH HÀNG VIP
function loadTopCustomers() {
    fetch('http://127.0.0.1:5000/reports/top-customers')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('topCustomersTable');
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">Chưa có dữ liệu khách hàng.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.map((item, index) => {
                // Đổi icon xếp hạng
                let rankIcon = index === 0 ? '<i class="fas fa-trophy text-warning fa-lg"></i>' :
                    index === 1 ? '<i class="fas fa-medal text-secondary fa-lg"></i>' :
                        '<i class="fas fa-award fa-lg" style="color: #cd7f32;"></i>'; // Màu đồng

                const totalSpent = (item.TotalSpent || 0).toLocaleString('vi-VN');

                return `
                <tr>
                    <td class="ps-3 text-center" style="width: 50px;">${rankIcon}</td>
                    <td>
                        <strong class="text-primary">${item.FullName}</strong><br/>
                        <small class="text-muted"><i class="fas fa-phone fa-sm"></i> ${item.Phone || 'N/A'}</small>
                    </td>
                    <td class="text-end pe-3 fw-bold text-danger">${totalSpent} đ</td>
                </tr>`;
            }).join('');
        })
        .catch(err => console.error("Lỗi:", err));
}