import {
  DistributedTransactionHooks,
  DistributedTransactionStepHooks,
} from '../../lib/types';

export enum Steps {
  STEP1 = 'step_1',
  STEP2 = 'step_2',
  STEP3 = 'step_3',
  STEP4 = 'step_4',
  STEP5 = 'step_5',
}

export interface PayloadByStep {
  [Steps.STEP1]: { productIds: string[]; amount: number };
  [Steps.STEP2]: { orderId: string };
  [Steps.STEP3]: { paymentId: string };
  [Steps.STEP4]: { userId: string };
  [Steps.STEP5]: { transactionId: string };
}

export type RollbackPayloadByStep = {
  [Steps.STEP2]: { paymentId: string };
  [Steps.STEP3]: { userId: string };
  [Steps.STEP4]: { transactionId: string };
  [Steps.STEP5]: { transactionId: string };
};

interface TransactionStepMeta {
  transaction: {
    id: string;
    type: string;
  };
  context: Record<any, any>;
  payload: Record<any, any>;
  response: {
    success: { to: string };
    failure: { to: string };
  };
}

export interface MetaByStep {
  [Steps.STEP1]: TransactionStepMeta;
  [Steps.STEP2]: TransactionStepMeta;
  [Steps.STEP3]: TransactionStepMeta;
  [Steps.STEP4]: TransactionStepMeta;
  [Steps.STEP5]: TransactionStepMeta;
}

export interface RollbackMetaByStep {
  [Steps.STEP1]: TransactionStepMeta;
  [Steps.STEP2]: TransactionStepMeta;
  [Steps.STEP3]: TransactionStepMeta;
  [Steps.STEP4]: TransactionStepMeta;
  [Steps.STEP5]: TransactionStepMeta;
}

export interface SuccessResponseByStep {
  [Steps.STEP1]: { orderId: string };
  [Steps.STEP2]: { paymentId: string };
  [Steps.STEP3]: { userId: string };
  [Steps.STEP4]: { transactionId: string };
  [Steps.STEP5]: { successful: boolean };
}

export interface TransactionContext {
  productIds?: string[];
  amount?: number;
  orderId?: string;
  paymentId?: string;
  userId?: string;
  transactionId?: string;
}

export const TransactionStepHooks: DistributedTransactionStepHooks<
  Steps,
  TransactionContext,
  PayloadByStep,
  MetaByStep,
  SuccessResponseByStep,
  RollbackPayloadByStep,
  RollbackMetaByStep
> = {
  [Steps.STEP1]: {
    onSuccess: (context, step) => {
      context.orderId = step?.response?.orderId;
    },
  },
  [Steps.STEP2]: {
    onSuccess: (context, step) => {
      context.paymentId = step?.response?.paymentId;
    },
  },
  [Steps.STEP3]: {
    onSuccess: (context, step) => {
      context.userId = step?.response?.userId;
    },
  },
  [Steps.STEP4]: {
    onSuccess: (context, step) => {
      context.transactionId = step?.response?.transactionId;
    },
  },
};

export const TransactionHooks: DistributedTransactionHooks<
  Steps,
  TransactionContext,
  SuccessResponseByStep,
  PayloadByStep,
  MetaByStep,
  RollbackPayloadByStep,
  RollbackMetaByStep
> = {
  onCompleted: (meta, transaction) => {
    meta.message = 'onCompleted transaction hook';
    meta.id = transaction.id;
    meta.type = transaction.type;
  },
  onFailed: (meta, transaction) => {
    meta.message = 'onFailed transaction hook';
    meta.id = transaction.id;
    meta.type = transaction.type;
  },
  onRollbackFailed: (meta, transaction) => {
    meta.message = 'onRollbackFailed transaction hook';
    meta.id = transaction.id;
    meta.type = transaction.type;
  },
};

export type StartPayload = PayloadByStep[Steps.STEP1];
