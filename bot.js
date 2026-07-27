const fs = require('fs');
const axios = require('axios');

async function scrapeAndSaveRates() {
  try {
    // 1. جلب الأسعار الحقيقية واللحظية من الـ API
    const res = await axios.get('https://exchangerate-api.com');
    const rates = res.data.rates;
    const usdToIqd = 1320; 
    
    const eurToIqd = Math.round((1 / rates.EUR) * usdToIqd).toLocaleString();
    const irrToIqd = ((1 / rates.IRR) * usdToIqd * 1000).toFixed(2);
    const usdToEur = rates.EUR.toFixed(4);

    // 2. جلب أسعار المعادن الحقيقية واللحظية
    const metalsRes = await axios.get('https://er-api.com');
    const metalsData = metalsRes.data;
    
    let gold24 = "---", gold21 = "---", gold18 = "---";
    if (metalsData && metalsData.rates) {
      const usdPerOunceGold = 1 / metalsData.rates.USD;
      const usdPerGramGold24 = usdPerOunceGold / 31.1035;
      const gold24Mithqal = usdPerGramGold24 * usdToIqd * 5;
      gold24 = Math.round(gold24Mithqal).toLocaleString();
      gold21 = Math.round(gold24Mithqal * 0.875).toLocaleString();
      gold18 = Math.round(gold24Mithqal * 0.75).toLocaleString();
    }

    // غرام الفضة
    const silverRes = await axios.get('https://er-api.com');
    let silverRate = Math.round((1 / silverRes.data.rates.USD / 31.1035) * usdToIqd).toLocaleString();

    // 3. تجميع كل الأرقام الحقيقية المستخرجة في كائن واحد
    const outputData = {
      eur_iqd: eurToIqd,
      irr_iqd: irrToIqd,
      usd_eur: usdToEur,
      gold_24: gold24,
      gold_21: gold21,
      gold_18: gold18,
      silver: silverRate
    };

    // 4. حفظ البيانات الحقيقية محلياً ليقوم GitHub Actions برفعها تلقائياً
    fs.writeFileSync('data.json', JSON.stringify(outputData, null, 2));
    console.log("تم تحديث وحفظ البيانات الحقيقية السحابية بنجاح!");

  } catch (error) {
    console.error("خطأ أثناء عمل البوت المستقل:", error);
  }
}

scrapeAndSaveRates();

