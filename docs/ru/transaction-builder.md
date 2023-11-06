# Distributed Transaction Builder

## Описание
Предназначен для того чтобы описать структуру транзакции.

##  Контракт

```ts
class DistributedTransactionBuilder<TSteps extends string = string> {
  constructor(type: string);

  step(step: TSteps): this;
  withRollback(): this;
  build(): DistributedTransactionStructure<TSteps>;
}
```

`step(step: TStep)` - указывает шаги транзакции по порядку

`withRollback()` - вызывается после step() для которого нужно указать, то что есть rollback

`build()` - возвращает сформированную структуру транзакции.
Подробней о структуре тразакции - [Transaction structure](./transaction-structure.md)

## Пример

```ts
enum Steps {
  STEP1 = 'step_1',
  STEP2 = 'step_2',
  STEP3 = 'step_3',
}

const builder = new DistributedTransactionBuilder<Steps>('test');

const structure = builder
    .step(Steps.STEP1)
    .step(Steps.STEP2)
    .withRollback()
    .step(Steps.STEP3)
    .withRollback()
    .build()
```
