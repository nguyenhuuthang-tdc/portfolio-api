import cron from 'node-cron';
import { Op } from 'sequelize';
import { AuthSession } from '../modules/auth/auth-session.model';
import { logger } from '../config/logger';

const RETENTION_DAYS = 30;

export function startAuthSessionCleanupJob(): void {
  cron.schedule('17 3 * * *', async () => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const startedAt = process.hrtime.bigint();
    try {
      const deletedSessions = await AuthSession.destroy({
        where: {
          expiresAt: { [Op.lt]: cutoff },
        },
      });
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      logger.info({
        event: 'job_completed',
        job: 'auth_session_cleanup',
        deleted_sessions: deletedSessions,
        duration_ms: Number(durationMs.toFixed(3)),
      }, 'Auth session cleanup completed');
    } catch (error) {
      logger.error({
        event: 'job_failed',
        job: 'auth_session_cleanup',
        err: error,
      }, 'Auth session cleanup failed');
    }
  });

  logger.info({
    event: 'job_scheduled',
    job: 'auth_session_cleanup',
    schedule: '17 3 * * *',
  }, 'Auth session cleanup scheduled');
}
