const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// خدمة الملفات الثابتة (public folder)
app.use(express.static('public'));

// نقطة نهاية تجلب الموقع
app.get('/fetch', async (req, res) => {
    const siteUrl = req.query.url;

    if (!siteUrl) {
        return res.status(400).json({ error: 'يرجى إدخال رابط الموقع' });
    }

    // نتأكد أن الرابط يبدأ بـ http
    let targetUrl = siteUrl;
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'http://' + targetUrl;
    }

    try {
        // نجلب محتوى الموقع
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000,
            maxRedirects: 5
        });

        const html = response.data;

        // نستخدم Cheerio لتعديل الروابط
        const $ = cheerio.load(html);

        // الرابط الأساسي للوكيل
        const baseProxy = `${req.protocol}://${req.get('host')}/fetch?url=`;

        // نعدل جميع الروابط
        $('a[href]').each((i, el) => {
            let href = $(el).attr('href');
            if (href && href.startsWith('/')) {
                $(el).attr('href', baseProxy + encodeURIComponent(targetUrl + href));
            }
        });

        $('link[href]').each((i, el) => {
            let href = $(el
