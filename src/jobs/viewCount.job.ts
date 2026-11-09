import cron from 'node-cron';
import { Op, literal } from 'sequelize';
import { ViewLog } from '../modules/blog/view-log.model';
import { Blog } from '../modules/blog/blog.model';
import sequelize from '../config/database';
import { logger } from '../config/logger';

async function aggregateViewCounts(): Promise<void> {
  const startedAt = process.hrtime.bigint();
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
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      logger.info({
        event: 'job_completed',
        job: 'view_count_aggregation',
        affected_blogs: results.length,
        duration_ms: Number(durationMs.toFixed(3)),
      }, 'View count aggregation completed');
    }
  } catch (err) {
    await t.rollback();
    logger.error({
      event: 'job_failed',
      job: 'view_count_aggregation',
      err,
    }, 'View count aggregation failed');
  }
}

export function startViewCountJob(): void {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    aggregateViewCounts();
  });
  logger.info({
    event: 'job_scheduled',
    job: 'view_count_aggregation',
    schedule: '*/15 * * * *',
  }, 'View count aggregation scheduled');
}
