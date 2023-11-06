import {
  PayloadByStep,
  RollbackPayloadByStep,
  Steps,
  SuccessResponseByStep,
  TransactionContext,
} from './steps';
import { DistributedTransactionPayloadBuilder } from '../../lib/types';

export const PayloadBuilder: DistributedTransactionPayloadBuilder<
  Steps,
  TransactionContext,
  SuccessResponseByStep,
  PayloadByStep,
  RollbackPayloadByStep
> = {
  [Steps.STEP1]: {
    step: (id, type, context) => ({
      productIds: context.productIds!,
      amount: context.amount!,
    }),
  },
  [Steps.STEP2]: {
    step: (id, type, context) => ({
      orderId: context.orderId!,
    }),
  },
  [Steps.STEP3]: {
    step: (id, type, context) => ({
      paymentId: context.paymentId!,
    }),
  },
  [Steps.STEP4]: {
    step: (id, type, context) => ({
      userId: context.userId!,
    }),
    rollback: (id, type, context, response) => ({
      transactionId: response.transactionId,
    }),
  },
  [Steps.STEP5]: {
    step: (id, type, context) => ({
      transactionId: context.transactionId!,
    }),
  },
};
