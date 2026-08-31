import cron from 'node-cron';
import { Op } from 'sequelize';
import { AuthSession } from '../modules/auth/auth-session.model';

const RETENTION_DAYS = 30;

export function startAuthSessionCleanupJob(): void {
  cron.schedule('17 3 * * *', async () => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    try {
      await AuthSession.destroy({
        where: {
          expiresAt: { [Op.lt]: cutoff },
        },
      });
    } catch (error) {
      console.error('[AuthSessionCleanup]', error);
    }
  });
}
