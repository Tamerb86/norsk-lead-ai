import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Report types
export type ReportType = 'dashboard' | 'campaign' | 'leads' | 'analytics';

// Report data interfaces
export interface DashboardReportData {
  user: {
    name: string;
    email: string;
  };
  dateRange: string;
  stats: {
    companies: { total: number; withEmail: number; withPhone: number };
    campaigns: { total: number; active: number; completed: number };
    leads: { total: number; sent: number; opened: number; replied: number };
    performance: { openRate: string; replyRate: string; clickRate: string };
  };
  recentCampaigns: Array<{
    name: string;
    status: string;
    sent: number;
    opened: number;
    openRate: string;
  }>;
  topLeads: Array<{
    companyName: string;
    email: string;
    score: number;
    status: string;
  }>;
  industryData: Array<{ industry: string; count: number }>;
}

export interface CampaignReportData {
  campaign: {
    name: string;
    status: string;
    createdAt: string;
    subject: string;
  };
  stats: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    unsubscribed: number;
  };
  rates: {
    deliveryRate: string;
    openRate: string;
    clickRate: string;
    replyRate: string;
    bounceRate: string;
  };
  timeline: Array<{ date: string; sent: number; opened: number; replied: number }>;
}

// Colors
const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
};

// Helper function to format date
function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Helper function to format number
function formatNumber(num: number): string {
  return num.toLocaleString('nb-NO');
}

/**
 * Generate Dashboard PDF Report
 */
