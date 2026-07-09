const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { URL } = require('url');

const AFFILIATE_ID = '17351900574';

function applyAffiliate(targetUrl) {
  const separator = targetUrl.includes('?') ? '&' : '?';
  return `${targetUrl}${separator}af_id=${AFFILIATE_ID}`;
}

function extractRealLink(redirectUrl) {
  try {
    const parsed = new URL(redirectUrl);
    const realUrl = parsed.searchParams.get('url');
    return realUrl ? decodeURIComponent(realUrl) : redirectUrl;
  } catch {
    return redirectUrl;
  }
}

async function crawlVouchers() {
  const cacheBuster = Date.now();
  const apiUrl = `https://www.shopeeanalytics.com/api/voucher/data/voucher-list-today_list.txt?v=${cacheBuster}`;

  const { data: html } = await axios.get(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://www.shopeeanalytics.com/vn/ma-giam-gia.html'
    }
  });

  const $ = cheerio.load(html);
  const vouchers = [];

  $('.bc_voucher_item').each((i, el) => {
    const title = $(el).find('.bc_voucher_title span').last().text().trim();
    const rawLink = $(el).find('a.bc_voucher_logo').attr('href');

    if (rawLink) {
      const realLink = extractRealLink(rawLink);
      vouchers.push({
        title: title || 'Mã giảm giá Shopee',
        originalLink: realLink,
        affiliateLink: applyAffiliate(realLink),
        crawledAt: new Date().toISOString()
      });
    }
  });

  fs.writeFileSync('voucher-data.json', JSON.stringify(vouchers, null, 2));
  console.log(`Đã cào được ${vouchers.length} mã, ghi vào voucher-data.json`);
}

crawlVouchers().catch(err => console.error('Lỗi:', err.message));