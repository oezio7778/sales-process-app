-- Sales Process App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Deals table
CREATE TABLE deals (
  id BIGSERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  value NUMERIC,
  stage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings table
CREATE TABLE meetings (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES deals(id) ON DELETE CASCADE,
  company TEXT,
  date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER Framework sessions
CREATE TABLE order_sessions (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES deals(id) ON DELETE CASCADE,
  objectives TEXT,
  roadblocks TEXT,
  decision_criteria TEXT,
  economic_impact TEXT,
  requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stakeholders
CREATE TABLE stakeholders (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  role TEXT,
  influence TEXT,
  support TEXT,
  email TEXT,
  criteria TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROI Scenarios
CREATE TABLE roi_scenarios (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT,
  current_cost NUMERIC,
  solution_cost NUMERIC,
  time_savings NUMERIC,
  revenue_increase NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Offerings (global)
CREATE TABLE service_offerings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  default_cost NUMERIC,
  default_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SoW Templates (global)
CREATE TABLE sow_templates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated SoWs
CREATE TABLE sows (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES deals(id) ON DELETE CASCADE,
  company TEXT,
  meeting_id BIGINT,
  template_id BIGINT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes
CREATE TABLE quotes (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES deals(id) ON DELETE CASCADE,
  client TEXT,
  items JSONB,
  total NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows
CREATE TABLE workflows (
  id BIGSERIAL PRIMARY KEY,
  deal_id BIGINT REFERENCES deals(id) ON DELETE CASCADE,
  company TEXT,
  steps JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_meetings_deal_id ON meetings(deal_id);
CREATE INDEX idx_order_sessions_deal_id ON order_sessions(deal_id);
CREATE INDEX idx_stakeholders_deal_id ON stakeholders(deal_id);
CREATE INDEX idx_roi_scenarios_deal_id ON roi_scenarios(deal_id);
CREATE INDEX idx_sows_deal_id ON sows(deal_id);
CREATE INDEX idx_quotes_deal_id ON quotes(deal_id);
CREATE INDEX idx_workflows_deal_id ON workflows(deal_id);
