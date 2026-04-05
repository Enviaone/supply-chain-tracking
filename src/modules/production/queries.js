const PRODUCTION_QUERIES = {
  // Fetch all entries — log page view
  // Grouped by date desc, filtered by stage/shift/date
  GET_ALL: `
        SELECT
            pe.id                       AS entry_id,
            pe.entry_date,
            pe.input_qty,
            pe.production_qty,
            pe.fettling_option,
            pe.first_coat_option,
            pe.next_step_selection,
            pe.transfer_type,
            pe.transfer_qty,
            pe.is_edited,
            pe.created_at,

            -- Stage
            ps.stage_key,
            ps.stage_name,
            ps.sequence_order,

            -- Process
            p.id                        AS process_id,
            p.name                      AS process_name,
            p.code                      AS process_code,

            -- Brand & Item
            b.id                        AS brand_id,
            b.name                      AS brand_name,
            i.id                        AS item_id,
            i.name                      AS item_name,
            i.item_code,

            -- Shift
            s.id                        AS shift_id,
            s.shift_name                      AS shift_name,

            -- Stage location (external stages)
            l.id                        AS location_id,
            l.name                      AS location_name,

            -- Transfer location
            tl.id                       AS transfer_location_id,
            tl.name                     AS transfer_location_name,

            -- Submitted by
            u.id                        AS submitted_by,
            u.name                      AS submitted_by_name

        FROM production_entries pe
        JOIN process_stages ps  ON ps.id = pe.process_stage_id
        JOIN processes p        ON p.id  = ps.process_id
        JOIN items i            ON i.id  = pe.item_id
        JOIN brands b           ON b.id  = pe.brand_id
        JOIN shifts s           ON s.id  = pe.shift_id
        JOIN users u            ON u.id  = pe.submitted_by
        LEFT JOIN locations l   ON l.id  = pe.location_id
        LEFT JOIN locations tl  ON tl.id = pe.transfer_location_id
        WHERE pe.status = 1
          AND (? IS NULL OR ps.process_stage_id = ?)
          AND (? IS NULL OR pe.shift_id         = ?)
          AND (? IS NULL OR pe.entry_date        = ?)
          AND (? IS NULL OR pe.entry_date       >= ?)
          AND (? IS NULL OR pe.entry_date       <= ?)
        ORDER BY pe.entry_date DESC, pe.created_at DESC
    `,

  // Fetch single entry by ID
  GET_BY_ID: `
        SELECT
            pe.id                       AS entry_id,
            pe.entry_date,
            pe.input_qty,
            pe.production_qty,
            pe.fettling_option,
            pe.first_coat_option,
            pe.next_step_selection,
            pe.transfer_type,
            pe.transfer_qty,
            pe.is_edited,
            pe.status,
            pe.created_at,
            pe.updated_at,

            ps.id                       AS process_stage_id,
            ps.stage_key,
            ps.stage_name,
            ps.sequence_order,
            ps.has_input_qty,
            ps.has_first_coat_option,
            ps.has_fettling_option,
            ps.has_outward_transfer,
            ps.has_inward_transfer,
            ps.has_location_select,
            ps.has_next_step_select,

            p.id                        AS process_id,
            p.name                      AS process_name,
            p.code                      AS process_code,

            b.id                        AS brand_id,
            b.name                      AS brand_name,
            i.id                        AS item_id,
            i.name                      AS item_name,
            i.item_code,

            s.id                        AS shift_id,
            s.shift_name                      AS shift_name,
            s.start_time,
            s.end_time,

            l.id                        AS location_id,
            l.name                      AS location_name,

            tl.id                       AS transfer_location_id,
            tl.name                     AS transfer_location_name,

            u.id                        AS submitted_by,
            u.name                      AS submitted_by_name

        FROM production_entries pe
        JOIN process_stages ps  ON ps.id = pe.process_stage_id
        JOIN processes p        ON p.id  = ps.process_id
        JOIN items i            ON i.id  = pe.item_id
        JOIN brands b           ON b.id  = pe.brand_id
        JOIN shifts s           ON s.id  = pe.shift_id
        JOIN users u            ON u.id  = pe.submitted_by
        LEFT JOIN locations l   ON l.id  = pe.location_id
        LEFT JOIN locations tl  ON tl.id = pe.transfer_location_id
        WHERE pe.id     = ?
          AND pe.status = 1
    `,

  // Insert new entry
  CREATE: `
        INSERT INTO production_entries (
            process_stage_id, item_id, brand_id, shift_id,
            location_id, submitted_by, entry_date,
            input_qty, production_qty, rejected_qty, solvage_qty,
            fettling_option, first_coat_option, next_step_selection,
            transfer_type, transfer_location_id, transfer_qty, source_stage_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,

  // Soft delete
  DELETE: `
        UPDATE production_entries
        SET status = 0, updated_at = NOW()
        WHERE id = ?
    `,

  // Log entry for audit trail
  INSERT_LOG: `
        INSERT INTO production_entry_logs (
            production_entry_id, changed_by,
            action, before_data, after_data, comment
        ) VALUES (?, ?, ?, ?, ?, ?)
    `,

  // Fetch audit log for an entry
  GET_LOGS: `
        SELECT
            pel.id,
            pel.action,
            pel.before_data,
            pel.after_data,
            pel.comment,
            pel.changed_at,
            u.id            AS changed_by_id,
            u.name          AS changed_by_name
        FROM production_entry_logs pel
        JOIN users u ON u.id = pel.changed_by
        WHERE pel.production_entry_id = ?
        ORDER BY pel.changed_at DESC
    `,

  GET_STATS: `
        SELECT
            -- Total input units across all entries
            SUM(pe.input_qty)                   AS total_input_units,

            -- Total production units across all entries
            SUM(pe.production_qty)              AS total_production_units,

            -- Unique brands that have entries
            COUNT(DISTINCT pe.brand_id)         AS total_brands,

            -- Bonus stats useful for dashboard
            COUNT(DISTINCT pe.id)               AS total_entries,
            COUNT(DISTINCT pe.item_id)          AS total_items,
            COUNT(DISTINCT ps.process_id)       AS total_processes,
            COUNT(DISTINCT pe.submitted_by)     AS total_operators,
            SUM(pe.transfer_qty)                AS total_transferred_units

        FROM production_entries pe
        JOIN process_stages ps ON ps.id = pe.process_stage_id

        WHERE pe.status = 1;
    `,

  GET_LOG_DETAILS: `
        SELECT
            -- Log identifiers
            pe.id                               AS entry_id,
            pe.entry_date                       AS submitted_date,
            pe.created_at                       AS submitted_at,
            pe.is_edited,

            -- Brand
            b.id                                AS brand_id,
            b.name                              AS brand_name,

            -- Item
            i.id                                AS item_id,
            i.name                              AS item_name,
            i.item_code,

            -- Shift
            s.id                                AS shift_id,
            s.shift_name                        AS shift_name,
            s.start_time,
            s.end_time,

            -- Stage
            ps.id                               AS process_stage_id,
            ps.stage_key,
            ps.stage_name,
            ps.sequence_order,

            -- Process
            p.id                                AS process_id,
            p.name                              AS process_name,
            p.code                              AS process_code,

            -- Quantities
            pe.input_qty,
            pe.production_qty,
            pe.rejected_qty,
            pe.solvage_qty,

            -- Conditional fields
            pe.fettling_option,
            pe.first_coat_option,
            pe.next_step_selection,

            -- Transfer info (if applicable)
            pe.transfer_type,
            pe.transfer_qty,
            tl.name                             AS transfer_location_name,

            -- Stage location (external stages)
            l.name                              AS location_name,

            -- Submitted by
            u.id                                AS submitted_by_id,
            u.name                              AS submitted_by_name,
            u.email                             AS submitted_by_email

        FROM production_entries pe
        JOIN brands b           ON b.id  = pe.brand_id
        JOIN items i            ON i.id  = pe.item_id
        JOIN shifts s           ON s.id  = pe.shift_id
        JOIN process_stages ps  ON ps.id = pe.process_stage_id
        JOIN processes p        ON p.id  = ps.process_id
        JOIN users u            ON u.id  = pe.submitted_by
        LEFT JOIN locations l   ON l.id  = pe.location_id
        LEFT JOIN locations tl  ON tl.id = pe.transfer_location_id

        WHERE pe.status = 1

        -- ── Optional filters (comment out what you don't need) ───────────────────────
        -- AND pe.entry_date           = '2026-03-25'         -- exact date
        -- AND pe.entry_date BETWEEN '2026-03-01' AND '2026-03-31'  -- date range
        -- AND pe.shift_id             = 1                    -- specific shift
        -- AND ps.id                   = 3                    -- specific stage
        -- AND pe.brand_id             = 1                    -- specific brand
        -- AND pe.submitted_by         = 4                    -- specific user

        ORDER BY
            pe.entry_date   DESC,
            pe.created_at   DESC,
            b.name          ASC,
            i.name          ASC;
    `,

  GET_PROCESS_ID_BY_STAGE: `
        SELECT process_id FROM process_stages WHERE id = ?
    `,

  GET_SOURCE_STAGE_ID: `
        SELECT from_stage_id FROM process_stage_transitions WHERE to_stage_id = ? AND process_id = ? AND status = 1
    `,
};

module.exports = { PRODUCTION_QUERIES };
