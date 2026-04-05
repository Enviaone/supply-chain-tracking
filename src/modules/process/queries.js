export const PROCESS_QUERIES = {
  GET_STAGES: `
        SELECT
            ps.id,
            ps.process_id,
            ps.stage_key,
            ps.stage_name,
            ps.sequence_order,
            ps.has_input_qty,
            ps.has_production_qty,
            ps.has_rejection_qty,
            ps.has_salvage_qty,
            ps.has_dispatch_qty,
            ps.has_fettling_option,
            ps.has_first_coat_option,
            ps.has_location_select,
            ps.has_outward_transfer,
            ps.has_inward_transfer,
            ps.has_next_step_select,
            ps.status
        FROM process_stages ps
        WHERE ps.process_id = ?
          AND ps.status     = 1
        ORDER BY ps.sequence_order
    `,

  GET_STAGE_TRANSITIONS: `
    SELECT
        pst.from_stage_id,
        pst.condition_value                     AS location_id,
        l.name                                  AS location_name,
        l.code                                  AS location_code,
        pst.priority
    FROM process_stage_transitions pst
    JOIN locations l
        ON l.id = CAST(pst.condition_value AS UNSIGNED)
    WHERE pst.process_id     = 1
    AND pst.condition_type = 'LOCATION'
    AND (pst.status = 1 OR pst.status IS NULL)  -- handle NULL status
    ORDER BY pst.from_stage_id, pst.priority;
  `,

  GET_RECURSIVE_FLOW: `
    WITH RECURSIVE stage_flow AS (
    SELECT
        pst.from_stage_id                   AS origin_stage_id,
        pst.condition_value                 AS location_id,
        pst.to_stage_id,
        1                                   AS level,
        pst.process_id
    FROM process_stage_transitions pst
    WHERE pst.process_id     = ?
      AND pst.condition_type = 'LOCATION'
      AND (pst.status = 1 OR pst.status IS NULL)

    UNION ALL

    SELECT
        sf.origin_stage_id,
        sf.location_id,
        pst.to_stage_id,
        sf.level + 1,
        pst.process_id
    FROM process_stage_transitions pst
    JOIN stage_flow sf
        ON  pst.from_stage_id = sf.to_stage_id
        AND pst.process_id    = sf.process_id  -- scope to same process via join
    WHERE pst.condition_type IS NULL
      AND (pst.status = 1 OR pst.status IS NULL)
      AND sf.level < 10
)
SELECT
    sf.origin_stage_id                      AS from_stage_id,
    sf.location_id,
    sf.level,
    ps.id                                   AS stage_id,
    ps.process_id, ps.stage_key, ps.stage_name,
    ps.sequence_order, ps.has_input_qty, ps.has_production_qty,
    ps.has_rejection_qty, ps.has_salvage_qty, ps.has_dispatch_qty,
    ps.has_fettling_option, ps.has_first_coat_option,
    ps.has_location_select, ps.has_outward_transfer,
    ps.has_inward_transfer, ps.has_next_step_select,
    ps.status                               AS stage_status
FROM stage_flow sf
JOIN process_stages ps ON ps.id = sf.to_stage_id
ORDER BY sf.origin_stage_id, sf.location_id, sf.level;
  `,

  GET_BRANCH_OPTIONS: `
    SELECT
        ps.id,
            ps.process_id,
            ps.stage_key,
            ps.stage_name,
            ps.sequence_order,
            ps.has_input_qty,
            ps.has_production_qty,
            ps.has_rejection_qty,
            ps.has_salvage_qty,
            ps.has_dispatch_qty,
            ps.has_fettling_option,
            ps.has_first_coat_option,
            ps.has_location_select,
            ps.has_outward_transfer,
            ps.has_inward_transfer,
            ps.has_next_step_select,
            ps.status
    FROM process_stage_transitions pst
    JOIN process_stages ps ON ps.id = pst.to_stage_id
    WHERE pst.from_stage_id  = ?
      AND pst.condition_type = 'STAGE'
      AND (pst.status = 1 OR pst.status IS NULL)
    ORDER BY pst.priority
  `,

  GET_LOCATION_FLOWS: `
        SELECT
            lsf.from_stage_id,
            l.id                    AS location_id,
            l.name                  AS location_name,
            l.code                  AS location_code,
            ps.id                   AS stage_id,
            ps.process_id,
            ps.stage_key,
            ps.stage_name,
            ps.sequence_order,
            ps.has_input_qty,
            ps.has_production_qty,
            ps.has_rejection_qty,
            ps.has_salvage_qty,
            ps.has_dispatch_qty,
            ps.has_fettling_option,
            ps.has_first_coat_option,
            ps.has_location_select,
            ps.has_outward_transfer,
            ps.has_inward_transfer,
            ps.has_next_step_select,
            ps.status
        FROM location_stage_flow lsf
        JOIN locations l        ON l.id  = lsf.location_id
        JOIN process_stages ps  ON ps.id = lsf.process_stage_id
        WHERE lsf.from_stage_id IN (
            SELECT id FROM process_stages
            WHERE process_id          = ?
              AND has_outward_transfer = 1
              AND status              = 1
        )
          AND lsf.is_active = 1
        ORDER BY lsf.from_stage_id, l.id, lsf.sequence_order
    `,
};
