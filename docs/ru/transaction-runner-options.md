# Distributed Transaction Runner Options

## Описание
Данные которые необходимо передать в DistributedTransactionRunner для корректной работы.

## Контракт

```ts
interface CreateDistributedTransactionRunnerOptions<
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
    TOptions extends Record<any, any> = Record<any, any>
> {
  logger: DistributedTransactionRunnerLogger;
  stateManager: DistributedTransactionStateManager<TOptions>;
  broker: DistributedTransactionBroker<TOptions>;
  transaction: {
    structure: DistributedTransactionStructure<TSteps>;
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
  };
}
```

### Logger
Логирует все действия над транзакцией

```ts
interface DistributedTransactionRunnerLogger {
  info(message: string, data?: Record<any, any>): void;
  error(message: string, data?: Record<any, any>): void;
}
```

### State Manager
Управляет состоянием транзакции в хранилище

```ts
interface DistributedTransactionStateManager<
    Options extends Record<any, any> = Record<any, any>,
> {
  save(transaction: IDistributedTransaction, options?: Options): Promise<void>;
  update(
      transaction: IDistributedTransaction,
      options?: Options,
  ): Promise<void>;
  load(
      id: string,
      options?: Options,
  ): Promise<IDistributedTransaction | undefined>;
}
```

`Options` - любые параметры, которые необходимы для выполнения вашей имплементации

### Broker
Отправляет сообщения участникам транзакции

```ts
interface DistributedTransactionBroker<
    TSteps extends string = string,
    Options extends Record<any, any> = Record<any, any>,
> {
  send(
      step: TSteps,
      data: DistributedTransactionStep<TSteps>,
      options?: Options,
  ): Promise<void>;
}
```

`Options` - любые параметры, которые необходимы для выполнения вашей имплементации

## Заметка
Выбирайте для StateManager хранилище, которое максимально подходит под ваши цели.

Broker не обязательно должен сразу же отправлять шаги обработчикам, к примеру он может сохранять шаг как сообщение в message_outbox таблицу

