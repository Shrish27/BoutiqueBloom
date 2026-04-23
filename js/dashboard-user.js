import { attachLogoutHandlers, requireRole } from "./auth.js";

const campaignPerformanceData = [
  { label: "Mon", reach: 18 },
  { label: "Tue", reach: 31 },
  { label: "Wed", reach: 27 },
  { label: "Thu", reach: 44 },
  { label: "Fri", reach: 52 },
  { label: "Sat", reach: 69 },
  { label: "Sun", reach: 63 },
];

function buildPoints(data, width, height, padding) {
  const values = data.map((item) => item.reach);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - padding.left - padding.right) / (data.length - 1 || 1);

  return data.map((item, index) => {
    const x = padding.left + step * index;
    const y = padding.top + (1 - (item.reach - min) / range) * (height - padding.top - padding.bottom);

    return { ...item, x, y };
  });
}

function renderCampaignPerformanceChart() {
  const chart = document.getElementById("campaign-performance-chart");
  const svg = chart?.querySelector(".campaign-chart__svg");

  if (!svg) return;

  const width = 720;
  const height = 260;
  const padding = {
    top: 22,
    right: 24,
    bottom: 38,
    left: 34,
  };
  const points = buildPoints(campaignPerformanceData, width, height, padding);
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  const gridLines = [0.25, 0.5, 0.75].map((ratio) => {
    const y = padding.top + ratio * (height - padding.top - padding.bottom);
    return `<line class="campaign-chart__grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />`;
  });
  const pointMarkers = points
    .map((point) => `<circle class="campaign-chart__point" cx="${point.x}" cy="${point.y}" r="6" />`)
    .join("");
  const labels = points
    .map((point) => `<text class="campaign-chart__label" x="${point.x}" y="${height - 10}" text-anchor="middle">${point.label}</text>`)
    .join("");

  svg.innerHTML = `
    ${gridLines.join("")}
    <path class="campaign-chart__area" d="${areaPath}" />
    <path class="campaign-chart__line" d="${linePath}" />
    ${pointMarkers}
    ${labels}
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  attachLogoutHandlers();
  const welcomeText = document.getElementById("welcome-user");

  const session = await requireRole("seller");
  if (!session) return;

  if (welcomeText) {
    const displayName =
      session.profile.full_name ||
      session.profile.email?.split("@")[0] ||
      "Seller";

    welcomeText.textContent = `Welcome Back, ${displayName}`;
  }

  renderCampaignPerformanceChart();
});
