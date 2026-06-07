const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace contact form group
html = html.replace(/<div class="contact-form-group">[\s\S]*?GỬI NGAY<\/button>/, `<form id="contact-form" onsubmit="return false;">
              <div class="contact-form-group">
                <label>Tên của bạn *</label>
                <input type="text" id="contact-name" placeholder="Nguyễn Văn A" required />
              </div>
              <div class="contact-form-group">
                <label>Số Điện Thoại / Zalo *</label>
                <input type="tel" id="contact-phone" placeholder="09xxxxxxxx" required />
              </div>
              <div class="contact-form-group">
                <label>Mục đích liên hệ</label>
                <select id="contact-subject">
                  <option value="Xin gia nhập đội bóng">Xin gia nhập đội bóng</option>
                  <option value="Mời đá giao hữu (Cáp kèo)">Mời đá giao hữu (Cáp kèo)</option>
                  <option value="Tài trợ / Quảng cáo">Tài trợ / Quảng cáo</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div class="contact-form-group">
                <label>Nội dung *</label>
                <textarea id="contact-message" placeholder="Nội dung tin nhắn của bạn..." required></textarea>
              </div>
              <button type="submit" id="contact-submit" class="btn btn-primary" style="width:100%;justify-content:center;">GỬI NGAY</button>
            </form>`);

if (!html.includes('js/contact.js')) {
    html = html.replace('<script src="js/language.js', 
    `<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
  <script src="js/language.js`);
    html = html.replace('</body>', `  <script src="js/contact.js?v=2"></script>\n</body>`);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed index.html contact form!');
