import { getDb } from "./db";
import { campaigns, leads, emailEvents, sequences, sequenceEnrollments, norwegianCompanies } from "../drizzle/schema";
import { sql, and, gte, lte, eq, desc, count } from "drizzle-orm";

/**
 * Get campaign performance metrics over time
 */
export async function getCampaignPerformance(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all campaigns for user
  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  const campaignIds = userCampaigns.map((c) => c.id);

  if (campaignIds.length === 0) {
    return {
      overview: {
        totalCampaigns: 0,
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalReplied: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        avgReplyRate: 0,
      },
      timeline: [],
      topCampaigns: [],
    };
  }

  // Calculate overview metrics
  const overview = {
    totalCampaigns: userCampaigns.length,
    totalSent: userCampaigns.reduce((sum, c) => sum + (c.totalSent || 0), 0),
    totalOpened: userCampaigns.reduce((sum, c) => sum + (c.totalOpened || 0), 0),
    totalClicked: userCampaigns.reduce((sum, c) => sum + (c.totalClicked || 0), 0),
    totalReplied: userCampaigns.reduce((sum, c) => sum + (c.totalReplied || 0), 0),
    avgOpenRate: 0,
    avgClickRate: 0,
    avgReplyRate: 0,
  };

  if (overview.totalSent > 0) {
    overview.avgOpenRate = (overview.totalOpened / overview.totalSent) * 100;
    overview.avgClickRate = (overview.totalClicked / overview.totalSent) * 100;
    overview.avgReplyRate = (overview.totalReplied / overview.totalSent) * 100;
  }

  // Get timeline data (daily aggregates)
  const timeline = await db
    .select({
      date: sql<string>`DATE(${emailEvents.createdAt})`,
      opens: sql<number>`SUM(CASE WHEN ${emailEvents.eventType} = 'open' THEN 1 ELSE 0 END)`,
      clicks: sql<number>`SUM(CASE WHEN ${emailEvents.eventType} = 'click' THEN 1 ELSE 0 END)`,
      replies: sql<number>`SUM(CASE WHEN ${emailEvents.eventType} = 'reply' THEN 1 ELSE 0 END)`,
    })
    .from(emailEvents)
    .innerJoin(leads, eq(emailEvents.leadId, leads.id))
    .where(
      and(
        sql`${leads.campaignId} IN (${sql.join(campaignIds.map((id) => sql`${id}`), sql`, `)})`,
        gte(emailEvents.createdAt, startDate),
        lte(emailEvents.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${emailEvents.createdAt})`)
    .orderBy(sql`DATE(${emailEvents.createdAt})`);

  // Get top performing campaigns
  const topCampaigns = userCampaigns
    .map((campaign) => {
      const sent = campaign.totalSent || 0;
      const opened = campaign.totalOpened || 0;
      const clicked = campaign.totalClicked || 0;
      const replied = campaign.totalReplied || 0;

      return {
        id: campaign.id,
        name: campaign.name,
        sent,
        opened,
        clicked,
        replied,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        replyRate: sent > 0 ? (replied / sent) * 100 : 0,
      };
    })
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 10);

  return {
    overview,
    timeline,
    topCampaigns,
  };
}

/**
 * Get lead distribution analytics
 */
export async function getLeadAnalytics(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all leads for user
  const userLeads = await db
    .select({
      lead: leads,
      company: norwegianCompanies,
    })
    .from(leads)
    .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
    .where(eq(leads.userId, userId));

  // Status distribution
  const statusDistribution = userLeads.reduce((acc, { lead }) => {
    const status = lead.status || "pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Industry distribution (top 10)
  const industryDistribution = userLeads.reduce((acc, { company }) => {
    if (company?.naeringsbeskrivelse1) {
      const industry = company.naeringsbeskrivelse1;
      acc[industry] = (acc[industry] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topIndustries = Object.entries(industryDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([industry, count]) => ({ industry, count }));

  // Geographic distribution (Fylke)
  const geoDistribution = userLeads.reduce((acc, { company }) => {
    if (company?.fylke) {
      const fylke = company.fylke;
      acc[fylke] = (acc[fylke] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topLocations = Object.entries(geoDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([location, count]) => ({ location, count }));

  // Engagement metrics
  const engagementMetrics = {
    totalLeads: userLeads.length,
    contacted: userLeads.filter(({ lead }) => lead.status !== "pending").length,
    opened: userLeads.filter(({ lead }) => lead.emailOpenedAt !== null).length,
    clicked: userLeads.filter(({ lead }) => lead.emailClickedAt !== null).length,
    replied: userLeads.filter(({ lead }) => lead.emailRepliedAt !== null).length,
    unsubscribed: userLeads.filter(({ lead }) => lead.unsubscribed).length,
  };

  return {
    statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
      status,
      count,
    })),
    topIndustries,
    topLocations,
    engagementMetrics,
  };
}

/**
 * Get sequence analytics
 */
export async function getSequenceAnalytics(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all sequences for user
  const userSequences = await db
    .select()
    .from(sequences)
    .where(eq(sequences.userId, userId));

  if (userSequences.length === 0) {
    return {
      overview: {
        totalSequences: 0,
        totalEnrolled: 0,
        totalCompleted: 0,
        avgCompletionRate: 0,
      },
      sequencePerformance: [],
    };
  }

  const sequenceIds = userSequences.map((s) => s.id);

  // Get enrollments
  const enrollments = await db
    .select()
    .from(sequenceEnrollments)
    .where(
      sql`${sequenceEnrollments.sequenceId} IN (${sql.join(sequenceIds.map((id) => sql`${id}`), sql`, `)})`
    );

  const overview = {
    totalSequences: userSequences.length,
    totalEnrolled: enrollments.length,
    totalCompleted: enrollments.filter((e) => e.status === "completed").length,
    avgCompletionRate: 0,
  };

  if (overview.totalEnrolled > 0) {
    overview.avgCompletionRate = (overview.totalCompleted / overview.totalEnrolled) * 100;
  }

  // Sequence performance
  const sequencePerformance = userSequences.map((sequence) => {
    const seqEnrollments = enrollments.filter((e) => e.sequenceId === sequence.id);
    const completed = seqEnrollments.filter((e) => e.status === "completed").length;
    const active = seqEnrollments.filter((e) => e.status === "active").length;
    const paused = seqEnrollments.filter((e) => e.status === "paused").length;

    return {
      id: sequence.id,
      name: sequence.name,
      status: sequence.status,
      totalEnrolled: seqEnrollments.length,
      completed,
      active,
      paused,
      completionRate: seqEnrollments.length > 0 ? (completed / seqEnrollments.length) * 100 : 0,
    };
  });

  return {
    overview,
    sequencePerformance: sequencePerformance.sort((a, b) => b.completionRate - a.completionRate),
  };
}

/**
 * Get engagement heatmap (best send times)
 */
export async function getEngagementHeatmap(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all campaigns for user
  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  const campaignIds = userCampaigns.map((c) => c.id);

  if (campaignIds.length === 0) {
    return {
      hourly: [],
      daily: [],
    };
  }

  // Get hourly engagement (hour of day vs open rate)
  const hourlyData = await db
    .select({
      hour: sql<number>`HOUR(${emailEvents.createdAt})`,
      opens: sql<number>`SUM(CASE WHEN ${emailEvents.eventType} = 'open' THEN 1 ELSE 0 END)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(emailEvents)
    .innerJoin(leads, eq(emailEvents.leadId, leads.id))
    .where(
      sql`${leads.campaignId} IN (${sql.join(campaignIds.map((id) => sql`${id}`), sql`, `)})`
    )
    .groupBy(sql`HOUR(${emailEvents.createdAt})`);

  const hourly = hourlyData.map((row) => ({
    hour: row.hour,
    openRate: row.total > 0 ? (row.opens / row.total) * 100 : 0,
    total: row.total,
  }));

  // Get daily engagement (day of week vs open rate)
  const dailyData = await db
    .select({
      dayOfWeek: sql<number>`DAYOFWEEK(${emailEvents.createdAt})`,
      opens: sql<number>`SUM(CASE WHEN ${emailEvents.eventType} = 'open' THEN 1 ELSE 0 END)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(emailEvents)
    .innerJoin(leads, eq(emailEvents.leadId, leads.id))
    .where(
      sql`${leads.campaignId} IN (${sql.join(campaignIds.map((id) => sql`${id}`), sql`, `)})`
    )
    .groupBy(sql`DAYOFWEEK(${emailEvents.createdAt})`);

  const dayNames = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  const daily = dailyData.map((row) => ({
    day: dayNames[row.dayOfWeek - 1],
    dayOfWeek: row.dayOfWeek,
    openRate: row.total > 0 ? (row.opens / row.total) * 100 : 0,
    total: row.total,
  }));

  return {
    hourly: hourly.sort((a, b) => a.hour - b.hour),
    daily: daily.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
  };
}

/**
 * Get top performers (campaigns, templates, industries)
 */
export async function getTopPerformers(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all campaigns for user
  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.totalOpened))
    .limit(5);

  const topCampaigns = userCampaigns.map((campaign) => {
    const sent = campaign.totalSent || 0;
    const opened = campaign.totalOpened || 0;
    const clicked = campaign.totalClicked || 0;
    const replied = campaign.totalReplied || 0;

    return {
      id: campaign.id,
      name: campaign.name,
      sent,
      opened,
      clicked,
      replied,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
      replyRate: sent > 0 ? (replied / sent) * 100 : 0,
    };
  });

  // Get top performing industries (by reply rate)
  const userLeads = await db
    .select({
      lead: leads,
      company: norwegianCompanies,
    })
    .from(leads)
    .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
    .where(eq(leads.userId, userId));

  const industryPerformance = userLeads.reduce((acc, { lead, company }) => {
    if (company?.naeringsbeskrivelse1) {
      const industry = company.naeringsbeskrivelse1;
      if (!acc[industry]) {
        acc[industry] = { total: 0, replied: 0 };
      }
      acc[industry].total++;
      if (lead.emailRepliedAt) {
        acc[industry].replied++;
      }
    }
    return acc;
  }, {} as Record<string, { total: number; replied: number }>);

  const topIndustries = Object.entries(industryPerformance)
    .map(([industry, stats]) => ({
      industry,
      total: (stats as any).total,
      replied: (stats as any).replied,
      replyRate: (stats as any).total > 0 ? ((stats as any).replied / (stats as any).total) * 100 : 0,
    }))
    .filter((item) => item.total >= 5) // At least 5 leads
    .sort((a, b) => b.replyRate - a.replyRate)
    .slice(0, 5);

  return {
    topCampaigns,
    topIndustries,
  };
}
