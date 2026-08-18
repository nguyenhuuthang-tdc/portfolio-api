import cron from 'node-cron';
import { Op, literal } from 'sequelize';
import { ViewLog } from '../modules/blog/view-log.model';
import { Blog } from '../modules/blog/blog.model';
import sequelize from '../config/database';

async function aggregateViewCounts(): Promise<void> {
  const t = await sequelize.transaction();
  try {
    // Get unprocessed view logs grouped by blogId
    const results = (await ViewLog.findAll({
      where: { processed: false },
      attributes: [
        'blogId',
        [literal('COUNT(*)'), 'count'],
      ],
      group: ['blogId'],
      transaction: t,
      raw: true,
    })) as unknown as Array<{ blogId: number; count: string }>;

    for (const row of results) {
      await Blog.increment('viewCount', {
        by: Number(row.count),
        where: { id: row.blogId },
        transaction: t,
      });
    }

    // Mark as processed
    await ViewLog.update(
      { processed: true },
      { where: { processed: false }, transaction: t }
    );

    // Cleanup processed logs older than 48h
    await ViewLog.destroy({
      where: {
        processed: true,
        createdAt: { [Op.lt]: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      transaction: t,
    });

    await t.commit();

    if (results.length > 0) {
      console.log(`[ViewCountJob] Aggregated views for ${results.length} blogs`);
    }
  } catch (err) {
    await t.rollback();
    console.error('[ViewCountJob] Error:', err);
  }
}

export function startViewCountJob(): void {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    aggregateViewCounts();
  });
  console.log('[ViewCountJob] Started — running every 15 minutes');
}
