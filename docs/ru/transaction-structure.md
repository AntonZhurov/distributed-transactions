# Distributed Transaction Structure

## Описание
Структура транзакции, описывает последовательность шагов и откатов.

## Контракт

```ts
interface DistributedTransactionStructure<
    TSteps extends string = string,
> {
  type: string;
  state: DistributedTransactionStepsState<TSteps>;
}
```

`type` -
`state` - Состояние шагов транзакции. Подробней [Distributed Transaction Steps State](./transaction-steps-state.md)
