import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, BarChart3, Users, Mail, Loader2 } from 'lucide-react';
import { generateDashboardReport, generateCampaignReport, type DashboardReportData, type CampaignReportData } from '@/lib/pdfReportGenerator';
import { toast } from 'sonner';

interface ReportExportButtonProps {
  type: 'dashboard' | 'campaign' | 'leads' | 'analytics';
  data?: DashboardReportData | CampaignReportData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ReportExportButton({
  type,
  data,
  variant = 'outline',
  size = 'sm',
  className,
}: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!data) {
      toast.error('Ingen data tilgjengelig for eksport');
      return;
    }

    setIsExporting(true);

    try {
      if (format === 'pdf') {
        if (type === 'dashboard') {
          await generateDashboardReport(data as DashboardReportData);
          toast.success('PDF-rapport generert!');
        } else if (type === 'campaign') {
          await generateCampaignReport(data as CampaignReportData);
          toast.success('Kampanjerapport generert!');
        }
      } else if (format === 'csv') {
        // Generate CSV
        const csvContent = generateCSV(type, data);
        downloadCSV(csvContent, `${type}-rapport-${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('CSV-fil lastet ned!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kunne ikke generere rapport');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Eksporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Eksporter som</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2 text-red-500" />
          PDF-rapport
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
          <BarChart3 className="w-4 h-4 mr-2 text-green-500" />
          CSV-data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to generate CSV content
function generateCSV(type: string, data: any): string {
  let csvContent = '';

  if (type === 'dashboard') {
    const dashboardData = data as DashboardReportData;
    
    // Stats section
    csvContent += 'OVERSIKT\n';
    csvContent += 'Kategori,Verdi\n';
    csvContent += `Totalt bedrifter,${dashboardData.stats.companies.total}\n`;
    csvContent += `Bedrifter med e-post,${dashboardData.stats.companies.withEmail}\n`;
    csvContent += `Totalt kampanjer,${dashboardData.stats.campaigns.total}\n`;
    csvContent += `Aktive kampanjer,${dashboardData.stats.campaigns.active}\n`;
    csvContent += `Totalt leads,${dashboardData.stats.leads.total}\n`;
    csvContent += `Åpningsrate,${dashboardData.stats.performance.openRate}%\n`;
    csvContent += `Svarrate,${dashboardData.stats.performance.replyRate}%\n`;
    csvContent += '\n';

    // Recent campaigns
    csvContent += 'NYLIGE KAMPANJER\n';
    csvContent += 'Navn,Status,Sendt,Åpnet,Åpningsrate\n';
    dashboardData.recentCampaigns.forEach(campaign => {
      csvContent += `"${campaign.name}",${campaign.status},${campaign.sent},${campaign.opened},${campaign.openRate}%\n`;
    });
    csvContent += '\n';

    // Top leads
    csvContent += 'TOPP LEADS\n';
    csvContent += 'Bedrift,E-post,Score,Status\n';
    dashboardData.topLeads.forEach(lead => {
      csvContent += `"${lead.companyName}","${lead.email}",${lead.score},${lead.status}\n`;
    });
    csvContent += '\n';

    // Industry data
    csvContent += 'LEADS PER BRANSJE\n';
    csvContent += 'Bransje,Antall\n';
    dashboardData.industryData.forEach(item => {
      csvContent += `"${item.industry}",${item.count}\n`;
    });

  } else if (type === 'campaign') {
    const campaignData = data as CampaignReportData;
    
    csvContent += 'KAMPANJEINFORMASJON\n';
    csvContent += `Navn,"${campaignData.campaign.name}"\n`;
    csvContent += `Status,${campaignData.campaign.status}\n`;
    csvContent += `Opprettet,${campaignData.campaign.createdAt}\n`;
    csvContent += `Emne,"${campaignData.campaign.subject}"\n`;
    csvContent += '\n';

    csvContent += 'STATISTIKK\n';
    csvContent += 'Metrikk,Verdi\n';
    csvContent += `Mottakere,${campaignData.stats.totalRecipients}\n`;
    csvContent += `Sendt,${campaignData.stats.sent}\n`;
    csvContent += `Levert,${campaignData.stats.delivered}\n`;
    csvContent += `Åpnet,${campaignData.stats.opened}\n`;
    csvContent += `Klikket,${campaignData.stats.clicked}\n`;
    csvContent += `Besvart,${campaignData.stats.replied}\n`;
    csvContent += `Avvist,${campaignData.stats.bounced}\n`;
    csvContent += '\n';

    csvContent += 'KONVERTERINGSRATER\n';
    csvContent += 'Rate,Prosent\n';
    csvContent += `Leveringsrate,${campaignData.rates.deliveryRate}%\n`;
    csvContent += `Åpningsrate,${campaignData.rates.openRate}%\n`;
    csvContent += `Klikkrate,${campaignData.rates.clickRate}%\n`;
    csvContent += `Svarrate,${campaignData.rates.replyRate}%\n`;
  }

  return csvContent;
}

// Helper function to download CSV
function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default ReportExportButton;
