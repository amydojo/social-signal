-- Preserve source-reported interactions when one of the public per-post
-- component measures is not supplied, and distinguish Facebook album impressions.
-- Narrow schema extension: no new private fields or roles.
do $migration$
declare
  original text;
  replacement text;
begin
  select pg_get_functiondef(
    'public.publish_signal_week(date,timestamptz,text,date,jsonb,boolean)'::regprocedure
  ) into original;
  replacement:=replace(
    original,
    '''likes'',''comments'',''shares'',''saves'',''status'',''ctaChecked''',
    '''likes'',''comments'',''shares'',''saves'',''interactions'',''impressions'',''status'',''ctaChecked'''
  );
  if replacement=original then
    raise exception 'Publication field contract not found; migration refused';
  end if;
  execute replacement;
end
$migration$;
