import { actionRegistry } from "../actions/actionRegistry";

export const notificationService = {
  async telegram(text: string) {
    const executor = actionRegistry["telegram"];
    if (!executor) return;

    await executor(
      {
        text,
      },
      {}
    );
  },
};

