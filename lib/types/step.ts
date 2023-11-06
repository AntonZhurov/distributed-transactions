import {
  DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS,
  DISTRIBUTED_TRANSACTION_STEP_STATUS,
} from './status';

export type DistributedTransactionErrorStepResponse = {
  error: { name: string; message: string; stack?: string };
};

type DistributedTransactionStepResponse<
  TStatus extends
    DISTRIBUTED_TRANSACTION_STEP_STATUS = DISTRIBUTED_TRANSACTION_STEP_STATUS,
  TSuccessResponse = any,
> = TStatus extends DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED
  ? TSuccessResponse
  : TStatus extends DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED
  ? DistributedTransactionErrorStepResponse
  : Record<string, any>;

export type DistributedTransactionStep<
  TSteps extends string = string,
  TStatus extends
    DISTRIBUTED_TRANSACTION_STEP_STATUS = DISTRIBUTED_TRANSACTION_STEP_STATUS,
  TPayload = any,
  TMeta = any,
  TSuccessResponse = any,
  TRollbackPayload = any,
  TRollbackMeta = any,
> = {
  status?: TStatus;
  nextStep?: TSteps;
  withRollback?: boolean;
  rollbackStatus?: DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS;
  rollbackPayload?: TRollbackPayload;
  rollbackMeta?: TRollbackMeta;
  nextRollback?: TSteps;
  response?: DistributedTransactionStepResponse<TStatus, TSuccessResponse>;
  payload?: TPayload;
  meta?: TMeta;
};
