alter table public.sales_snapshots
  alter column react_calc_01 type numeric(18, 6)
    using react_calc_01::numeric(18, 6),
  alter column react_calc_03 type numeric(18, 6)
    using react_calc_03::numeric(18, 6),
  alter column react_calc_06 type numeric(18, 6)
    using react_calc_06::numeric(18, 6);
