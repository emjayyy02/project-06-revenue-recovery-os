// Only explicit development configuration permits business writes.
export const isDemoMode = import.meta.env.VITE_APP_MODE !== "development";
export const demoReadOnlyMessage = "Actions are disabled in the public demo.";

export function assertActionsEnabled() {
  if (isDemoMode) throw new Error(demoReadOnlyMessage);
}
