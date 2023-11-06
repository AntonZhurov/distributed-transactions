# Distributed Transaction Steps State

## Описание
Описывает актуальное состояние шагов транзакции

## Контракт

```ts
type DistributedTransactionStepsState<
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
```

`firstStep` - первый шаг транзакции

`lastStep` - последний шаг транзакции

`currentStep?` - актуальный шаг, если транзакция не началась или уже завершилась, то актуальный шаг не определен

`rollingBack` - в состоянии отката

`steps` - информация о каждом шаге


```ts
type DistributedTransactionStep<
    TSteps extends string = string,
    TStatus extends
        DISTRIBUTED_TRANSACTION_STEP_STATUS = DISTRIBUTED_TRANSACTION_STEP_STATUS,
    TPayload = any,
    TMeta = any,
    TSuccessResponse = any,
    TRollbackPayload = any,
    TRollbackMeta = any,
> = {
  status?: TStatus;
  nextStep?: TSteps;
  withRollback?: boolean;
  rollbackStatus?: DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS;
  rollbackPayload?: TRollbackPayload;
  rollbackMeta?: TRollbackMeta;
  nextRollback?: TSteps;
  response?: DistributedTransactionStepResponse<TStatus, TSuccessResponse>;
  payload?: TPayload;
  meta?: TMeta;
};
```

`status?` - Статус обработки шага транзакции

`nextStep?` - Следующий шаг

`withRollback?` - Нужно ли обрабатывать откат данного шага

`rollbackStatus?` - Статус обработки отката

`rollbackPayload?` - Полезная нагрузка отката

`rollbackMeta?` - Метаданные отката

`nextRollback?` - Следующий шаг, в котором нужно обрабатывать откат

`response?` - Ответ на обработку шага, при успешном его выполнении, если обработка оказалась ошибочной то response имеет тип DistributedTransactionErrorStepResponse

```ts
type DistributedTransactionErrorStepResponse = {
  error: { name: string; message: string; stack?: string };
};
```

`payload?` - Полезная нагрузка шага

`meta?` - Метаданные шага

```ts
enum DISTRIBUTED_TRANSACTION_STEP_STATUS {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
```
Статус обработки шага

`PROCESSING` - В обработке

`COMPLETED` - Выполнен успешно

`FAILED` - Выполнен с ошибкой

```ts
enum DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
```
Статус обработки отката

`PROCESSING` - В обработке

`COMPLETED` - Выполнен успешно

`FAILED` - Выполнен с ошибкой