export async function generateDashboardReport(data: DashboardReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Header with gradient effect (simulated with rectangles)
  doc.setFillColor(99, 102, 241); // Indigo
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Logo placeholder
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 10, 12, 12, 2, 2, 'F');
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NL', margin + 2.5, 18);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('NorskLeads Rapport', margin + 18, 18);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dashboard Oversikt - ${data.dateRange}`, margin + 18, 26);

  // Date and user info
  doc.setFontSize(9);
  doc.text(`Generert: ${formatDate()}`, pageWidth - margin - 50, 18);
  doc.text(`Bruker: ${data.user.name}`, pageWidth - margin - 50, 24);

  y = 55;

  // Section: Overview Stats
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Oversikt', margin, y);
  y += 8;

  // Stats cards
  const cardWidth = (pageWidth - margin * 2 - 15) / 4;
  const cardHeight = 28;
  const cards = [
    { label: 'Bedrifter', value: formatNumber(data.stats.companies.total), color: '#3b82f6', sub: `${formatNumber(data.stats.companies.withEmail)} med e-post` },
    { label: 'Kampanjer', value: formatNumber(data.stats.campaigns.total), color: '#6366f1', sub: `${data.stats.campaigns.active} aktive` },
    { label: 'Leads', value: formatNumber(data.stats.leads.total), color: '#8b5cf6', sub: `${formatNumber(data.stats.leads.sent)} sendt` },
    { label: 'Åpningsrate', value: `${data.stats.performance.openRate}%`, color: '#ec4899', sub: `Svarrate: ${data.stats.performance.replyRate}%` },
  ];

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 5);
    
    // Card background
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');
    
    // Color accent
    const [r, g, b] = hexToRgb(card.color);
    doc.setFillColor(r, g, b);
    doc.roundedRect(x, y, 3, cardHeight, 1, 1, 'F');
    
    // Label
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + 8, y + 7);
    
    // Value
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 8, y + 16);
    
    // Sub text
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(card.sub, x + 8, y + 23);
  });

  y += cardHeight + 15;

  // Section: Recent Campaigns
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Nylige Kampanjer', margin, y);
  y += 8;

  // Table header
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Kampanje', margin + 3, y + 5.5);
  doc.text('Status', margin + 70, y + 5.5);
  doc.text('Sendt', margin + 100, y + 5.5);
  doc.text('Åpnet', margin + 125, y + 5.5);
  doc.text('Åpningsrate', margin + 150, y + 5.5);
  y += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  
  if (data.recentCampaigns.length === 0) {
    doc.setTextColor(156, 163, 175);
    doc.text('Ingen kampanjer ennå', margin + 3, y + 5);
    y += 10;
  } else {
    data.recentCampaigns.slice(0, 5).forEach((campaign, index) => {
      const rowY = y + index * 8;
      
      // Alternating row background
      if (index % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, rowY, pageWidth - margin * 2, 8, 'F');
      }
      
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(8);
      doc.text(campaign.name.substring(0, 30), margin + 3, rowY + 5.5);
      
      // Status badge
      const statusColors: Record<string, string> = {
        completed: '#10b981',
        sending: '#f59e0b',
        draft: '#6b7280',
        scheduled: '#3b82f6',
      };
      const statusColor = statusColors[campaign.status] || '#6b7280';
      const [sr, sg, sb] = hexToRgb(statusColor);
      doc.setTextColor(sr, sg, sb);
      doc.text(campaign.status, margin + 70, rowY + 5.5);
      
      doc.setTextColor(31, 41, 55);
      doc.text(formatNumber(campaign.sent), margin + 100, rowY + 5.5);
      doc.text(formatNumber(campaign.opened), margin + 125, rowY + 5.5);
      doc.text(`${campaign.openRate}%`, margin + 150, rowY + 5.5);
    });
    y += data.recentCampaigns.slice(0, 5).length * 8 + 5;
  }

  y += 10;

  // Section: Top Leads
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Topp Leads', margin, y);
  y += 8;

  // Table header
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Bedrift', margin + 3, y + 5.5);
  doc.text('E-post', margin + 60, y + 5.5);
  doc.text('Score', margin + 130, y + 5.5);
  doc.text('Status', margin + 155, y + 5.5);
  y += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  
  if (data.topLeads.length === 0) {
    doc.setTextColor(156, 163, 175);
    doc.text('Ingen leads ennå', margin + 3, y + 5);
    y += 10;
  } else {
    data.topLeads.slice(0, 5).forEach((lead, index) => {
      const rowY = y + index * 8;
      
      if (index % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, rowY, pageWidth - margin * 2, 8, 'F');
      }
      
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(8);
      doc.text(lead.companyName.substring(0, 25), margin + 3, rowY + 5.5);
      doc.setTextColor(107, 114, 128);
      doc.text(lead.email.substring(0, 30), margin + 60, rowY + 5.5);
      
      // Score with color
      doc.setTextColor(99, 102, 241);
      doc.setFont('helvetica', 'bold');
      doc.text(lead.score.toString(), margin + 130, rowY + 5.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.text(lead.status, margin + 155, rowY + 5.5);
    });
    y += data.topLeads.slice(0, 5).length * 8 + 5;
  }

  y += 10;

  // Section: Industry Distribution
  if (data.industryData.length > 0) {
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Leads per Bransje', margin, y);
    y += 8;

    const maxCount = Math.max(...data.industryData.map(d => d.count));
    const barMaxWidth = 100;

    data.industryData.slice(0, 6).forEach((item, index) => {
      const rowY = y + index * 10;
      
      // Industry name
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(item.industry.substring(0, 20), margin, rowY + 5);
      
      // Bar
      const barWidth = (item.count / maxCount) * barMaxWidth;
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(margin + 50, rowY + 1, barWidth, 5, 1, 1, 'F');
      
      // Count
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text(formatNumber(item.count), margin + 55 + barWidth, rowY + 5);
    });
  }

  // Footer
  doc.setFillColor(249, 250, 251);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('NorskLeads - B2B Lead Generation Platform', margin, pageHeight - 7);
  doc.text(`Side 1 av 1`, pageWidth - margin - 20, pageHeight - 7);

  // Save the PDF
  const fileName = `norskleads-rapport-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Generate Campaign PDF Report
 */
export async function generateCampaignReport(data: CampaignReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Kampanjerapport', margin, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.campaign.name, margin, 30);
  
  doc.setFontSize(9);
  doc.text(`Generert: ${formatDate()}`, pageWidth - margin - 40, 20);

  y = 55;

  // Campaign Info
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Kampanjeinformasjon', margin, y);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Status:', margin, y);
  doc.setTextColor(31, 41, 55);
  doc.text(data.campaign.status, margin + 30, y);
  y += 6;

  doc.setTextColor(107, 114, 128);
  doc.text('Opprettet:', margin, y);
  doc.setTextColor(31, 41, 55);
  doc.text(data.campaign.createdAt, margin + 30, y);
  y += 6;

  doc.setTextColor(107, 114, 128);
  doc.text('Emne:', margin, y);
  doc.setTextColor(31, 41, 55);
  doc.text(data.campaign.subject.substring(0, 60), margin + 30, y);
  y += 15;

  // Stats Grid
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Statistikk', margin, y);
  y += 10;

  const statsCards = [
    { label: 'Mottakere', value: formatNumber(data.stats.totalRecipients), color: '#3b82f6' },
    { label: 'Sendt', value: formatNumber(data.stats.sent), color: '#6366f1' },
    { label: 'Levert', value: formatNumber(data.stats.delivered), color: '#10b981' },
    { label: 'Åpnet', value: formatNumber(data.stats.opened), color: '#8b5cf6' },
    { label: 'Klikket', value: formatNumber(data.stats.clicked), color: '#f59e0b' },
    { label: 'Besvart', value: formatNumber(data.stats.replied), color: '#ec4899' },
  ];

  const cardWidth = (pageWidth - margin * 2 - 10) / 3;
  const cardHeight = 22;

  statsCards.forEach((card, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = margin + col * (cardWidth + 5);
    const cardY = y + row * (cardHeight + 5);

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'F');

    const [r, g, b] = hexToRgb(card.color);
    doc.setFillColor(r, g, b);
    doc.roundedRect(x, cardY, 3, cardHeight, 1, 1, 'F');

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + 8, cardY + 8);

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 8, cardY + 17);
  });

  y += (Math.ceil(statsCards.length / 3)) * (cardHeight + 5) + 15;

  // Rates
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Konverteringsrater', margin, y);
  y += 10;

  const rates = [
    { label: 'Leveringsrate', value: data.rates.deliveryRate },
    { label: 'Åpningsrate', value: data.rates.openRate },
    { label: 'Klikkrate', value: data.rates.clickRate },
    { label: 'Svarrate', value: data.rates.replyRate },
    { label: 'Avvisningsrate', value: data.rates.bounceRate },
  ];

  rates.forEach((rate, index) => {
    const rowY = y + index * 12;
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(rate.label, margin, rowY + 5);

    // Progress bar background
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin + 45, rowY + 1, 80, 6, 1, 1, 'F');

    // Progress bar fill
    const percentage = parseFloat(rate.value) || 0;
    const fillWidth = (percentage / 100) * 80;
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(margin + 45, rowY + 1, fillWidth, 6, 1, 1, 'F');

    // Percentage text
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(`${rate.value}%`, margin + 130, rowY + 5);
  });

  // Footer
  doc.setFillColor(249, 250, 251);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('NorskLeads - Kampanjerapport', margin, pageHeight - 7);

  const fileName = `kampanje-${data.campaign.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Capture chart as image and add to PDF
 */
export async function captureChartToPDF(
  chartElement: HTMLElement,
  doc: jsPDF,
  x: number,
  y: number,
  width: number
): Promise<number> {
  const canvas = await html2canvas(chartElement, {
    scale: 2,
    backgroundColor: '#ffffff',
  });
  
  const imgData = canvas.toDataURL('image/png');
  const imgHeight = (canvas.height * width) / canvas.width;
  
  doc.addImage(imgData, 'PNG', x, y, width, imgHeight);
  
  return imgHeight;
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export default {
  generateDashboardReport,
  generateCampaignReport,
  captureChartToPDF,
};
