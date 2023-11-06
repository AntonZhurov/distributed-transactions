import { DistributedTransactionStepsState } from './steps-state';

export interface DistributedTransactionStructure<
  TSteps extends string = string,
> {
  type: string;
  state: DistributedTransactionStepsState<TSteps>;
}
