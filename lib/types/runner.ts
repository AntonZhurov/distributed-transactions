import { DistributedTransactionStructure } from './structure';
import {
  DistributedTransactionHooks,
  DistributedTransactionMetaBuilder,
  DistributedTransactionPayloadBuilder,
  DistributedTransactionStepHooks,
  IDistributedTransaction,
  SerializedDistributedTransaction,
} from './transaction';
import {
  DistributedTransactionErrorStepResponse,
  DistributedTransactionStep,
} from './step';

export interface DistributedTransactionRunnerLogger {
  info(message: string, data?: Record<any, any>): void;
  error(message: string, data?: Record<any, any>): void;
}

export interface DistributedTransactionStateManager<
  Options extends Record<any, any> = Record<any, any>,
> {
  save(transaction: IDistributedTransaction, options?: Options): Promise<void>;
  update(
    transaction: IDistributedTransaction,
    options?: Options,
  ): Promise<void>;
  load(
    id: string,
    options?: Options,
  ): Promise<IDistributedTransaction | undefined>;
}

export interface DistributedTransactionBroker<
  TSteps extends string = string,
  Options extends Record<any, any> = Record<any, any>,
> {
  send(
    step: TSteps,
    data: DistributedTransactionStep,
    options?: Options,
  ): Promise<void>;
}

export interface CreateDistributedTransactionRunnerOptions<
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
  TOptions extends Record<any, any> = Record<any, any>,
> {
  logger: DistributedTransactionRunnerLogger;
  stateManager: DistributedTransactionStateManager<TOptions>;
  broker: DistributedTransactionBroker<TSteps, TOptions>;
  transaction: {
    structure: DistributedTransactionStructure<TSteps>;
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
  };
}

export interface IDistributedTransactionRunner<
  TSteps extends string = string,
  TContext extends Record<any, any> = Record<any, any>,
  TStartPayload extends Record<any, any> = Record<any, any>,
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
  TOptions extends Record<any, any> = Record<any, any>,
> {
  start(
    payload: TStartPayload,
    options?: TOptions,
  ): Promise<
    SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >
  >;
  handleStepSuccess<TStep extends TSteps>(
    id: string,
    step: TStep,
    response: TSuccessResponseByStep[TStep],
    options?: TOptions,
  ): Promise<
    SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >
  >;
  handleStepFailure<TStep extends TSteps>(
    id: string,
    step: TStep,
    response: DistributedTransactionErrorStepResponse,
    options?: TOptions,
  ): Promise<
    SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >
  >;
  handleStepRollbackSuccess<TStep extends TSteps>(
    id: string,
    step: TStep,
    options?: TOptions,
  ): Promise<
    SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >
  >;
  handleStepRollbackFailure<TStep extends TSteps>(
    id: string,
    step: TStep,
    options?: TOptions,
  ): Promise<
    SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >
  >;
  createTransaction(
    payload: TStartPayload,
  ): IDistributedTransaction<
    TSteps,
    TContext,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
}
