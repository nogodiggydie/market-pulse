import { eq, and, desc } from "drizzle-orm";
import { positions, type InsertPosition } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get all positions for a user
 */
export async function getUserPositions(userId: number, status?: "open" | "closed" | "expired") {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    const results = await db
      .select()
      .from(positions)
      .where(and(eq(positions.userId, userId), eq(positions.status, status)))
      .orderBy(desc(positions.openedAt));
    return results;
  }

  const results = await db
    .select()
    .from(positions)
    .where(eq(positions.userId, userId))
    .orderBy(desc(positions.openedAt));
  return results;
}

/**
 * Get a single position by ID
 */
export async function getPositionById(positionId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(positions)
    .where(and(eq(positions.id, positionId), eq(positions.userId, userId)))
    .limit(1);

  return results[0] || null;
}

/**
 * Create a new position
 */
export async function createPosition(position: InsertPosition) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(positions).values(position);
  return result;
}

/**
 * Update a position
 */
export async function updatePosition(
  positionId: number,
  userId: number,
  updates: Partial<InsertPosition>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(positions)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(positions.id, positionId), eq(positions.userId, userId)));

  return result;
}

/**
 * Close a position
 */
export async function closePosition(
  positionId: number,
  userId: number,
  exitPrice: number,
  pnl: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(positions)
    .set({
      status: "closed",
      exitPrice,
      pnl,
      closedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(positions.id, positionId), eq(positions.userId, userId)));

  return result;
}

/**
 * Delete a position
 */
export async function deletePosition(positionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(positions)
    .where(and(eq(positions.id, positionId), eq(positions.userId, userId)));

  return result;
}

/**
 * Calculate total P&L for a user
 */
export async function calculateTotalPnL(userId: number) {
  const db = await getDb();
  if (!db) return { totalPnL: 0, openPositions: 0, closedPositions: 0 };

  const allPositions = await getUserPositions(userId);
  
  const totalPnL = allPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
  const openPositions = allPositions.filter(p => p.status === "open").length;
  const closedPositions = allPositions.filter(p => p.status === "closed").length;

  return { totalPnL, openPositions, closedPositions };
}
