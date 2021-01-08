const cheerio = require('cheerio');
const axios = require('axios');

export async function get(url) {

    try {
        const response = await axios.get(url);

        let $ = cheerio.load(response.data);

        let post = {
            title: $('title').text(),
            h1: $('h1').text(),
            canonical: $('link[rel="canonical"]').attr('href'),
            description: $('meta[name="description"]').attr('content'),
            // Get OG Values
            og_title: $('meta[property="og:title"]').attr('content'),
            og_url: $('meta[property="og:url"]').attr('content'),
            og_img: $('meta[property="og:image"]').attr('content'),
            og_type: $('meta[property="og:type"]').attr('content'),
            // Get Twitter Values
            twitter_site: $('meta[name="twitter:site"]').attr('content'),
            twitter_domain: $('meta[name="twitter:domain"]').attr('content'),
            twitter_img_src: $('meta[name="twitter:image:src"]').attr('content'),
            // Get Facebook Values
            fb_appid: $('meta[property="fb:app_id"]').attr('content'),
            fb_pages: $('meta[property="fb:pages"]').attr('content'),
        }

        return post;

    } catch (error) {
        console.log(error.response.body);
    }
}
