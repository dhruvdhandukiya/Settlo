/**
 * Pure Mathematical Engine for Receipt Item-Claiming & Pro-Rating
 * Implements Hare-Niemeyer (Largest-Remainder) method for zero penny rounding errors.
 */

/**
 * @typedef {Object} LineItem
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {number} [quantity]
 */

/**
 * @typedef {Object} CalculateSplitsParams
 * @property {LineItem[]} lineItems - Parsed or edited line items
 * @property {Record<string, Record<string, number>>} assignments - { [itemId]: { [userId]: weight/quantity } }
 * @property {Array<{ id: string, name: string }>} activeParticipants - Table members
 * @property {number} [tax=0] - Total tax amount (always proportional)
 * @property {number} [tip=0] - Total tip amount
 * @property {"equal" | "proportional"} [tipMode="equal"] - Tip distribution strategy (default: equal)
 * @property {number} [discount=0] - Total discount amount (deducted before net total)
 * @property {number} totalAmount - Scanned or entered receipt grand total
 * @property {string} [selectedPayerId] - User ID of who paid the bill
 */

/**
 * Calculate deterministic splits, unrounded shares, and penny-exact allocations.
 * @param {CalculateSplitsParams} params
 */
export function calculateReceiptSplits({
  lineItems = [],
  assignments = {},
  activeParticipants = [],
  tax = 0,
  tip = 0,
  tipMode = "equal",
  discount = 0,
  totalAmount = 0,
  selectedPayerId = null,
}) {
  const safeTax = Math.max(0, Number(tax) || 0);
  const safeTip = Math.max(0, Number(tip) || 0);
  const safeDiscount = Math.max(0, Number(discount) || 0);
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  const safeTipMode = tipMode === "proportional" ? "proportional" : "equal";

  // 1. Calculate items subtotal and count unassigned items
  let itemsSubtotal = 0;
  let unassignedItemsCount = 0;

  // Track subtotal contributed by each participant
  const subtotalsByParticipant = {};
  activeParticipants.forEach((p) => {
    subtotalsByParticipant[p.id] = 0;
  });

  lineItems.forEach((item) => {
    const itemPrice = Math.max(0, Number(item.price) || 0);
    itemsSubtotal += itemPrice;

    const itemAssignments = assignments[item.id] || {};
    // Calculate total claimed weight for this item
    let totalWeight = 0;
    Object.entries(itemAssignments).forEach(([userId, weight]) => {
      const numWeight = Math.max(0, Number(weight) || 0);
      if (numWeight > 0 && subtotalsByParticipant[userId] !== undefined) {
        totalWeight += numWeight;
      }
    });

    if (totalWeight <= 0) {
      unassignedItemsCount++;
    } else {
      // Allocate item cost to participants proportionally by weight
      Object.entries(itemAssignments).forEach(([userId, weight]) => {
        const numWeight = Math.max(0, Number(weight) || 0);
        if (numWeight > 0 && subtotalsByParticipant[userId] !== undefined) {
          const participantItemShare = itemPrice * (numWeight / totalWeight);
          subtotalsByParticipant[userId] += participantItemShare;
        }
      });
    }
  });

  itemsSubtotal = Math.round(itemsSubtotal * 100) / 100;
  const expectedTotal =
    Math.round(
      (itemsSubtotal + safeTax + safeTip - safeDiscount) * 100
    ) / 100;
  const discrepancy = Math.round((safeTotal - expectedTotal) * 100) / 100;

  // 2. Validation Checks
  const isTotalConsistent = Math.abs(discrepancy) <= 0.01;
  const hasItems = lineItems.length > 0;
  const hasParticipants = activeParticipants.length > 0;
  const allItemsAssigned = unassignedItemsCount === 0 && hasItems;

  let isValid = true;
  let error = null;

  if (!hasItems) {
    isValid = false;
    error = "NO_ITEMS";
  } else if (!hasParticipants) {
    isValid = false;
    error = "NO_PARTICIPANTS";
  } else if (!allItemsAssigned) {
    isValid = false;
    error = "UNASSIGNED_ITEMS";
  } else if (!isTotalConsistent) {
    isValid = false;
    error = "TOTAL_MISMATCH";
  } else if (itemsSubtotal <= 0) {
    isValid = false;
    error = "ZERO_SUBTOTAL";
  }

  // 3. Largest-Remainder (Hare-Niemeyer) Apportionment
  const participantTotals = {};
  const splits = [];

  if (isValid) {
    const targetTotalCents = Math.round(safeTotal * 100);

    // Identify participants who ordered at least one item
    const orderingParticipants = activeParticipants.filter(
      (p) => (subtotalsByParticipant[p.id] || 0) > 0
    );
    const eligibleTipCount =
      orderingParticipants.length > 0
        ? orderingParticipants.length
        : activeParticipants.length;

    const participantCalculations = activeParticipants.map((p) => {
      const pSubtotal = subtotalsByParticipant[p.id] || 0;
      const ratio = itemsSubtotal > 0 ? pSubtotal / itemsSubtotal : 0;
      
      // Tax is ALWAYS strictly proportional to food ordered
      const pTax = safeTax * ratio;
      const pDiscount = safeDiscount * ratio;

      // Tip branches based on user preference
      let pTip = 0;
      if (safeTipMode === "equal") {
        pTip =
          pSubtotal > 0 || orderingParticipants.length === 0
            ? safeTip / eligibleTipCount
            : 0;
      } else {
        pTip = safeTip * ratio;
      }

      const exactUnroundedShare = pSubtotal + pTax + pTip - pDiscount;

      const exactFloatCents = exactUnroundedShare * 100;
      const flooredCents = Math.floor(exactFloatCents);
      const remainder = exactFloatCents - flooredCents;

      return {
        userId: p.id,
        name: p.name,
        subtotal: pSubtotal,
        tax: pTax,
        tip: pTip,
        discount: pDiscount,
        exactShare: exactUnroundedShare,
        flooredCents,
        remainder,
        finalCents: flooredCents,
      };
    });

    // Sum of all floored cents
    const sumFlooredCents = participantCalculations.reduce(
      (sum, p) => sum + p.flooredCents,
      0
    );
    const remainingCentsToDistribute = targetTotalCents - sumFlooredCents;

    // Sort by largest remainder DESC, breaking ties deterministically by userId ASC
    const sortedIndices = participantCalculations
      .map((p, idx) => ({ idx, remainder: p.remainder, userId: p.userId }))
      .sort((a, b) => {
        if (b.remainder !== a.remainder) {
          return b.remainder - a.remainder;
        }
        return a.userId.localeCompare(b.userId);
      });

    // Distribute remaining cents to the top candidates
    for (
      let i = 0;
      i < remainingCentsToDistribute && i < sortedIndices.length;
      i++
    ) {
      const targetIndex = sortedIndices[i].idx;
      participantCalculations[targetIndex].finalCents += 1;
    }

    // Populate final structures
    participantCalculations.forEach((p) => {
      const finalAmount = Math.round(p.finalCents) / 100;
      participantTotals[p.userId] = {
        subtotal: Math.round(p.subtotal * 100) / 100,
        tax: Math.round(p.tax * 100) / 100,
        tip: Math.round(p.tip * 100) / 100,
        discount: Math.round(p.discount * 100) / 100,
        total: finalAmount,
      };

      splits.push({
        userId: p.userId,
        amount: finalAmount,
        paid: p.userId === selectedPayerId,
      });
    });
  } else {
    // If invalid, provide raw subtotals for UI display without finalized splits
    activeParticipants.forEach((p) => {
      const pSubtotal = subtotalsByParticipant[p.id] || 0;
      participantTotals[p.id] = {
        subtotal: Math.round(pSubtotal * 100) / 100,
        tax: 0,
        tip: 0,
        discount: 0,
        total: Math.round(pSubtotal * 100) / 100,
      };
    });
  }

  return {
    itemsSubtotal,
    expectedTotal,
    discrepancy,
    unassignedItemsCount,
    participantTotals,
    splits,
    isValid,
    error,
  };
}
