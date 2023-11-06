import {
  DISTRIBUTED_TRANSACTION_STATUS,
  DISTRIBUTED_TRANSACTION_STEP_STATUS,
} from './status';
import { DistributedTransactionStepsState } from './steps-state';
import {
  DistributedTransactionErrorStepResponse,
  DistributedTransactionStep,
} from './step';

export type DistributedTransactionStepHooks<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TSuccessResponseByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> = {
  [key in TSteps]?: {
    onSuccess?: (
      context: TContext,
      step: DistributedTransactionStep<
        key,
        DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED,
        TPayloadByStep[key],
        TMetaByStep[key],
        TSuccessResponseByStep[key],
        TRollbackPayloadByStep[key],
        TRollbackMetaByStep[key]
      >,
    ) => void;
    onFailure?: (
      context: TContext,
      step: DistributedTransactionStep<
        key,
        DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED,
        TPayloadByStep[key],
        TMetaByStep[key],
        TSuccessResponseByStep[key],
        TRollbackPayloadByStep[key],
        TRollbackMetaByStep[key]
      >,
    ) => void;
  };
};

export interface SerializedDistributedTransaction<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TSuccessResponseByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> {
  id: string;
  type: string;
  status: DISTRIBUTED_TRANSACTION_STATUS;
  statusDescription?: string;
  meta: Record<any, any>;
  context: TContext;
  state: DistributedTransactionStepsState<
    TSteps,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
}

export type DistributedTransactionHooks<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TSuccessResponseByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> = {
  onCompleted?: (
    meta: Record<any, any>,
    transaction: SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
  ) => void;
  onFailed?: (
    meta: Record<any, any>,
    transaction: SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
  ) => void;
  onRollbackFailed?: (
    meta: Record<any, any>,
    transaction: SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
  ) => void;
};

export type DistributedTransactionPayloadBuilder<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TSuccessResponseByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> = {
  [key in TSteps]: {
    step: (id: string, type: string, context: TContext) => TPayloadByStep[key];
    rollback?: (
      id: string,
      type: string,
      context: TContext,
      response: TSuccessResponseByStep[key],
    ) => TRollbackPayloadByStep[key];
  };
};

export type DistributedTransactionMetaBuilder<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> = {
  [key in TSteps]: {
    step: (
      id: string,
      type: string,
      context: TContext,
      payload: TPayloadByStep[key],
    ) => TMetaByStep[key];
    rollback?: (
      id: string,
      type: string,
      context: TContext,
      payload: TRollbackPayloadByStep[key],
    ) => TRollbackMetaByStep[key];
  };
};

export interface DistributedTransactionOptions<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TSuccessResponseByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> {
  payloadBuilder: DistributedTransactionPayloadBuilder<
    TSteps,
    TContext,
    TSuccessResponseByStep,
    TPayloadByStep,
    TRollbackPayloadByStep
  >;
  metaBuilder: DistributedTransactionMetaBuilder<
    TSteps,
    TContext,
    TPayloadByStep,
    TMetaByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
  stepHooks: DistributedTransactionStepHooks<
    TSteps,
    TContext,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
  transactionHooks: DistributedTransactionHooks<
    TSteps,
    TContext,
    TSuccessResponseByStep,
    TPayloadByStep,
    TMetaByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
}

export interface CreateDistributedTransactionData<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TSuccessResponseByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> {
  id: string;
  type: string;
  status: DISTRIBUTED_TRANSACTION_STATUS;
  statusDescription?: string;
  context: TContext;
  meta: Record<any, any>;
  state: DistributedTransactionStepsState<
    TSteps,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
}

export type IDistributedTransaction<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TSuccessResponseByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackMetaByStep extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> = {
  id: string;
  type: string;
  status: DISTRIBUTED_TRANSACTION_STATUS;
  statusDescription?: string;
  context: TContext;
  meta: Record<any, any>;
  state: DistributedTransactionStepsState<
    TSteps,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
  isRollingBack: boolean;

  currentStep: DistributedTransactionStep<TSteps> | null;
  start(): DistributedTransactionStep;
  step(): DistributedTransactionStep;
  stepRollback(): DistributedTransactionStep;
  handleStepSuccess<TStep extends TSteps>(
    step: TStep,
    response: TSuccessResponseByStep[TStep],
  ): { completed: boolean };
  handleStepFailure<TStep extends TSteps>(
    step: TStep,
    response: DistributedTransactionErrorStepResponse,
  ): { completed: boolean };
  handleStepRollbackSuccess<TStep extends TSteps>(
    step: TStep,
  ): { completed: boolean };
  handleStepRollbackFailed<TStep extends TSteps>(
    step: TStep,
  ): { completed: boolean };
  rollback(): void;
  complete(): void;
  fail(): void;
  toJSON(): SerializedDistributedTransaction<
    TSteps,
    TContext,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
};
