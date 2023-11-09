-- Your SQL goes here
CREATE TABLE IF NOT EXISTS organization_details (
  id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) NOT NULL,
  user_pool_id VARCHAR(255),
  user_pool_client_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL,
  title VARCHAR(255),
  manager_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (organization_id, id)
);

CREATE TABLE IF NOT EXISTS project_reviews (
  id VARCHAR(255),
  organization_id VARCHAR(255),
  submitted_by VARCHAR(255) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  project_description VARCHAR(1024) NOT NULL,
  project_size INT NOT NULL,
  status VARCHAR(255) NOT NULL,
  schema_id VARCHAR(255) NOT NULL,
  responses json NOT NULL,
  original_review_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP,
  PRIMARY KEY (organization_id, id)
);

CREATE TABLE IF NOT EXISTS project_review_scores (
  organization_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  employee_review_id VARCHAR(255) NOT NULL,
  manager_review_id VARCHAR(255) NOT NULL,
  score FLOAT NOT NULL,
  project_size INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, employee_review_id, manager_review_id)
);

CREATE TABLE IF NOT EXISTS organization_goals (
  id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1024) NOT NULL,
  status INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id, organization_id)
);

CREATE TABLE IF NOT EXISTS compensation (
  user_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  base_pay INT NOT NULL,
  variable_pay INT,
  target_commissions INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS paybands (
  organization_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  high INT NOT NULL,
  mid INT NOT NULL,
  low INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY(organization_id, title)
);
  
CREATE TABLE IF NOT EXISTS employee_scores (
  organization_id VARCHAR(255) NOT NULL,
  employee_id VARCHAR(255) NOT NULL,
  score FLOAT NOT NULL,
  replaceability_score FLOAT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY(organization_id, employee_id)
);