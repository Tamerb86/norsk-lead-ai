import { getDb } from "./db";
import { campaigns, leads, emailEvents } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Update campaign statistics based on leads and email events
 */
export async function updateCampaignStats(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Aggregate stats from leads table
  const stats = await db
    .select({
      totalRecipients: sql<number>`COUNT(*)`,
      totalSent: sql<number>`SUM(CASE WHEN ${leads.status} != 'pending' THEN 1 ELSE 0 END)`,
      totalDelivered: sql<number>`SUM(CASE WHEN ${leads.emailDeliveredAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      totalOpened: sql<number>`SUM(CASE WHEN ${leads.emailOpenedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      totalClicked: sql<number>`SUM(CASE WHEN ${leads.emailClickedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      totalReplied: sql<number>`SUM(CASE WHEN ${leads.emailRepliedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      totalBounced: sql<number>`SUM(CASE WHEN ${leads.status} = 'bounced' THEN 1 ELSE 0 END)`,
      totalUnsubscribed: sql<number>`SUM(CASE WHEN ${leads.unsubscribed} = TRUE THEN 1 ELSE 0 END)`,
    })
    .from(leads)
    .where(eq(leads.campaignId, campaignId));

  const campaignStats = stats[0];

  // Update campaign with aggregated stats
  await db
    .update(campaigns)
    .set({
      totalRecipients: Number(campaignStats.totalRecipients) || 0,
      totalSent: Number(campaignStats.totalSent) || 0,
      totalDelivered: Number(campaignStats.totalDelivered) || 0,
      totalOpened: Number(campaignStats.totalOpened) || 0,
      totalClicked: Number(campaignStats.totalClicked) || 0,
      totalReplied: Number(campaignStats.totalReplied) || 0,
      totalBounced: Number(campaignStats.totalBounced) || 0,
      totalUnsubscribed: Number(campaignStats.totalUnsubscribed) || 0,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  return campaignStats;
}

/**
 * Get detailed campaign analytics
 */
export async function getCampaignAnalytics(campaignId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get campaign info
  const campaignResult = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  const campaign = campaignResult[0];
  if (!campaign) return null;

  // Get event breakdown
  const eventStats = await db
    .select({
      eventType: emailEvents.eventType,
      count: sql<number>`COUNT(*)`,
    })
    .from(emailEvents)
    .where(eq(emailEvents.campaignId, campaignId))
    .groupBy(emailEvents.eventType);

  // Get open rate over time (last 30 days)
  const openRateOverTime = await db
    .select({
      date: sql<string>`DATE(${emailEvents.createdAt})`,
      opens: sql<number>`COUNT(*)`,
    })
    .from(emailEvents)
    .where(
      and(
        eq(emailEvents.campaignId, campaignId),
        eq(emailEvents.eventType, "open")
      )
    )
    .groupBy(sql`DATE(${emailEvents.createdAt})`)
    .orderBy(sql`DATE(${emailEvents.createdAt})`);

  // Get click rate over time
  const clickRateOverTime = await db
    .select({
      date: sql<string>`DATE(${emailEvents.createdAt})`,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(emailEvents)
    .where(
      and(
        eq(emailEvents.campaignId, campaignId),
        eq(emailEvents.eventType, "click")
      )
    )
    .groupBy(sql`DATE(${emailEvents.createdAt})`)
    .orderBy(sql`DATE(${emailEvents.createdAt})`);

  // Get top clicked links
  const topClickedLinks = await db
    .select({
      linkUrl: emailEvents.linkUrl,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(emailEvents)
    .where(
      and(
        eq(emailEvents.campaignId, campaignId),
        eq(emailEvents.eventType, "click")
      )
    )
    .groupBy(emailEvents.linkUrl)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);

  return {
    campaign,
    eventStats,
    openRateOverTime,
    clickRateOverTime,
    topClickedLinks,
    // Calculate rates
    openRate: campaign.totalSent > 0 
      ? ((campaign.totalOpened / campaign.totalSent) * 100).toFixed(2) 
      : "0.00",
    clickRate: campaign.totalSent > 0 
      ? ((campaign.totalClicked / campaign.totalSent) * 100).toFixed(2) 
      : "0.00",
    replyRate: campaign.totalSent > 0 
      ? ((campaign.totalReplied / campaign.totalSent) * 100).toFixed(2) 
      : "0.00",
    bounceRate: campaign.totalSent > 0 
      ? ((campaign.totalBounced / campaign.totalSent) * 100).toFixed(2) 
      : "0.00",
    unsubscribeRate: campaign.totalSent > 0 
      ? ((campaign.totalUnsubscribed / campaign.totalSent) * 100).toFixed(2) 
      : "0.00",
  };
}

/**
 * Get dashboard stats (all campaigns)
 */
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all campaigns for user
  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  // Aggregate stats across all campaigns
  const totalStats = userCampaigns.reduce(
    (acc, campaign) => ({
      totalCampaigns: acc.totalCampaigns + 1,
      totalRecipients: acc.totalRecipients + campaign.totalRecipients,
      totalSent: acc.totalSent + campaign.totalSent,
      totalOpened: acc.totalOpened + campaign.totalOpened,
      totalClicked: acc.totalClicked + campaign.totalClicked,
      totalReplied: acc.totalReplied + campaign.totalReplied,
      totalBounced: acc.totalBounced + campaign.totalBounced,
      totalUnsubscribed: acc.totalUnsubscribed + campaign.totalUnsubscribed,
    }),
    {
      totalCampaigns: 0,
      totalRecipients: 0,
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalReplied: 0,
      totalBounced: 0,
      totalUnsubscribed: 0,
    }
  );

  // Calculate overall rates
  const openRate = totalStats.totalSent > 0 
    ? ((totalStats.totalOpened / totalStats.totalSent) * 100).toFixed(2) 
    : "0.00";
  const clickRate = totalStats.totalSent > 0 
    ? ((totalStats.totalClicked / totalStats.totalSent) * 100).toFixed(2) 
    : "0.00";
  const replyRate = totalStats.totalSent > 0 
    ? ((totalStats.totalReplied / totalStats.totalSent) * 100).toFixed(2) 
    : "0.00";

  return {
    ...totalStats,
    openRate,
    clickRate,
    replyRate,
  };
}
