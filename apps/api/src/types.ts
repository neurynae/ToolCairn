import type { createAllHandlers } from '@toolpilot/tools';

/** Type alias for the handler map returned by createAllHandlers() */
export type ToolHandlers = ReturnType<typeof createAllHandlers>;
