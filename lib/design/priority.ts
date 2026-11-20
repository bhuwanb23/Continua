export type PriorityBand = "HIGH" | "MEDIUM" | "LOW";

export const priorityLabel = (band: PriorityBand): string => {
  switch (band) {
    case "HIGH":
      return "High review priority";
    case "MEDIUM":
      return "Medium review priority";
    case "LOW":
      return "Low review priority";
  }
};

export const priorityColor = (band: PriorityBand): string => {
  switch (band) {
    case "HIGH":
      return "#b45309";
    case "MEDIUM":
      return "#0f766e";
    case "LOW":
      return "#475569";
  }
};
