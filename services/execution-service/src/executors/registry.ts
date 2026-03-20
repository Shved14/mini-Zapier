import { BaseExecutor } from "./base.executor";
import { TriggerExecutor } from "./trigger.executor";
import { HttpExecutor } from "./http.executor";
import { TelegramExecutor } from "./telegram.executor";
import { EmailExecutor } from "./email.executor";
import { DatabaseExecutor } from "./database.executor";
import { TransformExecutor } from "./transform.executor";

const executors = new Map<string, BaseExecutor>();

function register(executor: BaseExecutor): void {
  executors.set(executor.type, executor);
}

register(new TriggerExecutor());
register(new HttpExecutor());
register(new TelegramExecutor());
register(new EmailExecutor());
register(new DatabaseExecutor());
register(new TransformExecutor());

export function getExecutor(type: string): BaseExecutor {
  const executor = executors.get(type);
  if (!executor) {
    throw new Error(`No executor registered for type: ${type}`);
  }
  return executor;
}

export function getRegisteredTypes(): string[] {
  return Array.from(executors.keys());
}
