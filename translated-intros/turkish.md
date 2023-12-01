   # **BrowserBox: Güvenli ve İzole Web Taramanız için Kapınız**

   BrowserBox, sıfır güven uzaktan tarayıcı izolasyonu ve güvenli belge geçidi teknolojisi ile web uygulaması sanallaştırmasında yeni bir dönem başlatıyor. Çok oyunculu tarayıcı özellikleriyle her cihazda kısıtlama olmaksızın web görünümleri yerleştirin.

   **Ana Özellikler:**

   | Özellik                                       | Mevcutluk |
   | --------------------------------------------- | :-------: |
   | Tor desteği ile geliştirilmiş gizlilik        |     ✅    |
   | İlerici Web Uygulaması (PWA) olarak yüklenebilir |     ✅    |
   | Sıfır Güven modeline uyar                      |     ✅    |

   **Platform Mevcutluğu:**

   | Platform                   | Mevcutluk |
   | -------------------------- | :-------: |
   | Docker                     |     ✅    |
   | Ubuntu                     |     ✅    |
   | Debian                     |     ✅    |
   | CentOS 9                   |     ✅    |
   | macOS                      |     ✅    |
   | Amazon Linux (AWS EC2)     |     ✅    |
   | Windows WSL                |     ✅    |
   | Windows*                   |     ❌    |

   *Windows desteği şu anda geliştirme aşamasındadır.

   **Temel Kurulum Talimatları:**

   *GitHub Yükleme Yöntemi:*
   ```bash
   git clone https://github.com/BrowserBox/BrowserBox.git
   cd BrowserBox
   ./deploy-scripts/global_install.sh <my_hostname> <my_email>
   setup_bbpro --port <my_port>
   bbpro
   ```

   *Docker Hızlı Başlangıç:*
   ```bash
   PORT=8080 # veya tercih ettiğiniz port
   bash <(curl -s https://raw.githubusercontent.com/BrowserBox/BrowserBox/f2162a8553c0f91068127bd3063eaf2fdc4d005d/deploy-scripts/run_docker.sh) $PORT
   ```

   **Lisanslama ve Daha Fazla Bilgi:**
   Detaylı talimatlar, özellik açıklamaları ve lisans seçenekleri için [Dosyago Web Sitesi](https://dosyago.com)’ni ziyaret edin. Lisans sorgulamaları için [sales@dosyago.com](mailto:sales@dosyago.com) adresine e-posta gönderin. Kapsamlı bilgi için İngilizce tam README'ye [buradan](https://github.com/BrowserBox/BrowserBox/blob/boss/README.md) ulaşabilirsiniz.

   **Not:** BrowserBox arayüzü şu anda sadece İngilizce olarak mevcuttur. Gelecekte ek diller için destek planlanmaktadır.
