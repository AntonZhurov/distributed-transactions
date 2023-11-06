import {
  CreateDistributedTransactionData,
  DISTRIBUTED_TRANSACTION_STATUS,
  DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS,
  DISTRIBUTED_TRANSACTION_STEP_STATUS,
  DistributedTransactionErrorStepResponse,
  DistributedTransactionOptions,
  DistributedTransactionStep,
  DistributedTransactionStepsState,
  IDistributedTransaction,
} from '../types';

export class DistributedTransaction<
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
> implements
    IDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >
{
  id: string;
  type: string;
  context: TContext;
  state: DistributedTransactionStepsState<
    TSteps,
    TPayloadByStep,
    TMetaByStep,
    TSuccessResponseByStep,
    TRollbackPayloadByStep,
    TRollbackMetaByStep
  >;
  meta: Record<any, any>;
  status: DISTRIBUTED_TRANSACTION_STATUS;
  statusDescription?: string;

  constructor(
    data: CreateDistributedTransactionData<
      TSteps,
      TContext,
      TSuccessResponseByStep,
      TPayloadByStep,
      TMetaByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
    private readonly options: DistributedTransactionOptions<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
    >,
  ) {
    const { id, type, status, statusDescription, context, state, meta } = data;
    this.id = id;
    this.type = type;
    this.status = status;
    this.statusDescription = statusDescription;
    this.context = context;
    this.state = state;
    this.meta = meta;
  }

  get isRollingBack() {
    return this.state.rollingBack;
  }

  start() {
    if (this.status !== DISTRIBUTED_TRANSACTION_STATUS.PENDING) {
      throw new Error(`Transaction ${this.id}/${this.type} already started`);
    }
    this.status = DISTRIBUTED_TRANSACTION_STATUS.PROCESSING;
    this.state.currentStep = this.state.firstStep;
    return this.step();
  }

  get currentStep() {
    const step = this.state.currentStep;
    if (!step) return null;
    return Object.assign({}, this.state.steps[step]);
  }

  step(): DistributedTransactionStep {
    if (this.state.rollingBack) {
      throw new Error('Forbidden to make step when rollback initiated');
    }
    if (this.status !== DISTRIBUTED_TRANSACTION_STATUS.PROCESSING) {
      throw new Error('Transaction doesnt processing');
    }
    if (!this.state.currentStep) {
      throw new Error(
        `Failed to make step, current step = ${this.state.currentStep}`,
      );
    }
    const currentStep = this.state.steps[this.state.currentStep];
    currentStep.status = DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING;
    const payloadBuilder =
      this.options.payloadBuilder[this.state.currentStep].step;
    const metaBuilder = this.options.metaBuilder[this.state.currentStep].step;
    currentStep.payload = payloadBuilder(this.id, this.type, this.context);
    currentStep.meta = metaBuilder(
      this.id,
      this.type,
      this.context,
      currentStep.payload,
    );

    return Object.assign({}, currentStep) as DistributedTransactionStep;
  }

  stepRollback() {
    if (!this.state.rollingBack) {
      throw new Error(
        'Forbidden to make rollback step when rollback not initiated',
      );
    }
    if (this.status !== DISTRIBUTED_TRANSACTION_STATUS.PROCESSING_ROLLBACK) {
      throw new Error('Transaction doesnt processing rollback');
    }
    if (!this.state.currentStep) {
      throw new Error(
        `Failed to make step, current step = ${this.state.currentStep}`,
      );
    }
    const currentStep = this.state.steps[
      this.state.currentStep
    ] as DistributedTransactionStep<
      TSteps,
      DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED
    >;
    currentStep.rollbackStatus =
      DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS.PROCESSING;

    const payloadBuilder =
      this.options.payloadBuilder[this.state.currentStep].rollback;
    const metaBuilder =
      this.options.metaBuilder[this.state.currentStep].rollback;
    if (payloadBuilder) {
      currentStep.rollbackPayload = payloadBuilder(
        this.id,
        this.type,
        this.context,
        currentStep.response!,
      );
      if (metaBuilder) {
        currentStep.rollbackMeta = metaBuilder(
          this.id,
          this.type,
          this.context,
          currentStep.rollbackPayload!,
        );
      }
    }

    return Object.assign({}, currentStep);
  }

  handleStepRollbackSuccess<TStep extends TSteps>(step: TStep) {
    if (this.status !== DISTRIBUTED_TRANSACTION_STATUS.PROCESSING_ROLLBACK) {
      throw new Error(
        'Cannot handleStepRollbackSuccess when transaction is not processing rollback',
      );
    }
    if (this.state.currentStep !== step) {
      throw new Error(
        `Execute handleStepRollbackSuccess with step '${step}' when current step '${this.state.currentStep}'`,
      );
    }
    const currentStep = this.state.steps[step] as DistributedTransactionStep<
      TSteps,
      DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED,
      TPayloadByStep[TStep],
      TMetaByStep[TStep],
      TSuccessResponseByStep[TStep],
      TRollbackPayloadByStep[TStep],
      TRollbackMetaByStep[TStep]
    >;
    currentStep.rollbackStatus =
      DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS.COMPLETED;
    this.state.currentStep = currentStep.nextRollback;
    const hasNextRollback = Boolean(this.state.currentStep);
    return { completed: !hasNextRollback };
  }

  handleStepRollbackFailed<TStep extends TSteps>(step: TStep) {
    if (this.status !== DISTRIBUTED_TRANSACTION_STATUS.PROCESSING_ROLLBACK) {
      throw new Error(
        'Cannot handleStepRollbackSuccess when transaction is not processing rollback',
      );
    }
    if (this.state.currentStep !== step) {
      throw new Error(
        `Execute handleStepRollbackSuccess with step '${step}' when current step '${this.state.currentStep}'`,
      );
    }
    const currentStep = this.state.steps[step] as DistributedTransactionStep<
      TSteps,
      DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED,
      TPayloadByStep[TStep],
      TMetaByStep[TStep],
      TSuccessResponseByStep[TStep],
      TRollbackPayloadByStep[TStep],
      TRollbackMetaByStep[TStep]
    >;
    currentStep.rollbackStatus =
      DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS.FAILED;

    this.status = DISTRIBUTED_TRANSACTION_STATUS.ROLLBACK_FAILED;
    this.state.currentStep = undefined;
    const onRollbackFailed = this.options.transactionHooks.onRollbackFailed;
    if (onRollbackFailed) {
      onRollbackFailed(this.meta, this.toJSON());
    }

    return { completed: false };
  }

  handleStepSuccess<TStep extends TSteps>(
    step: TStep,
    response: TSuccessResponseByStep[TStep],
  ) {
    if (this.state.currentStep !== step) {
      throw new Error(
        `Execute handleStepSuccess with step '${step}' when current step '${this.state.currentStep}'`,
      );
    }
    const currentStep = this.state.steps[step] as DistributedTransactionStep<
      TSteps,
      DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED,
      TPayloadByStep[TStep],
      TMetaByStep[TStep],
      TSuccessResponseByStep[TStep],
      TRollbackPayloadByStep[TStep],
      TRollbackMetaByStep[TStep]
    >;
    currentStep.status = DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED;
    currentStep.response = response;
    const { onSuccess } = this.options.stepHooks[this.state.currentStep] ?? {};
    if (onSuccess) onSuccess(this.context, currentStep);
    this.state.currentStep = currentStep.nextStep;
    const hasNextStep = Boolean(this.state.currentStep);
    return { completed: !hasNextStep };
  }

  handleStepFailure<TStep extends TSteps>(
    step: TStep,
    response: DistributedTransactionErrorStepResponse,
  ) {
    if (this.state.currentStep !== step) {
      throw new Error(
        `Execute handleStepFailure with step '${step}' when current step '${this.state.currentStep}'`,
      );
    }
    const currentStep = this.state.steps[step] as DistributedTransactionStep<
      TSteps,
      DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED,
      TPayloadByStep[TStep],
      TMetaByStep[TStep],
      TSuccessResponseByStep[TStep],
      TRollbackPayloadByStep[TStep],
      TRollbackMetaByStep[TStep]
    >;
    currentStep.status = DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED;
    currentStep.response = response;
    const { onFailure } = this.options.stepHooks[this.state.currentStep] ?? {};
    if (onFailure) onFailure(this.context, currentStep);
    this.state.currentStep = currentStep.nextRollback;
    this.rollback();
    const hasNextStep = Boolean(this.state.currentStep);
    return { completed: !hasNextStep };
  }

  rollback() {
    this.status = DISTRIBUTED_TRANSACTION_STATUS.PROCESSING_ROLLBACK;
    this.state.rollingBack = true;
  }

  complete() {
    const isRollingBack = this.state.rollingBack;
    if (isRollingBack) {
      throw new Error('Cannot complete rolling back transaction');
    }
    const steps: DistributedTransactionStep[] = Object.values(this.state.steps);
    const allStepsCompleted = steps.every(
      (step) => step.status === DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED,
    );
    if (!allStepsCompleted) {
      throw new Error(
        `Cannot complete transaction when steps doesnt have '${DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED}' status`,
      );
    }
    this.status = DISTRIBUTED_TRANSACTION_STATUS.COMPLETED;
    const onCompleted = this.options.transactionHooks.onCompleted;
    if (onCompleted) {
      onCompleted(this.meta, this.toJSON());
    }
  }

  fail() {
    const isRollingBack = this.state.rollingBack;
    if (!isRollingBack) {
      throw new Error('Cannot fail not rolled back transaction');
    }
    this.status = DISTRIBUTED_TRANSACTION_STATUS.FAILED;
    const onFailed = this.options.transactionHooks.onFailed;
    if (onFailed) {
      onFailed(this.meta, this.toJSON());
    }
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      statusDescription: this.statusDescription,
      meta: this.meta,
      context: this.context,
      state: this.state,
    };
  }
}
