// Placeholder for a trigger implementation (e.g. polling, webhook, schedule, etc.)

export type TriggerPayload = {
  source: string;
  data: unknown;
};

export const exampleTrigger = async (): Promise<TriggerPayload[]> => {
  // Implement your trigger logic here (e.g. poll external API)
  return [
    {
      source: "example",
      data: { message: "trigger fired" },
    },
  ];
};

