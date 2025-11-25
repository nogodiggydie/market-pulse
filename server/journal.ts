import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { tags, positionTags, positions, InsertTag, InsertPositionTag } from "../drizzle/schema";

/**
 * Get all tags for a user
 */
export async function getUserTags(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tags).where(eq(tags.userId, userId));
}

/**
 * Create a new tag
 */
export async function createTag(data: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(tags).values(data);
  
  // Get the created tag
  const created = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, data.userId), eq(tags.name, data.name)))
    .limit(1);

  return created[0];
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First delete all position_tags references
  await db.delete(positionTags).where(eq(positionTags.tagId, tagId));

  // Then delete the tag (only if it belongs to the user)
  await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.userId, userId)));

  return { success: true };
}

/**
 * Add a tag to a position
 */
export async function addTagToPosition(positionId: number, tagId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify position belongs to user
  const position = await db
    .select()
    .from(positions)
    .where(and(eq(positions.id, positionId), eq(positions.userId, userId)))
    .limit(1);

  if (position.length === 0) {
    throw new Error("Position not found or access denied");
  }

  // Verify tag belongs to user
  const tag = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (tag.length === 0) {
    throw new Error("Tag not found or access denied");
  }

  // Check if tag is already added
  const existing = await db
    .select()
    .from(positionTags)
    .where(and(eq(positionTags.positionId, positionId), eq(positionTags.tagId, tagId)))
    .limit(1);

  if (existing.length > 0) {
    return { success: true, message: "Tag already added" };
  }

  // Add the tag
  await db.insert(positionTags).values({ positionId, tagId });

  return { success: true };
}

/**
 * Remove a tag from a position
 */
export async function removeTagFromPosition(positionId: number, tagId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify position belongs to user
  const position = await db
    .select()
    .from(positions)
    .where(and(eq(positions.id, positionId), eq(positions.userId, userId)))
    .limit(1);

  if (position.length === 0) {
    throw new Error("Position not found or access denied");
  }

  await db
    .delete(positionTags)
    .where(and(eq(positionTags.positionId, positionId), eq(positionTags.tagId, tagId)));

  return { success: true };
}

/**
 * Get tags for a specific position
 */
export async function getPositionTags(positionId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(positionTags)
    .innerJoin(tags, eq(positionTags.tagId, tags.id))
    .where(eq(positionTags.positionId, positionId));

  return result;
}

/**
 * Get performance analytics by tag
 */
export async function getTagAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
      totalTrades: sql<number>`COUNT(DISTINCT ${positions.id})`,
      closedTrades: sql<number>`SUM(CASE WHEN ${positions.status} = 'closed' THEN 1 ELSE 0 END)`,
      winningTrades: sql<number>`SUM(CASE WHEN ${positions.pnl} > 0 THEN 1 ELSE 0 END)`,
      totalPnL: sql<number>`SUM(COALESCE(${positions.pnl}, 0))`,
      avgPnL: sql<number>`AVG(COALESCE(${positions.pnl}, 0))`,
    })
    .from(tags)
    .leftJoin(positionTags, eq(tags.id, positionTags.tagId))
    .leftJoin(positions, eq(positionTags.positionId, positions.id))
    .where(eq(tags.userId, userId))
    .groupBy(tags.id, tags.name, tags.color);

  return result.map((row) => ({
    ...row,
    winRate: row.closedTrades > 0 ? (row.winningTrades / row.closedTrades) * 100 : 0,
  }));
}

/**
 * Get positions with their tags
 */
export async function getPositionsWithTags(userId: number, statusFilter?: "open" | "closed" | "expired") {
  const db = await getDb();
  if (!db) return [];

  // Build where clause
  const whereConditions = [eq(positions.userId, userId)];
  if (statusFilter) {
    whereConditions.push(eq(positions.status, statusFilter));
  }

  // Get positions
  const positionsResult = await db
    .select()
    .from(positions)
    .where(and(...whereConditions))
    .orderBy(sql`${positions.openedAt} DESC`);

  // Get tags for each position
  const positionsWithTags = await Promise.all(
    positionsResult.map(async (position) => {
      const positionTagsResult = await getPositionTags(position.id);
      return {
        ...position,
        tags: positionTagsResult,
      };
    })
  );

  return positionsWithTags;
}

/**
 * Get journal insights for a user
 */
export async function getJournalInsights(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const allPositions = await db.select().from(positions).where(eq(positions.userId, userId));

  const closedPositions = allPositions.filter((p) => p.status === "closed");
  const openPositions = allPositions.filter((p) => p.status === "open");

  const totalPnL = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const winningTrades = closedPositions.filter((p) => (p.pnl || 0) > 0).length;
  const losingTrades = closedPositions.filter((p) => (p.pnl || 0) < 0).length;
  const winRate = closedPositions.length > 0 ? (winningTrades / closedPositions.length) * 100 : 0;

  const avgWin = winningTrades > 0
    ? closedPositions.filter((p) => (p.pnl || 0) > 0).reduce((sum, p) => sum + (p.pnl || 0), 0) / winningTrades
    : 0;

  const avgLoss = losingTrades > 0
    ? Math.abs(closedPositions.filter((p) => (p.pnl || 0) < 0).reduce((sum, p) => sum + (p.pnl || 0), 0) / losingTrades)
    : 0;

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  return {
    totalTrades: allPositions.length,
    openTrades: openPositions.length,
    closedTrades: closedPositions.length,
    totalPnL,
    winningTrades,
    losingTrades,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
  };
}
