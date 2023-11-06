import { beforeEach, describe, expect, test } from '@jest/globals';
import {
  DistributedTransaction,
  DistributedTransactionRunner,
} from '../lib/core';
import {
  CreateDistributedTransactionRunnerOptions,
  DISTRIBUTED_TRANSACTION_STATUS,
  DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS,
  DISTRIBUTED_TRANSACTION_STEP_STATUS,
} from '../lib/types';
import {
  Broker,
  StateManager,
  Steps,
  structure,
  TransactionRunner,
} from '../example';

describe('Transaction runner', () => {
  let runner: TransactionRunner;
  const stateManager = new StateManager();
  const broker = new Broker();
  beforeEach(() => {
    runner = new TransactionRunner(broker, stateManager);
  });

  test('Create transaction runner', () => {
    const options: CreateDistributedTransactionRunnerOptions = {
      transaction: undefined as any,
      logger: undefined as any,
      stateManager: undefined as any,
      broker: undefined as any,
    };
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner transaction option must be provided',
    );
    options.transaction = {
      transactionHooks: undefined as any,
      stepHooks: undefined as any,
      structure: undefined as any,
      metaBuilder: undefined as any,
      payloadBuilder: undefined as any,
    };
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner stateManager option must be provided',
    );
    options.stateManager = new StateManager();
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner logger option must be provided',
    );
    options.logger = {
      error() {},
      info() {},
    };
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner broker option must be provided',
    );
    options.broker = new Broker();
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner transaction.transactionHooks option must be provided',
    );
    options.transaction.transactionHooks = {};
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner transaction.stepHooks option must be provided',
    );
    options.transaction.stepHooks = {};
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner transaction.structure option must be provided',
    );
    options.transaction.structure = structure;
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner transaction.metaBuilder option must be provided',
    );
    options.transaction.metaBuilder = {};
    expect(() => new DistributedTransactionRunner(options)).toThrow(
      'DistributedTransactionRunner transaction.payloadBuilder option must be provided',
    );
    options.transaction.payloadBuilder = {};
    expect(() => new DistributedTransactionRunner(options)).not.toThrow();
  });

  test('Runner.start()', async () => {
    const transaction = await runner.start({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    expect(transaction.context).toEqual({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    expect(transaction.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.PROCESSING);
    expect(transaction.state.currentStep).toBe(Steps.STEP1);
    const step = transaction.state.steps[Steps.STEP1];
    expect(step.status).toBe(DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING);
    expect(step.payload).toEqual({ productIds: ['1', '2', '3'], amount: 100 });
  });

  test('Runner.handleStepSuccess()', async () => {
    let transaction = await runner.start({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    transaction = await runner.handleStepSuccess(transaction.id, Steps.STEP1, {
      orderId: 'order_id',
    });

    expect(transaction.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.PROCESSING);

    const step1 = transaction.state.steps[Steps.STEP1];
    const step2 = transaction.state.steps[Steps.STEP2];

    expect(step1.status).toBe(DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED);
    expect(step1.response).toEqual({ orderId: 'order_id' });

    expect(step2.status).toBe(DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING);
    await expect(
      runner.handleStepSuccess(transaction.id, Steps.STEP4, {
        transactionId: '',
      }),
    ).rejects.toThrow();

    await expect(
      runner.handleStepSuccess('', Steps.STEP2, {
        paymentId: '',
      }),
    ).rejects.toThrow();

    await runner.handleStepSuccess(transaction.id, Steps.STEP2, {
      paymentId: 'payment_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP3, {
      userId: 'user_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP4, {
      transactionId: 'transaction_id',
    });
    transaction = await runner.handleStepSuccess(transaction.id, Steps.STEP5, {
      successful: true,
    });

    expect(transaction.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.COMPLETED);
    expect(transaction.meta).toEqual({
      message: 'onCompleted transaction hook',
      id: transaction.id,
      type: transaction.type,
    });
  });

  test('Runner.handleStepFailure()', async () => {
    let transaction = await runner.start({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    transaction = await runner.handleStepFailure(transaction.id, Steps.STEP1, {
      error: { name: 'test', message: 'error' },
    });

    expect(transaction.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.FAILED);

    const step1 = transaction.state.steps[Steps.STEP1];

    expect(step1.status).toBe(DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED);
    expect(step1.response).toEqual({
      error: { name: 'test', message: 'error' },
    });

    transaction = await runner.start({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP1, {
      orderId: 'order_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP2, {
      paymentId: 'payment_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP3, {
      userId: 'user_id',
    });

    await expect(
      runner.handleStepFailure(transaction.id, Steps.STEP5, {
        error: { name: 'test', message: 'error' },
      }),
    ).rejects.toThrow();
    transaction = await runner.handleStepFailure(transaction.id, Steps.STEP4, {
      error: { name: 'test', message: 'error' },
    });

    expect(transaction.status).toBe(
      DISTRIBUTED_TRANSACTION_STATUS.PROCESSING_ROLLBACK,
    );

    const step4 = transaction.state.steps[Steps.STEP4];
    const step3 = transaction.state.steps[Steps.STEP3];

    expect(step4.status).toBe(DISTRIBUTED_TRANSACTION_STEP_STATUS.FAILED);
    expect(step4.response).toEqual({
      error: { name: 'test', message: 'error' },
    });
    expect(step3.status).toBe(DISTRIBUTED_TRANSACTION_STEP_STATUS.COMPLETED);
    expect(step3.rollbackStatus).toBe(
      DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS.PROCESSING,
    );
  });

  test('Runner.handleStepRollbackSuccess()', async () => {
    let transaction = await runner.start({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP1, {
      orderId: 'order_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP2, {
      paymentId: 'payment_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP3, {
      userId: 'user_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP4, {
      transactionId: 'transaction_id',
    });
    transaction = await runner.handleStepFailure(transaction.id, Steps.STEP5, {
      error: { name: 'test', message: 'error' },
    });

    expect(transaction.status).toBe(
      DISTRIBUTED_TRANSACTION_STATUS.PROCESSING_ROLLBACK,
    );
    let step4 = transaction.state.steps[Steps.STEP4];

    expect(step4.rollbackStatus).toBe(
      DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS.PROCESSING,
    );

    await expect(
      runner.handleStepRollbackSuccess(transaction.id, Steps.STEP2),
    ).rejects.toThrow();

    transaction = await runner.handleStepRollbackSuccess(
      transaction.id,
      Steps.STEP4,
    );
    step4 = transaction.state.steps[Steps.STEP4];
    expect(step4.rollbackStatus).toBe(
      DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS.COMPLETED,
    );
    await runner.handleStepRollbackSuccess(transaction.id, Steps.STEP3);
    transaction = await runner.handleStepRollbackSuccess(
      transaction.id,
      Steps.STEP2,
    );

    expect(transaction.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.FAILED);
    expect(transaction.meta).toEqual({
      message: 'onFailed transaction hook',
      id: transaction.id,
      type: transaction.type,
    });
  });

  test('Runner.handleStepRollbackFailure()', async () => {
    let transaction = await runner.start({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP1, {
      orderId: 'order_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP2, {
      paymentId: 'payment_id',
    });
    await runner.handleStepSuccess(transaction.id, Steps.STEP3, {
      userId: 'user_id',
    });

    transaction = await runner.handleStepFailure(transaction.id, Steps.STEP4, {
      error: { name: 'test', message: 'error' },
    });

    expect(transaction.status).toBe(
      DISTRIBUTED_TRANSACTION_STATUS.PROCESSING_ROLLBACK,
    );
    let step3 = transaction.state.steps[Steps.STEP3];

    expect(step3.rollbackStatus).toBe(
      DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS.PROCESSING,
    );

    await expect(
      runner.handleStepRollbackFailure(transaction.id, Steps.STEP2),
    ).rejects.toThrow();

    transaction = await runner.handleStepRollbackFailure(
      transaction.id,
      Steps.STEP3,
    );
    step3 = transaction.state.steps[Steps.STEP3];
    expect(step3.rollbackStatus).toBe(
      DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS.FAILED,
    );

    expect(transaction.status).toBe(
      DISTRIBUTED_TRANSACTION_STATUS.ROLLBACK_FAILED,
    );
    expect(transaction.meta).toEqual({
      message: 'onRollbackFailed transaction hook',
      id: transaction.id,
      type: transaction.type,
    });
  });

  test('Runner.createTransaction()', async () => {
    const transaction = runner.createTransaction({
      productIds: ['1', '2', '3'],
      amount: 100,
    });

    expect(transaction).toBeInstanceOf(DistributedTransaction);

    expect(transaction.status).toBe(DISTRIBUTED_TRANSACTION_STATUS.PENDING);
    expect(transaction.type).toBe(structure.type);
    expect(transaction.context).toEqual({
      productIds: ['1', '2', '3'],
      amount: 100,
    });
    expect(transaction.meta).toEqual({});
    expect(transaction.state.firstStep).toBe(Steps.STEP1);
    expect(transaction.state.lastStep).toBe(Steps.STEP5);
    expect(transaction.state.currentStep).toBeUndefined();
  });
});
