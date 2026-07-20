update public.report_queries
set dax_query = replace(
  replace(
    replace(dax_query, 'YEAR(TODAY()) - 1', '{COMPARE_YEAR}'),
    'YEAR(TODAY())',
    '{CURRENT_YEAR}'
  ),
  '*areaName*',
  '{AREA}'
)
where dax_query like '%*areaName*%'
   or dax_query like '%YEAR(TODAY())%';
