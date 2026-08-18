/**
 * export-content.js
 *
 * Exports published blog posts from MySQL → MDX files in portfolio-web/content/writings/
 * Meant to be run: node scripts/export-content.js
 *
 * Purpose: Keep local MDX files as latest snapshot so Vercel can rebuild
 * as static content when the VPS/API is no longer available.
 *
 * Usage:
 *   node scripts/export-content.js [--web-path ../portfolio-web]
 *   WEB_PATH=../portfolio-web node scripts/export-content.js
 */

const path = require('path');
const fs = require('fs');

// Load env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sequelize = require('sequelize');

const webPath = process.env.WEB_PATH ||
  process.argv.find(a => a.startsWith('--web-path='))?.split('=')[1] ||
  '../portfolio-web';

const WRITINGS_DIR = path.resolve(__dirname, '..', webPath, 'content/writings');

async function main() {
  const sequelize = new Sequelize.Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: false,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database');

    // Fetch published blogs with categories
    const [blogs] = await sequelize.query(`
      SELECT
        b.id, b.title, b.slug, b.content, b.excerpt,
        b.thumbnail, b.view_count as viewCount,
        b.published_at as publishedAt,
        b.created_at as createdAt, b.updated_at as updatedAt,
        GROUP_CONCAT(
          JSON_OBJECT('id', bc.id, 'name', bc.name, 'slug', bc.slug, 'color', bc.color)
        ) as categoriesRaw
      FROM blogs b
      LEFT JOIN blog_category_map bcm ON bcm.blog_id = b.id
      LEFT JOIN blog_categories bc ON bc.id = bcm.category_id
      WHERE b.status = 'published'
      GROUP BY b.id
      ORDER BY b.published_at DESC
    `);

    // Ensure output directory exists
    if (!fs.existsSync(WRITINGS_DIR)) {
      fs.mkdirSync(WRITINGS_DIR, { recursive: true });
    }

    let exported = 0;

    for (const blog of blogs) {
      const categories = blog.categoriesRaw
        ? [...new Set(blog.categoriesRaw.split('},{').map((_, i, arr) => {
            try {
              const raw = i === 0 ? arr[i] + '}' : i === arr.length - 1 ? '{' + arr[i] : '{' + arr[i] + '}';
              return JSON.parse(raw.startsWith('{') ? raw : '{' + raw);
            } catch { return null; }
          }).filter(Boolean))]
        : [];

      const frontmatter = [
        '---',
        `id: ${blog.id}`,
        `title: "${blog.title.replace(/"/g, '\\"')}"`,
        `slug: "${blog.slug}"`,
        blog.excerpt ? `excerpt: "${blog.excerpt.replace(/"/g, '\\"')}"` : '',
        blog.thumbnail ? `thumbnail: "${blog.thumbnail}"` : '',
        `viewCount: ${blog.viewCount || 0}`,
        blog.publishedAt ? `publishedAt: "${new Date(blog.publishedAt).toISOString()}"` : '',
        `createdAt: "${new Date(blog.createdAt).toISOString()}"`,
        `updatedAt: "${new Date(blog.updatedAt).toISOString()}"`,
        `categories: ${JSON.stringify(categories)}`,
        '---',
        '',
      ].filter(line => line !== undefined).join('\n');

      const filepath = path.join(WRITINGS_DIR, `${blog.slug}.mdx`);
      fs.writeFileSync(filepath, frontmatter + (blog.content || ''), 'utf-8');
      exported++;
    }

    console.log(`✓ Exported ${exported} posts to ${WRITINGS_DIR}`);

    await sequelize.close();

    // Auto-commit if in git repo
    const { execSync } = require('child_process');
    try {
      const webRoot = path.resolve(__dirname, '..', webPath);
      execSync(`cd "${webRoot}" && git add content/writings/ && git diff --cached --quiet || git commit -m "sync: export ${exported} blog posts from API"`, {
        stdio: 'pipe',
      });
      console.log('✓ Committed MDX files to git');

      execSync(`cd "${webRoot}" && git push`, { stdio: 'pipe' });
      console.log('✓ Pushed to remote → Vercel will rebuild automatically');
    } catch (e) {
      console.warn('⚠ Git push skipped:', e.message?.split('\n')[0]);
      console.log('  Run manually: cd portfolio-web && git add content/writings/ && git push');
    }
  } catch (err) {
    console.error('✗ Export failed:', err.message);
    process.exit(1);
  }
}

main();
