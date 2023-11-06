import { DistributedTransactionRunner } from '../../lib/core/transaction.runner';
import {
  MetaByStep,
  PayloadByStep,
  RollbackMetaByStep,
  RollbackPayloadByStep,
  StartPayload,
  Steps,
  SuccessResponseByStep,
  TransactionContext,
  TransactionHooks,
  TransactionStepHooks,
} from './steps';
import { TestDistributedTransaction } from './transaction';
import { PayloadBuilder } from './payload-builder';
import { MetaBuilder } from './meta-builder';
import { structure } from './transaction-structure';
import {
  DISTRIBUTED_TRANSACTION_STATUS,
  DistributedTransactionBroker,
  DistributedTransactionStateManager,
} from '../../lib/types';
import * as crypto from 'node:crypto';

export class TransactionRunner extends DistributedTransactionRunner<
  Steps,
  TransactionContext,
  StartPayload,
  SuccessResponseByStep,
  PayloadByStep,
  MetaByStep,
  RollbackPayloadByStep,
  RollbackMetaByStep
> {
  constructor(
    broker: DistributedTransactionBroker,
    stateManager: DistributedTransactionStateManager,
  ) {
    super({
      transaction: {
        stepHooks: TransactionStepHooks,
        payloadBuilder: PayloadBuilder,
        metaBuilder: MetaBuilder,
        structure: structure,
        transactionHooks: TransactionHooks,
      },
      broker: broker,
      stateManager: stateManager,
      logger: {
        info: () => {},
        error: () => {},
      },
    });
  }

  createTransaction(payload: StartPayload): TestDistributedTransaction {
    return new TestDistributedTransaction(
      {
        id: crypto.randomUUID(),
        type: this.structure.type,
        state: Object.assign({}, this.structure.state),
        status: DISTRIBUTED_TRANSACTION_STATUS.PENDING,
        context: payload,
        meta: {},
      },
      {
        stepHooks: this.stepHooks,
        payloadBuilder: this.payloadBuilder,
        metaBuilder: this.metaBuilder,
        transactionHooks: this.transactionHooks,
      },
    );
  }
}
