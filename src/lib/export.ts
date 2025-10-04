import { HealthEntry, Insight } from "./health"

export function exportCSV(entries: HealthEntry[]) {
  const headers = [
    "date",
    // stomach
    "stomach.severity",
    "stomach.painLocation",
    "stomach.bowelChanges",
    "stomach.triggers.dairy",
    "stomach.triggers.gluten",
    "stomach.triggers.spicy",
    "stomach.triggers.alcohol",
    "stomach.triggers.caffeine",
    "stomach.notes",
    // skin
    "skin.severity",
    "skin.area",
    "skin.rash",
    "skin.itch",
    "skin.triggers.cosmetics",
    "skin.triggers.detergent",
    "skin.triggers.weather",
    "skin.triggers.sweat",
    "skin.triggers.dietSugar",
    "skin.notes",
    // mental
    "mental.mood",
    "mental.anxiety",
    "mental.sleepHours",
    "mental.stressLevel",
    "mental.notes",
  ]

  const rows = entries.map((e) => [
    e.date,
    e.stomach?.severity ?? "",
    e.stomach?.painLocation ?? "",
    e.stomach?.bowelChanges ?? "",
    e.stomach?.triggers.dairy ?? "",
    e.stomach?.triggers.gluten ?? "",
    e.stomach?.triggers.spicy ?? "",
    e.stomach?.triggers.alcohol ?? "",
    e.stomach?.triggers.caffeine ?? "",
    escapeField(e.stomach?.notes ?? ""),

    e.skin?.severity ?? "",
    e.skin?.area ?? "",
    e.skin?.rash ?? "",
    e.skin?.itch ?? "",
    e.skin?.triggers.cosmetics ?? "",
    e.skin?.triggers.detergent ?? "",
    e.skin?.triggers.weather ?? "",
    e.skin?.triggers.sweat ?? "",
    e.skin?.triggers.dietSugar ?? "",
    escapeField(e.skin?.notes ?? ""),

    e.mental?.mood ?? "",
    e.mental?.anxiety ?? "",
    e.mental?.sleepHours ?? "",
    e.mental?.stressLevel ?? "",
    escapeField(e.mental?.notes ?? ""),
  ])

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `health-data-${new Date().toISOString().slice(0,10)}.csv`)
}

export async function exportPDF(entries: HealthEntry[], insights: Insight[]) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 14

  doc.setFontSize(16)
  doc.text("Health Report", pageWidth / 2, y, { align: "center" })
  y += 10

  doc.setFontSize(11)
  doc.text(`Generated: ${new Date().toLocaleString()}` , 14, y)
  y += 8

  // Insights
  doc.setFont(undefined, "bold")
  doc.text("Insights", 14, y)
  doc.setFont(undefined, "normal")
  y += 6

  if (insights.length === 0) {
    doc.text("No strong patterns detected yet. Keep logging!", 14, y)
    y += 8
  } else {
    for (const ins of insights.slice(0, 8)) {
      const line = `• [${ins.area}] ${ins.description} (score: ${ins.score.toFixed(2)})`
      const split = doc.splitTextToSize(line, pageWidth - 28)
      doc.text(split, 14, y)
      y += split.length * 6
      if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 14 }
    }
  }

  // Summary table (last 14 entries)
  const recent = [...entries].sort((a,b) => a.date.localeCompare(b.date)).slice(-14)
  const header = ["Date", "Stomach", "Skin", "Mood", "Anxiety", "Sleep"]
  const colX = [14, 40, 70, 100, 130, 160]

  doc.setFont(undefined, "bold"); y += 6
  doc.text("Recent Summary", 14, y); y += 4
  doc.setFont(undefined, "normal")

  doc.text(header[0], colX[0], y)
  doc.text(header[1], colX[1], y)
  doc.text(header[2], colX[2], y)
  doc.text(header[3], colX[3], y)
  doc.text(header[4], colX[4], y)
  doc.text(header[5], colX[5], y)
  y += 4
  doc.line(14, y, pageWidth - 14, y)
  y += 4

  for (const r of recent) {
    if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 14 }
    doc.text(r.date, colX[0], y)
    doc.text(String(r.stomach?.severity ?? "-"), colX[1], y)
    doc.text(String(r.skin?.severity ?? "-"), colX[2], y)
    doc.text(String(r.mental?.mood ?? "-"), colX[3], y)
    doc.text(String(r.mental?.anxiety ?? "-"), colX[4], y)
    doc.text(String(r.mental?.sleepHours ?? "-"), colX[5], y)
    y += 6
  }

  doc.save(`health-report-${new Date().toISOString().slice(0,10)}.pdf`)
}

function escapeField(v: string) {
  const needsQuote = /[",\n]/.test(v)
  return needsQuote ? `"${v.replace(/"/g, '""')}` + '"' : v
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}