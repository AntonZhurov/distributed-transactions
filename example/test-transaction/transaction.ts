import { DistributedTransaction } from '../../lib/core/transaction';
import {
  MetaByStep,
  PayloadByStep,
  RollbackMetaByStep,
  RollbackPayloadByStep,
  Steps,
  SuccessResponseByStep,
  TransactionContext,
} from './steps';

export class TestDistributedTransaction extends DistributedTransaction<
  Steps,
  TransactionContext,
  PayloadByStep,
  MetaByStep,
  SuccessResponseByStep,
  RollbackPayloadByStep,
  RollbackMetaByStep
> {}
