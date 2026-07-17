export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const initializationKeys = {
  all: ["initialization"] as const,
  status: () => [...initializationKeys.all, "status"] as const,
};
