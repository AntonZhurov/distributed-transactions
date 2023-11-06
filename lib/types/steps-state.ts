import { DistributedTransactionStep } from './step';
import { DISTRIBUTED_TRANSACTION_STEP_STATUS } from './status';

export type DistributedTransactionStepsState<
  TSteps extends string = string,
  TPayloadsBySteps extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TMetaBySteps extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TSuccessResponsesBySteps extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackPayloadsBySteps extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
  TRollbackMetaBySteps extends Partial<{
    [key in TSteps]: Record<any, any>;
  }> = Record<TSteps, any>,
> = {
  firstStep: TSteps;
  lastStep: TSteps;
  currentStep?: TSteps;
  rollingBack: boolean;
  steps: {
    [key in TSteps]: DistributedTransactionStep<
      key,
      DISTRIBUTED_TRANSACTION_STEP_STATUS,
      TPayloadsBySteps[key],
      TMetaBySteps[key],
      TSuccessResponsesBySteps[key],
      TRollbackPayloadsBySteps[key],
      TRollbackMetaBySteps[key]
    >;
  };
};
