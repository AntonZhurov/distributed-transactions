import * as crypto from 'node:crypto';
import {
  CreateDistributedTransactionRunnerOptions,
  DISTRIBUTED_TRANSACTION_STATUS,
  DistributedTransactionBroker,
  DistributedTransactionErrorStepResponse,
  DistributedTransactionHooks,
  DistributedTransactionMetaBuilder,
  DistributedTransactionPayloadBuilder,
  DistributedTransactionRunnerLogger,
  DistributedTransactionStateManager,
  DistributedTransactionStep,
  DistributedTransactionStepHooks,
  IDistributedTransaction,
  IDistributedTransactionRunner,
  SerializedDistributedTransaction,
  DistributedTransactionStructure,
} from '../types';
import { DistributedTransaction } from './transaction';

export class DistributedTransactionRunner<
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
> implements
    IDistributedTransactionRunner<
      TSteps,
      TContext,
      TStartPayload,
      TSuccessResponseByStep,
      TPayloadByStep,
      TMetaByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep,
      TOptions
    >
{
  protected readonly structure: DistributedTransactionStructure<TSteps>;
  protected readonly payloadBuilder: DistributedTransactionPayloadBuilder<
    TSteps,
    TContext,
    TSuccessResponseByStep,
    TPayloadByStep,
    TRollbackPayloadByStep
  >;
  protected readonly metaBuilder: DistributedTransactionMetaBuilder<
    TSteps,
    TContext,
    TPayloadByStep,
    TMetaByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
  protected readonly stepHooks: DistributedTransactionStepHooks<
    TSteps,
    TContext,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
  protected readonly transactionHooks: DistributedTransactionHooks<
    TSteps,
    TContext,
    TSuccessResponseByStep,
    TPayloadByStep,
    TMetaByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
  protected readonly logger: DistributedTransactionRunnerLogger;
  protected readonly stateManager: DistributedTransactionStateManager<TOptions>;
  protected readonly broker: DistributedTransactionBroker<TSteps, TOptions>;

  constructor(
    options: CreateDistributedTransactionRunnerOptions<
      TSteps,
      TContext,
      TSuccessResponseByStep,
      TPayloadByStep,
      TMetaByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep,
      TOptions
    >,
  ) {
    this.validate(options);
    const { transaction, stateManager, logger, broker } = options;
    this.structure = Object.assign({}, transaction.structure);
    this.payloadBuilder = transaction.payloadBuilder;
    this.metaBuilder = transaction.metaBuilder;
    this.stepHooks = transaction.stepHooks;
    this.transactionHooks = transaction.transactionHooks;
    this.stateManager = stateManager;
    this.logger = logger;
    this.broker = broker;
  }

  async start(
    context: TStartPayload,
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
  > {
    try {
      this.logger.info('Create new distributed transaction', {
        type: this.structure.type,
        context: context,
      });
      const transaction = this.createTransaction(context);
      this.logger.info('Transaction created', {
        transaction: transaction.toJSON(),
      });
      this.logger.info('Start transaction', { id: transaction.id });
      const step = transaction.start();
      this.logger.info('Save transaction state', {
        transaction: transaction.toJSON(),
      });
      await this.stateManager.save(transaction, options);
      this.logger.info('Send transaction step to broker', {
        id: transaction.id,
        type: transaction.type,
        step: step,
      });
      await this.broker.send(transaction.state.currentStep!, step, options);
      return transaction.toJSON();
    } catch (e: any) {
      this.logger.error('Transaction start error', {
        type: this.structure.type,
        message: e.message,
        stack: e.stack,
      });
      throw e;
    }
  }

  async handleStepSuccess<TStep extends TSteps>(
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
  > {
    try {
      this.logger.info('Start handleStepSuccess', {
        id: id,
        step: step,
      });

      const transaction = await this.loadTransaction(id, options);

      this.logger.info('Handle step success', {
        id: transaction.id,
        step: step,
        response: response,
      });
      const { completed } = transaction.handleStepSuccess(step, response);
      this.logger.info('Successful handle', {
        id: transaction.id,
        step: step,
        completed: completed,
      });

      if (!completed) {
        this.logger.info('Make next step', {
          id: transaction.id,
          step: transaction.state.currentStep,
        });
        const step = transaction.step()!;
        await this.sendStepToBroker(transaction, step, options);
      } else {
        this.logger.info('Complete transaction', {
          id: transaction.id,
          type: transaction.type,
        });
        transaction.complete();
        this.logger.info('Execute transaction runner onCompleted hook', {
          id: transaction.id,
          type: transaction.type,
        });
        await this.onCompleted(transaction.toJSON());
      }
      await this.updateTransactionState(transaction, options);
      return transaction.toJSON();
    } catch (e: any) {
      this.logger.error('Transaction handleStepSuccess error', {
        id: id,
        step: step,
        response: response,
        type: this.structure.type,
        message: e.message,
        stack: e.stack,
      });
      throw e;
    }
  }

  async handleStepFailure<TStep extends TSteps>(
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
  > {
    try {
      this.logger.info('Start handleStepFailure', {
        id: id,
        step: step,
      });

      const transaction = await this.loadTransaction(id, options);

      this.logger.info('Handle step failure', {
        id: transaction.id,
        step: step,
        response: response,
      });
      const { completed } = transaction.handleStepFailure(step, response);
      this.logger.info('Successful handle', {
        id: transaction.id,
        step: step,
        completed: completed,
      });
      if (!completed) {
        this.logger.info('Make next rollback step', {
          id: transaction.id,
          step: transaction.state.currentStep,
        });
        const step = transaction.stepRollback()!;
        await this.sendStepToBroker(transaction, step, options);
      } else {
        this.logger.info('Fail transaction', {
          id: transaction.id,
          type: transaction.type,
        });
        transaction.fail();
        this.logger.info('Execute transaction runner onFailed hook', {
          id: transaction.id,
          type: transaction.type,
        });
        await this.onFailed(transaction.toJSON());
      }
      await this.updateTransactionState(transaction, options);
      return transaction.toJSON();
    } catch (e: any) {
      this.logger.error('Transaction handleStepFailure error', {
        id: id,
        step: step,
        response: response,
        type: this.structure.type,
        message: e.message,
        stack: e.stack,
      });
      throw e;
    }
  }

  async handleStepRollbackSuccess<TStep extends TSteps>(
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
  > {
    try {
      this.logger.info('Start handleStepRollbackSuccess', {
        id: id,
        step: step,
      });

      const transaction = await this.loadTransaction(id, options);

      this.logger.info('Handle step rollback success', {
        id: transaction.id,
        step: step,
      });
      const { completed } = transaction.handleStepRollbackSuccess(step);
      this.logger.info('Successful handle', {
        id: transaction.id,
        step: step,
        completed: completed,
      });
      if (!completed) {
        this.logger.info('Make next rollback step', {
          id: transaction.id,
          step: transaction.state.currentStep,
        });
        const step = transaction.stepRollback()!;
        await this.sendStepToBroker(transaction, step, options);
      } else {
        this.logger.info('Fail transaction', {
          id: transaction.id,
          type: transaction.type,
        });
        transaction.fail();
        this.logger.info('Execute transaction runner onFailed hook', {
          id: transaction.id,
          type: transaction.type,
        });
        await this.onFailed(transaction.toJSON());
      }
      await this.updateTransactionState(transaction, options);
      return transaction.toJSON();
    } catch (e: any) {
      this.logger.error('Transaction handleStepRollbackSuccess error', {
        id: id,
        step: step,
        type: this.structure.type,
        message: e.message,
        stack: e.stack,
      });
      throw e;
    }
  }

  async handleStepRollbackFailure<TStep extends TSteps>(
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
  > {
    try {
      this.logger.info('Start handleStepRollbackFailure', {
        id: id,
        step: step,
      });

      const transaction = await this.loadTransaction(id, options);

      this.logger.info('Handle step rollback failure', {
        id: transaction.id,
        step: step,
      });
      transaction.handleStepRollbackFailed(step);
      this.logger.info('Successful handle', {
        id: transaction.id,
        step: step,
      });
      this.logger.info('Transaction rollback failed', {
        id: transaction.id,
        type: transaction.type,
        step: step,
      });
      this.logger.info('Execute transaction runner onRollbackFailed hook', {
        id: transaction.id,
        type: transaction.type,
      });
      await this.onRollbackFailed(transaction.toJSON());
      await this.updateTransactionState(transaction, options);
      return transaction.toJSON();
    } catch (e: any) {
      this.logger.error('Transaction handleStepRollbackFailure error', {
        id: id,
        step: step,
        type: this.structure.type,
        message: e.message,
        stack: e.stack,
      });
      throw e;
    }
  }

  private async loadTransaction(
    id: string,
    options?: TOptions,
  ): Promise<
    IDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >
  > {
    this.logger.info('Load transaction from state manager', {
      id: id,
      type: this.structure.type,
    });
    const transaction = (await this.stateManager.load(
      id,
      options,
    )) as IDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >;
    if (!transaction) {
      this.logger.error('Transaction not found', {
        id: id,
        type: this.structure.type,
      });
      throw new Error(`Transaction ${id} not found`);
    }
    this.logger.info('Transaction loaded', {
      transaction: transaction.toJSON(),
    });
    return transaction;
  }

  private async updateTransactionState(
    transaction: IDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
    options?: TOptions,
  ): Promise<void> {
    this.logger.info('Update transaction state', {
      transaction: transaction.toJSON(),
    });
    await this.stateManager.update(transaction, options);
  }

  private async sendStepToBroker(
    transaction: IDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
    step: DistributedTransactionStep,
    options?: TOptions,
  ): Promise<void> {
    this.logger.info('Send transaction step to broker', {
      id: transaction.id,
      type: transaction.type,
      step: step,
    });
    await this.broker.send(transaction.state.currentStep!, step, options);
  }

  private validate(
    options: CreateDistributedTransactionRunnerOptions<
      TSteps,
      TContext,
      TSuccessResponseByStep,
      TPayloadByStep,
      TMetaByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep,
      TOptions
    >,
  ) {
    const { transaction, stateManager, logger, broker } = options;
    if (!transaction) {
      throw new Error(
        `${this.constructor.name} transaction option must be provided`,
      );
    }
    if (!stateManager) {
      throw new Error(
        `${this.constructor.name} stateManager option must be provided`,
      );
    }
    if (!logger) {
      throw new Error(
        `${this.constructor.name} logger option must be provided`,
      );
    }
    if (!broker) {
      throw new Error(
        `${this.constructor.name} broker option must be provided`,
      );
    }
    if (!transaction.transactionHooks) {
      throw new Error(
        `${this.constructor.name} transaction.transactionHooks option must be provided`,
      );
    }
    if (!transaction.stepHooks) {
      throw new Error(
        `${this.constructor.name} transaction.stepHooks option must be provided`,
      );
    }
    if (!transaction.structure) {
      throw new Error(
        `${this.constructor.name} transaction.structure option must be provided`,
      );
    }
    if (!transaction.metaBuilder) {
      throw new Error(
        `${this.constructor.name} transaction.metaBuilder option must be provided`,
      );
    }
    if (!transaction.payloadBuilder) {
      throw new Error(
        `${this.constructor.name} transaction.payloadBuilder option must be provided`,
      );
    }
  }

  createTransaction(
    context: TStartPayload,
  ): IDistributedTransaction<
    TSteps,
    TContext,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  > {
    return new DistributedTransaction(
      {
        id: crypto.randomUUID(),
        type: this.structure.type,
        state: Object.assign({}, this.structure.state),
        status: DISTRIBUTED_TRANSACTION_STATUS.PENDING,
        context: context,
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

  protected async onCompleted(
    transaction: SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
  ): Promise<void> {
    return void transaction;
  }
  protected async onFailed(
    transaction: SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
  ): Promise<void> {
    return void transaction;
  }
  protected async onRollbackFailed(
    transaction: SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
  ): Promise<void> {
    return void transaction;
  }
}
