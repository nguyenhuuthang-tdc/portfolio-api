import { QueryInterface, Transaction } from 'sequelize';

export interface Migration {
  name: string;
  up(queryInterface: QueryInterface, transaction: Transaction): Promise<void>;
  down(queryInterface: QueryInterface, transaction: Transaction): Promise<void>;
}
