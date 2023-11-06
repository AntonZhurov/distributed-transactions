# Distributed Transaction Options

## Описание
Данные, которые необходимо передать при создании транзакции.

## Контракт

```ts
interface DistributedTransactionOptions<
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
```

### Джейнерики
Такие же как у [Distributed Transaction](./transaction.md#джейнерики)

### Поля

`payloadBuilder` - Объект в котором описанны методы для сбора полезной нагрузки каждого шага в процессе обработки транзакции, так же для сбора полезной нагрузки во время отката

```ts
type DistributedTransactionPayloadBuilder<
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
```

`metaBuilder` - Объект в котором описанны методы для сбора метаданных каждого шага в процессе обработки транзакции, так же для сбора метаданных во время отката

```ts
type DistributedTransactionMetaBuilder<
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
```

`stepHooks` - Хуки жизненного цикла обработки, каждого шага в транзакции. Используются для мутации контекста транзакции

```ts
type DistributedTransactionStepHooks<
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
```

`transactionHooks` - Хуки жизненного цикла транзакции, вызываются когда останавливается обработка транзакции. Используется для мутации метаданных всей транзакции

```ts
type DistributedTransactionHooks<
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
```

## Примеры


### PayloadBuilder

```ts
const PayloadBuilder: DistributedTransactionPayloadBuilder<
    Steps,
    TransactionContext,
    SuccessResponseByStep,
    PayloadByStep,
    RollbackPayloadByStep
> = {
  [Steps.STEP1]: {
    step: (id, type, context) => ({
      productIds: context.productIds!,
      amount: context.amount!,
    }),
  },
  [Steps.STEP2]: {
    step: (id, type, context) => ({
      orderId: context.orderId!,
    }),
  },
  [Steps.STEP3]: {
    step: (id, type, context) => ({
      paymentId: context.paymentId!,
    }),
  },
  [Steps.STEP4]: {
    step: (id, type, context) => ({
      userId: context.userId!,
    }),
    rollback: (id, type, context, response) => ({
      transactionId: response.transactionId,
    }),
  },
  [Steps.STEP5]: {
    step: (id, type, context) => ({
      transactionId: context.transactionId!,
    }),
  },
};
```

### MetaBuilder

```ts
const MetaBuilder: DistributedTransactionMetaBuilder<
    Steps,
    TransactionContext,
    PayloadByStep,
    MetaByStep,
    RollbackPayloadByStep,
    RollbackMetaByStep
> = {
  [Steps.STEP1]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_1_success_response_channel',
        },
        failure: {
          to: 'step_1_failure_response_channel',
        },
      },
    }),
  },
  [Steps.STEP2]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_2_success_response_channel',
        },
        failure: {
          to: 'step_2_failure_response_channel',
        },
      },
    }),
  },
  [Steps.STEP3]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_3_success_response_channel',
        },
        failure: {
          to: 'step_3_failure_response_channel',
        },
      },
    }),
  },
  [Steps.STEP4]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_4_success_response_channel',
        },
        failure: {
          to: 'step_4_failure_response_channel',
        },
      },
    }),
    rollback: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_4_rollback_success_response_channel',
        },
        failure: {
          to: 'step_4_rollback_failure_response_channel',
        },
      },
    }),
  },
  [Steps.STEP5]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_5_success_response_channel',
        },
        failure: {
          to: 'step_5_failure_response_channel',
        },
      },
    }),
  },
};
```

### StepHooks

```ts
const TransactionStepHooks: DistributedTransactionStepHooks<
    Steps,
    TransactionContext,
    PayloadByStep,
    MetaByStep,
    SuccessResponseByStep,
    RollbackPayloadByStep,
    RollbackMetaByStep
> = {
  [Steps.STEP1]: {
    onSuccess: (context, step) => {
      context.orderId = step?.response?.orderId;
    },
  },
  [Steps.STEP2]: {
    onSuccess: (context, step) => {
      context.paymentId = step?.response?.paymentId;
    },
  },
  [Steps.STEP3]: {
    onSuccess: (context, step) => {
      context.userId = step?.response?.userId;
    },
  },
  [Steps.STEP4]: {
    onSuccess: (context, step) => {
      context.transactionId = step?.response?.transactionId;
    },
  },
};
```

### TransactionHooks

```ts
const TransactionHooks: DistributedTransactionHooks<
    Steps,
    TransactionContext,
    SuccessResponseByStep,
    PayloadByStep,
    MetaByStep,
    RollbackPayloadByStep,
    RollbackMetaByStep
> = {
  onCompleted: (meta, transaction) => {
    meta.message = 'onCompleted transaction hook';
    meta.id = transaction.id;
    meta.type = transaction.type;
  },
  onFailed: (meta, transaction) => {
    meta.message = 'onFailed transaction hook';
    meta.id = transaction.id;
    meta.type = transaction.type;
  },
  onRollbackFailed: (meta, transaction) => {
    meta.message = 'onRollbackFailed transaction hook';
    meta.id = transaction.id;
    meta.type = transaction.type;
  },
};
```
