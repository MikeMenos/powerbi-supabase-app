-- Dashboard schema helpers: introspect / add / drop columns on allowlisted tables only.

CREATE OR REPLACE FUNCTION public.dashboard_assert_table(p_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_table IS NULL OR p_table !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;

  IF p_table NOT IN (
    'powerbi_groups',
    'powerbi_datasets',
    'report_queries',
    'sales_snapshots',
    'workbooks',
    'workbook_pages'
  ) THEN
    RAISE EXCEPTION 'Table is not allowlisted for dashboard schema changes: %', p_table;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND table_type = 'BASE TABLE'
  ) THEN
    RAISE EXCEPTION 'Table does not exist: %', p_table;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_list_columns(p_table text)
RETURNS TABLE (
  column_name text,
  data_type text,
  udt_name text,
  is_nullable text,
  column_default text,
  ordinal_position integer,
  is_primary_key boolean,
  foreign_table text,
  foreign_column text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dashboard_assert_table(p_table);

  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.udt_name::text,
    c.is_nullable::text,
    c.column_default::text,
    c.ordinal_position::integer,
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = p_table
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = c.column_name
    ) AS is_primary_key,
    (
      SELECT ccu.table_name::text
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = p_table
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = c.column_name
      LIMIT 1
    ) AS foreign_table,
    (
      SELECT ccu.column_name::text
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = p_table
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = c.column_name
      LIMIT 1
    ) AS foreign_column
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table
  ORDER BY c.ordinal_position;
END;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_add_column(
  p_table text,
  p_column text,
  p_type text,
  p_nullable boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sql_type text;
  null_sql text;
BEGIN
  PERFORM public.dashboard_assert_table(p_table);

  IF p_column IS NULL OR p_column !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid column name';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
  ) THEN
    RAISE EXCEPTION 'Column already exists: %.%', p_table, p_column;
  END IF;

  sql_type := CASE p_type
    WHEN 'text' THEN 'text'
    WHEN 'longtext' THEN 'text'
    WHEN 'boolean' THEN 'boolean'
    WHEN 'number' THEN 'integer'
    WHEN 'date' THEN 'date'
    WHEN 'datetime' THEN 'timestamptz'
    WHEN 'uuid' THEN 'uuid'
    ELSE NULL
  END;

  IF sql_type IS NULL THEN
    RAISE EXCEPTION 'Unsupported column type: %', p_type;
  END IF;

  null_sql := CASE WHEN COALESCE(p_nullable, true) THEN '' ELSE ' NOT NULL' END;

  EXECUTE format(
    'ALTER TABLE public.%I ADD COLUMN %I %s%s',
    p_table,
    p_column,
    sql_type,
    null_sql
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_drop_column(
  p_table text,
  p_column text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dashboard_assert_table(p_table);

  IF p_column IS NULL OR p_column !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid column name';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
  ) THEN
    RAISE EXCEPTION 'Column does not exist: %.%', p_table, p_column;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = p_table
      AND tc.constraint_type = 'PRIMARY KEY'
      AND kcu.column_name = p_column
  ) THEN
    RAISE EXCEPTION 'Cannot drop primary key column: %', p_column;
  END IF;

  EXECUTE format(
    'ALTER TABLE public.%I DROP COLUMN %I',
    p_table,
    p_column
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dashboard_assert_table(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dashboard_list_columns(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dashboard_add_column(text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dashboard_drop_column(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.dashboard_list_columns(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.dashboard_add_column(text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.dashboard_drop_column(text, text) TO service_role;
