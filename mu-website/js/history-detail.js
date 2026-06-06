 const HISTORY_DATA = {
      "2026-4everest-cup": {
        year: "2026",
        label: "4EVEREST CUP 2026",
        title: "🥇 4EVEREST CUP 2026 – Nhà Vô Địch",
        badge: "VÔ ĐỊCH",
        badgeClass: "gold",
        intro: "Chức vô địch đầu tiên trong lịch sử — cột mốc vàng son của NONE BIT FC.",
        sections: [
          {
            heading: "Hành Trình Đến Ngôi Vương",
            content: "Sau những mùa giải tích lũy kinh nghiệm và bản lĩnh, NONE BIT FC đã bùng nổ mạnh mẽ tại 4EVEREST CUP 2026. Với phong độ ấn tượng xuyên suốt giải đấu, tinh thần chiến đấu kiên cường và sự gắn kết của một tập thể đoàn kết, đội bóng đã vượt qua hàng loạt thử thách để bước lên ngôi vị cao nhất."
          },
          {
            heading: "Ý Nghĩa Lịch Sử",
            content: "Chức vô địch 4EVEREST CUP 2026 không chỉ là thành quả xứng đáng cho những nỗ lực không ngừng nghỉ mà còn là minh chứng rõ nét cho sự phát triển vượt bậc của câu lạc bộ. Đây là cột mốc vàng son, khẳng định NONE BIT FC đã sẵn sàng chinh phục những mục tiêu lớn hơn trong tương lai."
          }
        ]
      },
      "2026-itde-cup": {
        year: "2026",
        label: "ITDE CUP 2026",
        title: "🥈 ITDE CUP 2026 – Á Quân Giải Đấu",
        badge: "Á QUÂN",
        badgeClass: "silver",
        intro: "Tiếp tục khẳng định vị thế trong cộng đồng bóng đá sinh viên.",
        sections: [
          {
            heading: "Sự Trưởng Thành Vượt Bậc",
            content: "Bước sang năm 2026, NONE BIT FC tiếp tục cho thấy sự trưởng thành vượt bậc cả về chuyên môn lẫn bản lĩnh thi đấu. Tại ITDE CUP 2026, đội bóng đã trình diễn lối chơi gắn kết, kỷ luật và hiệu quả trước nhiều đối thủ mạnh."
          },
          {
            heading: "Vị Thế Ngày Càng Lớn Mạnh",
            content: "Hành trình tiến đến trận chung kết là minh chứng cho sự nỗ lực không ngừng của toàn đội. Dù chưa thể chạm tay vào chức vô địch, danh hiệu Á quân lần thứ hai đã khẳng định vị thế ngày càng lớn mạnh của NONE BIT FC trong cộng đồng bóng đá sinh viên, đồng thời cho thấy câu lạc bộ đang từng bước vươn mình trở thành một thế lực đáng gờm."
          }
        ]
      },
      "2025-ib-cup": {
        year: "2025",
        label: "IB CUP 2025",
        title: "🏆 IB CUP 2025 – Á Quân &amp; Lần Ra Mắt Lịch Sử",
        badge: "Á QUÂN",
        badgeClass: "silver",
        intro: "Cột mốc lịch sử — lần đầu tiên NONE BIT FC tham dự và tiến thẳng vào chung kết.",
        sections: [
          {
            heading: "Ngày Ra Mắt Đáng Nhớ",
            content: "Năm 2025 đánh dấu cột mốc lịch sử khi NONE BIT FC chính thức được thành lập và lần đầu tiên tham dự một giải đấu chính thức. Dù chỉ mới tập hợp những thành viên có chung niềm đam mê bóng đá, đội bóng đã nhanh chóng tạo nên dấu ấn mạnh mẽ tại IB CUP 2025."
          },
          {
            heading: "Nền Tảng Cho Tương Lai",
            content: "Với tinh thần đoàn kết, sự nhiệt huyết và khát khao khẳng định bản thân, NONE BIT FC đã xuất sắc tiến vào trận chung kết và giành ngôi Á quân. Thành tích này không chỉ là danh hiệu đầu tiên trong lịch sử câu lạc bộ mà còn là nền tảng vững chắc cho hành trình phát triển sau này."
          }
        ]
      },
      "2025-founding": {
        year: "2025",
        label: "Thành Lập CLB",
        title: "⚽ Ngày Thành Lập – NONE BIT FC Ra Đời",
        badge: "KHỞI ĐẦU",
        badgeClass: "default",
        intro: "Từ niềm đam mê chung, một câu lạc bộ được sinh ra.",
        sections: [
          {
            heading: "Khởi Nguồn Từ Đam Mê",
            content: "NONE BIT FC được thành lập bởi những người có chung niềm đam mê bóng đá trong cộng đồng Banking IT. Từ những buổi tập luyện đầu tiên đến việc đăng ký tham dự giải đấu chính thức, mỗi bước đi đều được xây dựng trên tinh thần đoàn kết và yêu bóng đá chân thành."
          },
          {
            heading: "Sứ Mệnh & Tầm Nhìn",
            content: "The Pride of Banking IT — câu lạc bộ không chỉ là nơi để thi đấu mà còn là mái nhà chung gắn kết những con người cùng chí hướng. Từ ngày thành lập, NONE BIT FC đã xác định sứ mệnh: thi đấu với hết mình, phát triển không ngừng và trở thành niềm tự hào của cộng đồng."
          }
        ]
      }
    };

    function renderDetail() {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("slug");
      const data = HISTORY_DATA[slug];
      const container = document.getElementById("history-detail");
      if (!data || !container) return;

      const badgeColors = {
        gold: "background:linear-gradient(135deg,#f9c923,#e6a800);color:#1a1200;",
        silver: "background:linear-gradient(135deg,#c0c0c0,#8a8a8a);color:#fff;",
        default: "background:linear-gradient(135deg,#444,#222);color:#fff;"
      };

      const sectionsHTML = data.sections.map(s => `
        <h3 style="font-family:var(--font-display,serif);font-size:1.2rem;margin:2rem 0 0.75rem;letter-spacing:0.05em;">${s.heading}</h3>
        <p style="line-height:1.85;color:var(--color-text-muted,#aaa);">${s.content}</p>
      `).join("");

      container.innerHTML = `
        <div class="news-detail-hero">
          <div class="news-detail-visual" style="display:flex;align-items:center;justify-content:center;font-size:5rem;">
            ${data.title.charAt(0) === "🥇" ? "🥇" : data.title.charAt(0) === "🥈" ? "🥈" : data.title.charAt(0) === "🏆" ? "🏆" : "⚽"}
          </div>
          <div class="news-detail-header">
            <span class="section-label" style="${badgeColors[data.badgeClass] || badgeColors.default}padding:0.3rem 1rem;border-radius:4px;font-weight:700;letter-spacing:0.1em;">
              ${data.badge}
            </span>
            <h1 class="section-title" style="margin-top:1rem;">${data.title}</h1>
            <div class="news-detail-meta">
              <span>${data.label}</span>
            </div>
            <p class="news-detail-intro">${data.intro}</p>
          </div>
        </div>
        <div class="news-detail-body" style="padding:2rem 2.5rem 2.5rem;">
          ${sectionsHTML}
          <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.1);">
            <a href="history.html" class="btn btn-outline">← Quay lại Thành Tích</a>
          </div>
        </div>
      `;

      document.title = `${data.label} – NONE BIT FC`;
    }

    renderDetail();