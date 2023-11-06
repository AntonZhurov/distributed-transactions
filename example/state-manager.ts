import {
  DistributedTransactionStateManager,
  IDistributedTransaction,
} from '../lib/types';

const db = new Map<string, IDistributedTransaction>();

export class StateManager implements DistributedTransactionStateManager {
  async load(id: string): Promise<IDistributedTransaction | undefined> {
    return db.get(id);
  }

  async save(transaction: IDistributedTransaction): Promise<void> {
    db.set(transaction.id, transaction);
  }

  async update(transaction: IDistributedTransaction): Promise<void> {
    db.set(transaction.id, transaction);
  }
}
