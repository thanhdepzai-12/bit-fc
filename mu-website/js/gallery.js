document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("videoModal");
    const modalIframe = document.getElementById("modalIframe");
    const closeModal = document.getElementById("closeModal");
    const videoItems = document.querySelectorAll('.gallery-item[data-type="video"]');

    videoItems.forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            // Lấy link embed được lưu trong thuộc tính data-video của item đó
            const videoSrc = this.getAttribute("data-video");

            if (videoSrc) {
                modalIframe.src = videoSrc + "?autoplay=1"; // Thêm autoplay để tự chạy khi mở popup
                modal.style.display = "flex"; // Hiện popup (dùng flex để căn giữa theo CSS của bạn)
            }
        });
    });

    // 2. Xử lý đóng popup khi bấm vào nút (X)
    closeModal.addEventListener("click", function () {
        modal.style.display = "none";
        modalIframe.src = ""; // Xóa src để video dừng phát hoàn toàn, không bị chạy ẩn
    });

    // 3. Xử lý đóng popup khi bấm ra ngoài vùng đen (nền modal)
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.style.display = "none";
            modalIframe.src = "";
        }
    });
});