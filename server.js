const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// نخدم الـ index.html من مجلد المشروع مباشرة
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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

        // نعدل جميع الروابط النسبية
        $('a[href]').each((i, el) => {
            let href = $(el).attr('href');
            if (href && href.startsWith('/')) {
                $(el).attr('href', baseProxy + encodeURIComponent(targetUrl + href));
            }
        });

        $('link[href]').each((i, el) => {
            let href = $(el).attr('href');
            if (href && href.startsWith('/')) {
                $(el).attr('href', baseProxy + encodeURIComponent(targetUrl + href));
            }
        });

        $('script[src]').each((i, el) => {
            let src = $(el).attr('src');
            if (src && src.startsWith('/')) {
                $(el).attr('src', baseProxy + encodeURIComponent(targetUrl + src));
            }
        });

        $('img[src]').each((i, el) => {
            let src = $(el).attr('src');
            if (src && src.startsWith('/')) {
                $(el).attr('src', baseProxy + encodeURIComponent(targetUrl + src));
            }
        });

        // نرسل المحتوى المعدل
        res.send($.html());

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            error: 'فشل جلب الموقع',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 الوكيل شغال على http://localhost:${PORT}`);
});
