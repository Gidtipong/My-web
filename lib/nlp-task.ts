import { addDays, nextDay, setHours, setMinutes, startOfDay } from "date-fns";

export interface ParsedTask {
  raw: string;
  title: string;
  priority: "P1" | "P2" | "P3" | "P4";
  type: "TASK" | "INCIDENT" | "CHANGE" | "MAINTENANCE" | "AUDIT";
  dueDate: Date | null;
  dueDateLabel: string | null;
  detectedHostname: string | null;
  matchedDeviceId: string | null;
}

export function parseNaturalLanguageTask(
  text: string,
  knownDevices: Array<{ id: string; hostname: string }> = []
): ParsedTask {
  let working = text.trim();
  let priority: "P1" | "P2" | "P3" | "P4" = "P3";
  let type: "TASK" | "INCIDENT" | "CHANGE" | "MAINTENANCE" | "AUDIT" = "TASK";
  let dueDate: Date | null = null;
  let dueDateLabel: string | null = null;
  let detectedHostname: string | null = null;
  let matchedDeviceId: string | null = null;

  // 1. Extract Priority (P1, P2, P3, P4)
  const priorityMatch = working.match(/\b(P[1-4])\b/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toUpperCase() as "P1" | "P2" | "P3" | "P4";
    working = working.replace(priorityMatch[0], "").trim();
  }

  // 2. Extract Type
  const incidentMatch = working.match(/\b(incident|inc)\b/i);
  const changeMatch = working.match(/\b(change|chg)\b/i);
  const maintMatch = working.match(/\b(maintenance|maint)\b/i);
  const auditMatch = working.match(/\b(audit)\b/i);

  if (incidentMatch) {
    type = "INCIDENT";
    working = working.replace(incidentMatch[0], "").trim();
  } else if (changeMatch) {
    type = "CHANGE";
    working = working.replace(changeMatch[0], "").trim();
  } else if (maintMatch) {
    type = "MAINTENANCE";
    working = working.replace(maintMatch[0], "").trim();
  } else if (auditMatch) {
    type = "AUDIT";
    working = working.replace(auditMatch[0], "").trim();
  }

  // 3. Extract Due Date
  const now = new Date();
  if (/\b(today|tonight)\b/i.test(working)) {
    dueDate = setHours(setMinutes(now, 0), 18);
    dueDateLabel = "Today 18:00";
    working = working.replace(/\b(today|tonight)\b/i, "").trim();
  } else if (/\b(tomorrow|tmr)\b/i.test(working)) {
    dueDate = setHours(setMinutes(addDays(now, 1), 18), 0);
    dueDateLabel = "Tomorrow 18:00";
    working = working.replace(/\b(tomorrow|tmr)\b/i, "").trim();
  } else if (/\b(next week)\b/i.test(working)) {
    dueDate = setHours(setMinutes(addDays(now, 7), 18), 0);
    dueDateLabel = "Next Week";
    working = working.replace(/\b(next week)\b/i, "").trim();
  }

  // 4. Extract Device
  // Check against known devices first
  for (const dev of knownDevices) {
    const devRegex = new RegExp(`\\b${dev.hostname}\\b`, "i");
    if (devRegex.test(working)) {
      detectedHostname = dev.hostname;
      matchedDeviceId = dev.id;
      working = working.replace(devRegex, "").trim();
      break;
    }
  }

  // If no known device matched, check for common network hostname pattern (e.g. BKK-COR-SW01)
  if (!detectedHostname) {
    const hostRegex = /\b([A-Z0-9]{2,4}-[A-Z0-9]+-[A-Z0-9]+)\b/i;
    const hostMatch = working.match(hostRegex);
    if (hostMatch) {
      detectedHostname = hostMatch[1].toUpperCase();
      // Try to find if matches any known device
      const found = knownDevices.find(
        (d) => d.hostname.toLowerCase() === detectedHostname!.toLowerCase()
      );
      if (found) {
        matchedDeviceId = found.id;
        detectedHostname = found.hostname;
      }
      working = working.replace(hostMatch[0], "").trim();
    }
  }

  // Clean up remaining text as title
  const cleanTitle = working.replace(/\s+/g, " ").replace(/^[-:,./\s]+|[-:,./\s]+$/g, "").trim();

  return {
    raw: text,
    title: cleanTitle || text,
    priority,
    type,
    dueDate,
    dueDateLabel,
    detectedHostname,
    matchedDeviceId,
  };
}
