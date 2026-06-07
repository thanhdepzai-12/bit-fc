const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace contact form
const oldForm = `<div class="contact-form-group">
              <label>Tên của bạn</label>
              <input type="text" placeholder="Nguyễn Văn A" />
            </div>
            <div class="contact-form-group">
              <label>Số Điện Thoại / Zalo</label>
              <input type="tel" placeholder="09xxxxxxxx" />
            </div>
            <div class="contact-form-group">
              <label>Mục đích liên hệ</label>
              <select>
                <option>Xin gia nhập đội bóng</option>
                <option>Mời đá giao hữu (Cáp kèo)</option>
                <option>Tài trợ / Quảng cáo</option>
                <option>Khác</option>
              </select>
            </div>
            <div class="contact-form-group">
              <label>Nội dung</label>
              <textarea placeholder="Nội dung tin nhắn của bạn..."></textarea>
            </div>
            <button class="btn btn-primary" style="width:100%;justify-content:center;"
              onclick="alert('Tin nhắn đã được gửi! Chúng tôi sẽ liên hệ sớm nhất.')">GỬI NGAY</button>`;

const newForm = `<form id="contact-form" onsubmit="return false;">
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
            </form>`;

html = html.replace(oldForm, newForm);

// 2. Add scripts
const oldScripts = `<script src="js/main.js"></script>`;
const newScripts = `<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
  <script src="js/language.js?v=6"></script>
  <script src="js/main.js"></script>
  <script src="js/contact.js?v=1"></script>`;

if (!html.includes('js/contact.js')) {
  html = html.replace(oldScripts, newScripts);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Finalized index.html!');
