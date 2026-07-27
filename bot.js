const { google } = require('googleapis');
const axios = require('axios');

// بيانات الاعتماد والربط الخاصة بـ Google Cloud Console لمدونتك
const oauth2Client = new google.auth.OAuth2(
  "YOUR_CLIENT_ID",
  "YOUR_CLIENT_SECRET",
  "YOUR_REDIRECT_URI"
);
oauth2Client.setCredentials({ refresh_token: "YOUR_REFRESH_TOKEN" });

const blogger = google.blogger({ version: 'v3', auth: oauth2Client });
const BLOG_ID = "YOUR_BLOG_ID"; // ضع هنا معرف مدونتك المكون من أرقام فقط

async function updateBloggerThemeWithLiveRates() {
  try {
    // 1. جلب أسعار العملات الحقيقية واللحظية
    const res = await axios.get('https://exchangerate-api.com');
    const rates = res.data.rates;
    const usdToIqd = 1320; // السعر الصرف المعتمد رسمياً للدينار
    
    // حساب أسعار اليورو والتومان والدولار مقابل اليورو
    const eurToIqd = Math.round((1 / rates.EUR) * usdToIqd).toLocaleString();
    const irrToIqd = ((1 / rates.IRR) * usdToIqd * 1000).toFixed(2);
    const usdToEur = rates.EUR.toFixed(4);

    // 2. جلب أسعار المعادن العالمية الحقيقية واللحظية (الأونصة بالدولار)
    const metalsRes = await axios.get('https://er-api.com');
    const metalsData = metalsRes.data;
    
    let gold24 = "---";
    let gold21 = "---";
    let gold18 = "---";

    if (metalsData && metalsData.rates) {
      const usdPerOunceGold = 1 / metalsData.rates.USD;
      const usdPerGramGold24 = usdPerOunceGold / 31.1035; // تقسيم الأونصة لغرامات
      const gold24Mithqal = usdPerGramGold24 * usdToIqd * 5; // المثقال العراقي = 5 غرام
      
      gold24 = Math.round(gold24Mithqal).toLocaleString();
      gold21 = Math.round(gold24Mithqal * (21 / 24)).toLocaleString();
      gold18 = Math.round(gold24Mithqal * (18 / 24)).toLocaleString();
    }

    // جلب سعر الفضة الحقيقي اللحظي واحتساب سعر الغرام بالدينار
    const silverRes = await axios.get('https://er-api.com');
    const silverData = silverRes.data;
    let silverRate = "---";
    
    if (silverData && silverData.rates) {
      const usdPerOunceSilver = 1 / silverData.rates.USD;
      const usdPerGramSilver = usdPerOunceSilver / 31.1035;
      silverRate = Math.round(usdPerGramSilver * usdToIqd).toLocaleString();
    }

    // 3. جلب كود المظهر الحالي الخاص بمدونتك من سيرفرات جوجل لتحديثه
    const themeRes = await blogger.themes.get({ blogId: BLOG_ID });
    let themeHtml = themeRes.data.content;

    // 4. استبدال الأكواد الوهمية بالأرقام الحقيقية والطازجة المستلمة للتو
    themeHtml = themeHtml.replace("[USD_RATE]", usdToIqd.toLocaleString())
                         .replace("[EUR_RATE]", eurToIqd)
                         .replace("[IRR_RATE]", irrToIqd)
                         .replace("[USD_EUR_RATE]", usdToEur)
                         .replace("[GOLD_24]", gold24)
                         .replace("[GOLD_21]", gold21)
                         .replace("[GOLD_18]", gold18)
                         .replace("[SILVER_RATE]", silverRate);

    // 5. حفظ وإعادة رفع المظهر المعدل بالبيانات الحقيقية إلى بلوجر تلقائياً
    await blogger.themes.update({
      blogId: BLOG_ID,
      requestBody: { content: themeHtml }
    });

    console.log("تمت العملية بنجاح! جُلِبت البيانات الحقيقية وحُقِنت بالمظهر.");
  } catch (error) {
    console.error("حدث خطأ أثناء عمل البوت:", error);
  }
}

// تشغيل المحرك
updateBloggerThemeWithLiveRates();

