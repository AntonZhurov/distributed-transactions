import { DistributedTransactionBuilder } from '../../lib/core/transaction.builder';
import { Steps } from './steps';

export const structure = new DistributedTransactionBuilder<Steps>(
  'create_order',
)
  .step(Steps.STEP1)
  .step(Steps.STEP2)
  .withRollback()
  .step(Steps.STEP3)
  .withRollback()
  .step(Steps.STEP4)
  .withRollback()
  .step(Steps.STEP5)
  .withRollback()
  .build();
