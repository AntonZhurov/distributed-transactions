# Distributed Transaction

## Описание
Экземпляр распределенной транзакции. Отвечает за изменение состояния тразнакции.
Валидирует корректность действий проводимых над транзакцией и данных, которые были переданы для обработки изменений состояния.

## Контракт

```ts
type IDistributedTransaction<
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
  id: string;
  type: string;
  status: DISTRIBUTED_TRANSACTION_STATUS;
  statusDescription?: string;
  context: TContext;
  meta: Record<any, any>;
  state: DistributedTransactionStepsState<
      TSteps,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
  >;
  isRollingBack: boolean;
  currentStep: DistributedTransactionStep<TSteps> | null;

  start(): DistributedTransactionStep;
  step(): DistributedTransactionStep;
  stepRollback(): DistributedTransactionStep;
  handleStepSuccess<TStep extends TSteps>(
      step: TStep,
      response: TSuccessResponseByStep[TStep],
  ): { completed: boolean };
  handleStepFailure<TStep extends TSteps>(
      step: TStep,
      response: DistributedTransactionErrorStepResponse,
  ): { completed: boolean };
  handleStepRollbackSuccess<TStep extends TSteps>(
      step: TStep,
  ): { completed: boolean };
  handleStepRollbackFailed<TStep extends TSteps>(
      step: TStep,
  ): { completed: boolean };
  rollback(): void;
  complete(): void;
  fail(): void;
  toJSON(): SerializedDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
  >;
};
```
### Поля

`id` - id

`type` - тип

`status` - статус

`statusDescription?` - описание статуса

`context` - контекст

`meta` - метаданные всей транзакции, устанавливаются при помощи хуков, когда транзакция завершила обработку

`state` - актуальное состояние всех шагов транзакции. Подробней [Состояние шагов транзакции](./transaction-steps-state.md)

`isRollingBack` - находится ли транзакция в состоянии отката

`currentStep` - шаг, который находиться в обработке на данные момент

### Методы

`start()` - переводить транзакцию в статус обработки и собирает первый шаг

`step()` - собирает данные для шага, который сейчас находится в обработке

`stepRollback()` - собирает данные для шага, который сейчас находится в обработке отката

`handleStepSuccess()` - обрабатывает успешное выполнения шага, который сейчас в обработке. Если переданный шаг не является актуальным, то выбросит ошибку. При успешной обработке перейдет на следующий шаг. В ответе возвращает завершилась ли обработка всей транзакции.

`handleStepFailure()` - обрабатывает ошибочное выполнения шага, который сейчас в обработке. Если переданный шаг не является актуальным, то выбросит ошибку. При успешной обработке переведет транзакция в состояние отката и установить актуальный шаг отката. В ответе возвращает завершилась ли обработка всей транзакции.

`handleStepRollbackSuccess()` - обрабатывает успешное выполнения шага, который сейчас в обработке отката. Если переданный шаг не является актуальным, то выбросит ошибку. При успешной обработке перейдет на следующий шаг отката. В ответе возвращает завершилась ли обработка всей транзакции.

`handleStepRollbackFailed()` - обрабатывает ошибочное выполнения шага, который сейчас в обработке отката. Если переданный шаг не является актуальным, то выбросит ошибку. При успешной обработке переведет транзакцию в состояние ошибки отката. В ответе всегда возвращает `false`.

`rollback()` - переводить транзакцию в состояние отката.

`complete()` - успешно завершает транзакцию, если не все шаги были выполнены, то выбрасывает ошибку.

`fail()` - завершает транзакцию с ошибкой, если не для всех шагов был выполнен откат, то выбрасывает ошибку.

`toJSON()` - Возвращает сериализованную транзакцию в формате JSON

### Джейнерики

`TSteps` - шаги транзакции

`TContext` - контекст распределенной транзакции, которым можно управлять по ходу выполнения транзакции. Используется для наполнения полезной нагрузки каждого шага

`TPayloadByStep` - полезная нагрузка каждого шага транзакции

`TMetaByStep` - Любые метаданные, которые нужны для отправки шага транзакции

`TSuccessResponseByStep` - Тип ответа успешной обработки шага

`TRollbackPayloadByStep` - Аналогично с TPayloadByStep, только для обработки rollback шага

`TRollbackMetaByStep` - Аналогично с TMetaByStep, только для обработки rollback шага

### Статус транзакции

```ts
enum DISTRIBUTED_TRANSACTION_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSING_ROLLBACK = 'processing_rollback',
  COMPLETED = 'completed',
  ROLLBACK_FAILED = 'rollback_failed',
  FAILED = 'failed',
}
```

`PENDING` - ожидает начала обработки

`PROCESSING` - обрабатывается

`PROCESSING_ROLLBACK` - обрабатывается откат

`COMPLETED` - успешно завершена

`ROLLBACK_FAILED` - ошибка во время отката

`FAILED` - завершена с ошибкой

### Экземпляр транзакции
```ts
class DistributedTransaction<
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
    >{
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
  );
  ...
}
```

Конструктор

`data: CreateDistributedTransactionData` - поля из [IDistributedTransaction](#поля)

`options: DistributedTransactionOptions` - данные необходимые для обработки транзакции. Подробней [DistributedTransactionOptions](./transaction-options.md)

## Пример

```ts
const transaction = new DistributedTransaction(
    {
      id: crypto.randomUUID(),
      type: structure.type,
      state: Object.assign({}, this.structure.state),
      status: DISTRIBUTED_TRANSACTION_STATUS.PENDING,
      context: context,
      meta: {},
    },
    {
      stepHooks: stepHooks,
      payloadBuilder: payloadBuilder,
      metaBuilder: metaBuilder,
      transactionHooks: transactionHooks,
    },
);

transaction.start();
transaction.handleStepSuccess('step1', response);
transaction.step();
transaction.handleStepSuccess('step2', response);
transaction.complete();
```

## Заметка

Если собираетесь использовать встроенные [DistributedTransactionRunner](./transaction-runner.md), то нету необходимости на прямую работать с экземпляром распределенной транзакции.
