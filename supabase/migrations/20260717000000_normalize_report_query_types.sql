update public.report_queries
set report_type = case upper(trim(report_type))
  when 'CY' then 'VCYTCY'
  when 'LY' then 'VLY'
  when 'TREND' then 'VTREND'
  else upper(trim(report_type))
end
where upper(trim(report_type)) in (
  'CY',
  'LY',
  'TREND',
  'VCYTCY',
  'VLY',
  'VTREND'
);
