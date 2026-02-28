export function stripThousands(value) {
  return String(value ?? "").replace(/,/g, "");
}

export function formatThousandsInput(value) {
  const raw = stripThousands(value);
  if (raw === "") return "";

  const hasDot = raw.includes(".");
  const [intPart, decPart = ""] = raw.split(".");
  const intFormatted = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return hasDot ? `${intFormatted}.${decPart}` : intFormatted;
}

export function isValidWeightInput(value) {
  return /^\d*\.?\d{0,2}$/.test(value);
}

export function formatWeight(value, fallback = "") {
  if (value == null || value === "") return fallback;

  const parsed = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(parsed)) return String(value);

  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
