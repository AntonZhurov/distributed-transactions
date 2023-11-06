# Distributed Transaction Runner

## Описание
Сервис который выполняет действия по пути выполнения шагов тразнакции.
Создает экземпляры распределенных транзакций и обрабатывает ответы участников транзакции.
Занимается логированием всех действий над транзакцией, отправкой шагов в брокер и сохранением состояния тразакции.

## Контракт

```ts
interface IDistributedTransactionRunner<
    TSteps extends string = string,
    TContext extends Record<any, any> = Record<any, any>,
    TStartPayload extends Record<any, any> = Record<any, any>,
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
  start(
      payload: TStartPayload,
      options: TOptions,
  ): Promise<
      SerializedDistributedTransaction<
          TSteps,
          TContext,
          TPayloadByStep,
          TMetaByStep,
          TSuccessResponseByStep,
          TRollbackPayloadByStep,
          TRollbackMetaByStep
      >
  >;
  handleStepSuccess<TStep extends TSteps>(
      id: string,
      step: TStep,
      response: TSuccessResponseByStep[TStep],
      options: TOptions,
  ): Promise<
      SerializedDistributedTransaction<
          TSteps,
          TContext,
          TPayloadByStep,
          TMetaByStep,
          TSuccessResponseByStep,
          TRollbackPayloadByStep,
          TRollbackMetaByStep
      >
  >;
  handleStepFailure<TStep extends TSteps>(
      id: string,
      step: TStep,
      response: DistributedTransactionErrorStepResponse,
      options: TOptions,
  ): Promise<
      SerializedDistributedTransaction<
          TSteps,
          TContext,
          TPayloadByStep,
          TMetaByStep,
          TSuccessResponseByStep,
          TRollbackPayloadByStep,
          TRollbackMetaByStep
      >
  >;
  handleStepRollbackSuccess<TStep extends TSteps>(
      id: string,
      step: TStep,
      options: TOptions,
  ): Promise<
      SerializedDistributedTransaction<
          TSteps,
          TContext,
          TPayloadByStep,
          TMetaByStep,
          TSuccessResponseByStep,
          TRollbackPayloadByStep,
          TRollbackMetaByStep
      >
  >;
  handleStepRollbackFailure<TStep extends TSteps>(
      id: string,
      step: TStep,
      options: TOptions,
  ): Promise<
      SerializedDistributedTransaction<
          TSteps,
          TContext,
          TPayloadByStep,
          TMetaByStep,
          TSuccessResponseByStep,
          TRollbackPayloadByStep,
          TRollbackMetaByStep
      >
  >;
  createTransaction(
      payload: TStartPayload,
  ): IDistributedTransaction<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
  >;
}
```

`handleStepSuccess()`, `handleStepFailure()`, `handleStepRollbackSuccess()`, `handleStepRollbackFailure()` - аналогичны подобным методам в [DistributedTransaction](./transaction.md#методы). В методы необходимо передавать id транзакции т.к они будут загружены из хранилища. При необходимости шаги будут отправлены в брокер и в конце обработки транзакция будет обновлена в хранилище

`start()` - выполняет те же действия, что и описаны выше. Аргументом необходимо передать стартовую полезную нагрузку для транзакции.

`createTransaction()` - метод, который используется в  `start()`, для создания нового экземпляра. Его можно переопределить для того,чтобы создавать собственный экземпляр DistributedTransaction. Если его не переопределять, то будет создаваться базовый экземпляр транзакции


### Имплементация

```ts
class DistributedTransactionRunner<
    TSteps extends string = string,
    TContext extends Record<any, any> = Record<any, any>,
    TStartPayload extends Record<any, any> = Record<any, any>,
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
> implements
    IDistributedTransactionRunner<
        TSteps,
        TContext,
        TStartPayload,
        TSuccessResponseByStep,
        TPayloadByStep,
        TMetaByStep,
        TRollbackPayloadByStep,
        TRollbackMetaByStep,
        TOptions
    >
{
  protected readonly structure: DistributedTransactionStructure<TSteps>;
  protected readonly payloadBuilder: DistributedTransactionPayloadBuilder<
      TSteps,
      TContext,
      TSuccessResponseByStep,
      TPayloadByStep,
      TRollbackPayloadByStep
  >;
  protected readonly metaBuilder: DistributedTransactionMetaBuilder<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
  >;
  protected readonly stepHooks: DistributedTransactionStepHooks<
      TSteps,
      TContext,
      TPayloadByStep,
      TMetaByStep,
      TSuccessResponseByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
  >;
  protected readonly transactionHooks: DistributedTransactionHooks<
      TSteps,
      TContext,
      TSuccessResponseByStep,
      TPayloadByStep,
      TMetaByStep,
      TRollbackPayloadByStep,
      TRollbackMetaByStep
  >;
  protected readonly logger: DistributedTransactionRunnerLogger;
  protected readonly stateManager: DistributedTransactionStateManager<TOptions>;
  protected readonly broker: DistributedTransactionBroker<TOptions>;

  constructor(
      options: CreateDistributedTransactionRunnerOptions<
          TSteps,
          TContext,
          TSuccessResponseByStep,
          TPayloadByStep,
          TMetaByStep,
          TRollbackPayloadByStep,
          TRollbackMetaByStep,
          TOptions
      >,
  );
  ...
```

`structure` - структура транзакции. Подробней [DistributedTransactionStructure](./transaction-structure.md)

`payloadBuilder` -  Подробней [DistributedTransactionPayloadBuilder](./transaction-options.md#payloadbuilder)

`metaBuilder` -  Подробней [DistributedTransactionMetaBuilder](./transaction-options.md#metabuilder)

`stepHooks` -  Подробней [DistributedTransactionStepHooks](./transaction-options.md#stephooks)

`transactionHooks` -  Подробней [DistributedTransactionTransactionHooks](./transaction-options.md#transactionhooks)

`logger` - Подробней [DistributedTransactionRunnerLogger](./transaction-runner-options.md#logger)

`stateManager` - Подробней [DistributedTransactionRunnerStateManager](./transaction-runner-options.md#state-manager)

`broker` - Подробней [DistributedTransactionRunnerBroker](./transaction-runner-options.md#broker)


## Пример

```ts
class TransactionRunner extends DistributedTransactionRunner<
    Steps,
    TransactionContext,
    StartPayload,
    SuccessResponseByStep,
    PayloadByStep,
    MetaByStep,
    RollbackPayloadByStep,
    RollbackMetaByStep
> {
  constructor(
      broker: DistributedTransactionBroker,
      stateManager: DistributedTransactionStateManager,
  ) {
    super({
      transaction: {
        stepHooks: TransactionStepHooks,
        payloadBuilder: PayloadBuilder,
        metaBuilder: MetaBuilder,
        structure: structure,
        transactionHooks: TransactionHooks,
      },
      broker: broker,
      stateManager: stateManager,
      logger: {
        info: (message, data?: Record<any, any>) => {
          console.info(message, data)
        },
        error: (message, data?: Record<any, any>) => {
          console.error(message, data)
        },
      },
    });
  }

  createTransaction(payload: StartPayload): TestDistributedTransaction {
    return new TestDistributedTransaction(
        {
          id: crypto.randomUUID(),
          type: this.structure.type,
          state: Object.assign({}, this.structure.state),
          status: DISTRIBUTED_TRANSACTION_STATUS.PENDING,
          context: payload,
          meta: {},
        },
        {
          stepHooks: this.stepHooks,
          payloadBuilder: this.payloadBuilder,
          metaBuilder: this.metaBuilder,
          transactionHooks: this.transactionHooks,
        },
    );
  }
}
```
