import Fastify from 'fastify'
import * as cheerio from 'cheerio'

const fastify = Fastify({
    logger: true
})

interface InfoQuery {
    search?: string;
}

fastify.get("/", async (req: Fastify.FastifyRequest<{ Querystring: InfoQuery }>) => {
    const keyword = req.query.search ?? "tempe"
    
    const response = 
    await fetch(`https://www.fatsecret.co.id/kalori-gizi/search?q=${encodeURIComponent(keyword)}`, 
    {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text()
    const $ = cheerio.load(html)
    const results: { name: string; nutrition: string, details: string }[] = []

    $("a.prominent").each((_, el) => {
        const name = $(el).text().trim();
        let nutritionEl = null
        const isNutritionInfo = $(el).next().hasClass("smallText");
        if (!isNutritionInfo) {
            nutritionEl = $(el).next().next()
        } else {
            nutritionEl = $(el).next()
        }
        const nutrition = nutritionEl
            .text()
            .replace(/\s+/g, " ")
            .replace(/, lagi.*$/i, "")
            .trim();
        const relativeLink = $(el).attr("href"); // href="/kalori-gizi/umum/tempe"
        const details = relativeLink ? new URL(relativeLink, "https://www.fatsecret.co.id").href : "";

        if (name && nutrition) {
            results.push({name, nutrition, details});
        }
    });

    return { results }
})

// Run the server!
try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}