import {
  DistributedTransactionStep,
  DistributedTransactionStructure,
} from '../types';

export class DistributedTransactionBuilder<TSteps extends string = string> {
  private steps: Array<{ step: TSteps; withRollback: boolean }>;

  constructor(private readonly type: string) {
    this.steps = [];
  }

  step(step: TSteps): this {
    this.steps = this.steps.filter((s) => s.step !== step);
    this.steps.push({ step, withRollback: false });
    return this;
  }

  withRollback(): this {
    this.steps[this.steps.length - 1].withRollback = true;
    return this;
  }

  build(): DistributedTransactionStructure<TSteps> {
    const steps = this.steps.reduce(
      (acc, s, index) => {
        const prevSteps = this.steps.slice(0, index);
        const nextRollbackStep = prevSteps
          .reverse()
          .find((step) => step.withRollback);

        return {
          ...acc,
          [s.step]: {
            nextStep: this.steps[index + 1]?.step || null,
            nextRollback: nextRollbackStep?.step || null,
            withRollback: s.withRollback,
          } as DistributedTransactionStep<TSteps>,
        };
      },
      {} as { [key in TSteps]: DistributedTransactionStep<TSteps> },
    );

    return {
      type: this.type,
      state: {
        firstStep: this.steps[0].step,
        lastStep: this.steps[this.steps.length - 1].step,
        rollingBack: false,
        steps: steps as any,
      },
    };
  }
}
