-- =====================================================================
-- RLS for auction tables
-- =====================================================================

alter table properties enable row level security;
alter table lead_qualifications enable row level security;
alter table deals enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;

-- Properties
create policy "properties_org" on properties for all
  using (organization_id = current_org_id());

-- Lead qualifications
create policy "lead_qualifications_org" on lead_qualifications for all
  using (organization_id = current_org_id());

-- Deals
create policy "deals_org" on deals for all
  using (organization_id = current_org_id());

-- Activities
create policy "activities_org" on activities for all
  using (organization_id = current_org_id());

-- Tasks
create policy "tasks_org" on tasks for all
  using (organization_id = current_org_id());
