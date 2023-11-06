import { beforeEach, describe, expect, test } from '@jest/globals';
import * as crypto from 'node:crypto';
import {
  MetaBuilder,
  PayloadBuilder,
  Steps,
  structure,
  TransactionHooks,
  TransactionStepHooks,
  TestDistributedTransaction,
} from '../example';
import {
  DISTRIBUTED_TRANSACTION_STATUS,
  DISTRIBUTED_TRANSACTION_STEP_STATUS,
  DistributedTransactionStep,
} from '../lib/types';

describe('Distributed transaction', () => {
  let trx: TestDistributedTransaction;
  beforeEach(() => {
    trx = new TestDistributedTransaction(
      {
        id: crypto.randomUUID() as string,
        context: { productIds: ['1', '2', '3'], amount: 100 },
        state: { ...structure.state },
        status: DISTRIBUTED_TRANSACTION_STATUS.PENDING,
        type: structure.type,
        meta: {},
      },
      {
        stepHooks: TransactionStepHooks,
        payloadBuilder: PayloadBuilder,
        metaBuilder: MetaBuilder,
        transactionHooks: TransactionHooks,
      },
    );
  });

  test('Create transaction', () => {
    expect(trx.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.PENDING);
    expect(trx.type).toBe(structure.type);
    expect(trx.meta).toEqual({});
    expect(trx.context).toEqual({ productIds: ['1', '2', '3'], amount: 100 });
    expect(trx.currentStep).toBe(null);
    expect(trx.state.currentStep).toBeUndefined();
    expect(trx.state.firstStep).toBe(Steps.STEP1);
    expect(trx.state.lastStep).toBe(Steps.STEP5);
    expect(trx.state.rollingBack).toBe(false);
    expect(trx.state.steps).toEqual({
      [Steps.STEP1]: {
        nextStep: Steps.STEP2,
        nextRollback: null,
        withRollback: false,
      },
      [Steps.STEP2]: {
        nextStep: Steps.STEP3,
        nextRollback: null,
        withRollback: true,
      },
      [Steps.STEP3]: {
        nextStep: Steps.STEP4,
        nextRollback: Steps.STEP2,
        withRollback: true,
      },
      [Steps.STEP4]: {
        nextStep: Steps.STEP5,
        nextRollback: Steps.STEP3,
        withRollback: true,
      },
      [Steps.STEP5]: {
        nextStep: null,
        nextRollback: Steps.STEP4,
        withRollback: true,
      },
    });
  });

  test('Payload and Meta builder', () => {
    let currentStep = trx.start()!;

    //STEP 1
    expect(currentStep.payload).toEqual({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    expect(currentStep.meta).toEqual({
      transaction: {
        id: trx.id,
        type: trx.type,
      },
      context: trx.context,
      payload: currentStep.payload,
      response: {
        success: {
          to: 'step_1_success_response_channel',
        },
        failure: {
          to: 'step_1_failure_response_channel',
        },
      },
    });
    //STEP 1

    //STEP2
    trx.handleStepSuccess(Steps.STEP1, { orderId: 'order_id' });
    currentStep = trx.step()!;
    expect(currentStep.payload).toEqual({ orderId: 'order_id' });
    expect(currentStep.meta).toEqual({
      transaction: {
        id: trx.id,
        type: trx.type,
      },
      context: trx.context,
      payload: currentStep.payload,
      response: {
        success: {
          to: 'step_2_success_response_channel',
        },
        failure: {
          to: 'step_2_failure_response_channel',
        },
      },
    });
    //STEP2

    //STEP3
    trx.handleStepSuccess(Steps.STEP2, { paymentId: 'payment_id' });
    currentStep = trx.step()!;
    expect(currentStep.payload).toEqual({ paymentId: 'payment_id' });
    expect(currentStep.meta).toEqual({
      transaction: {
        id: trx.id,
        type: trx.type,
      },
      context: trx.context,
      payload: currentStep.payload,
      response: {
        success: {
          to: 'step_3_success_response_channel',
        },
        failure: {
          to: 'step_3_failure_response_channel',
        },
      },
    });
    //STEP3

    //STEP4
    trx.handleStepSuccess(Steps.STEP3, { userId: 'user_id' });
    currentStep = trx.step()!;
    expect(currentStep.payload).toEqual({ userId: 'user_id' });
    expect(currentStep.meta).toEqual({
      transaction: {
        id: trx.id,
        type: trx.type,
      },
      context: trx.context,
      payload: currentStep.payload,
      response: {
        success: {
          to: 'step_4_success_response_channel',
        },
        failure: {
          to: 'step_4_failure_response_channel',
        },
      },
    });
    //STEP4

    //STEP5
    trx.handleStepSuccess(Steps.STEP4, { transactionId: 'transactionId' });
    currentStep = trx.step()!;
    expect(currentStep.payload).toEqual({ transactionId: 'transactionId' });
    expect(currentStep.meta).toEqual({
      transaction: {
        id: trx.id,
        type: trx.type,
      },
      context: trx.context,
      payload: currentStep.payload,
      response: {
        success: {
          to: 'step_5_success_response_channel',
        },
        failure: {
          to: 'step_5_failure_response_channel',
        },
      },
    });
    //STEP5

    //End of transaction
    const { completed } = trx.handleStepSuccess(Steps.STEP5, {
      successful: true,
    });
    expect(completed).toBeTruthy();
  });

  test('Step state', () => {
    let currentStep: DistributedTransactionStep | null = trx.start()!;
    expect(trx.state.currentStep).toBe(Steps.STEP1);
    expect(currentStep!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING,
    );
    trx.handleStepSuccess(Steps.STEP1, { orderId: 'order_id' });
    expect(trx.state.steps[Steps.STEP1]!.response).toEqual({
      orderId: 'order_id',
    });
    expect(trx.state.steps[Steps.STEP1]!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED,
    );

    currentStep = trx.step();
    expect(trx.state.currentStep).toBe(Steps.STEP2);
    expect(currentStep!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING,
    );
    trx.handleStepSuccess(Steps.STEP2, { paymentId: 'payment_id' });
    expect(trx.state.steps[Steps.STEP2]!.response).toEqual({
      paymentId: 'payment_id',
    });
    expect(trx.state.steps[Steps.STEP2]!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED,
    );

    currentStep = trx.step();
    expect(trx.state.currentStep).toBe(Steps.STEP3);
    expect(currentStep!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING,
    );
    trx.handleStepSuccess(Steps.STEP3, { userId: 'user_id' });
    expect(trx.state.steps[Steps.STEP3]!.response).toEqual({
      userId: 'user_id',
    });
    expect(trx.state.steps[Steps.STEP3]!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED,
    );

    currentStep = trx.step();
    expect(trx.state.currentStep).toBe(Steps.STEP4);
    expect(currentStep!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING,
    );
    trx.handleStepSuccess(Steps.STEP4, { transactionId: 'transaction_id' });
    expect(trx.state.steps[Steps.STEP4]!.response).toEqual({
      transactionId: 'transaction_id',
    });
    expect(trx.state.steps[Steps.STEP4]!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED,
    );

    currentStep = trx.step()!;
    expect(trx.state.currentStep).toBe(Steps.STEP5);
    expect(currentStep!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING,
    );
    trx.handleStepSuccess(Steps.STEP5, { successful: true });
    expect(trx.state.steps[Steps.STEP5]!.response).toEqual({
      successful: true,
    });
    expect(trx.state.steps[Steps.STEP5]!.status).toBe(
      DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED,
    );
  });

  test('Forbidden executes', () => {
    expect(() => trx.step()).toThrow('Transaction doesnt processing');

    trx.start();

    expect(() => trx.start()).toThrow(
      `Transaction ${trx.id}/${trx.type} already started`,
    );

    expect(() => trx.stepRollback()).toThrow(
      'Forbidden to make rollback step when rollback not initiated',
    );

    expect(() =>
      trx.handleStepSuccess(Steps.STEP2, { paymentId: 'payment_id' }),
    ).toThrow(
      `Execute handleStepSuccess with step '${Steps.STEP2}' when current step '${Steps.STEP1}'`,
    );
    expect(() =>
      trx.handleStepFailure(Steps.STEP2, {
        error: { name: 'test', message: 'test' },
      }),
    ).toThrow(
      `Execute handleStepFailure with step '${Steps.STEP2}' when current step '${Steps.STEP1}'`,
    );
    expect(() => trx.complete()).toThrow();
    expect(() => trx.fail()).toThrow();
    expect(() =>
      trx.handleStepFailure(Steps.STEP3, {
        error: { name: 'test', message: 'test' },
      }),
    ).toThrow();
    expect(() => trx.stepRollback()).toThrow();
    expect(() => trx.handleStepRollbackSuccess(Steps.STEP2)).toThrow();
    expect(() => trx.handleStepRollbackFailed(Steps.STEP2)).toThrow();
  });

  test('Complete transaction', () => {
    let handleResult;
    trx.start();
    handleResult = trx.handleStepSuccess(Steps.STEP1, { orderId: 'order_id' });
    expect(handleResult).toEqual({ completed: false });
    handleResult = trx.handleStepSuccess(Steps.STEP2, {
      paymentId: 'payment_id',
    });
    expect(handleResult).toEqual({ completed: false });
    handleResult = trx.handleStepSuccess(Steps.STEP3, { userId: 'user_id' });
    expect(handleResult).toEqual({ completed: false });
    handleResult = trx.handleStepSuccess(Steps.STEP4, {
      transactionId: 'transaction_id',
    });
    expect(handleResult).toEqual({ completed: false });
    handleResult = trx.handleStepSuccess(Steps.STEP5, { successful: true });
    expect(handleResult).toEqual({ completed: true });
    trx.complete();
    expect(trx.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.COMPLETED);
    expect(trx.meta).toEqual({
      id: trx.id,
      message: 'onCompleted transaction hook',
      type: 'create_order',
    });
  });

  test('handleStepFailure', () => {
    trx.start();
    expect(() =>
      trx.handleStepFailure(Steps.STEP5, {
        error: { name: 'test', message: 'test' },
      }),
    ).toThrow(
      `Execute handleStepFailure with step '${Steps.STEP5}' when current step '${Steps.STEP1}'`,
    );
    const { completed } = trx.handleStepFailure(Steps.STEP1, {
      error: { name: 'test', message: 'test' },
    });
    expect(completed).toBe(true);
    const step = trx.state.steps[Steps.STEP1];
    expect(step.status).toBe(DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED);
    expect(step.response).toEqual({
      error: { name: 'test', message: 'test' },
    });
    expect(trx.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.PROCESSING_ROLLBACK);
    expect(trx.currentStep).toBe(null);
  });

  test('Rollback transaction', () => {});

  test('Failed rollback', () => {});
});
