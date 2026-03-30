const STAGE_INVENTORY_QUERIES = {
  // Fetch full stage-by-stage breakdown for a process + item + date
  GET_STAGE_TRACKING: `
        SELECT
            ps.id                               AS process_stage_id,
            ps.sequence_order,
            ps.stage_key,
            ps.stage_name,
            ps.is_external,
            p.id                                AS process_id,
            p.name                              AS process_name,
            b.name                              AS brand_name,
            i.id                                AS item_id,
            i.name                              AS item_name,
            i.item_code,
            COALESCE(si.total_input_qty,    0)  AS total_input_qty,
            COALESCE(si.total_produced_qty, 0)  AS total_produced_qty,
            COALESCE(si.available_qty,      0)  AS available_qty,
            si.updated_at
        FROM process_stages ps
        JOIN processes p ON p.id = ps.process_id
        JOIN items i     ON i.process_id = ps.process_id
        JOIN brands b    ON b.id = i.brand_id
        LEFT JOIN stage_inventory si
            ON  si.process_stage_id = ps.id
            AND si.item_id          = i.id
            AND si.entry_date       = ?
        WHERE ps.process_id = ?
          AND i.id          = ?
          AND ps.is_active  = 1
        ORDER BY ps.sequence_order
    `,

  // Available qty at a specific stage — shown on entry form
  GET_AVAILABLE_AT_STAGE: `
        SELECT
            ps.stage_name,
            ps.stage_key,
            i.name                              AS item_name,
            i.item_code,
            b.name                              AS brand_name,
            COALESCE(si.available_qty, 0)       AS available_qty
        FROM process_stages ps
        JOIN items i  ON i.id  = ?
        JOIN brands b ON b.id  = i.brand_id
        LEFT JOIN stage_inventory si
            ON  si.process_stage_id = ps.id
            AND si.item_id          = ?
        WHERE ps.id = ?
    `,

  // Summary across all stages for a process on a date
  GET_PROCESS_SUMMARY: `
        SELECT
            p.name                              AS process_name,
            SUM(si.total_input_qty)             AS total_input_units,
            SUM(si.total_produced_qty)          AS total_produced_units,
            SUM(si.available_qty)               AS total_available_units,
            COUNT(DISTINCT si.item_id)          AS total_items_in_progress
        FROM stage_inventory si
        JOIN process_stages ps ON ps.id = si.process_stage_id
        JOIN processes p       ON p.id  = ps.process_id
        WHERE ps.process_id = ?
          AND si.entry_date  = ?
          AND ps.is_active = 1
        GROUP BY p.id, p.name
    `,
};

module.exports = { STAGE_INVENTORY_QUERIES };
