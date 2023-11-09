CREATE DATABASE pago;
USE pago;

CREATE TABLE User (
  tenantId VARCHAR(255),
  sub VARCHAR(255),
  manager VARCHAR(255),
  PRIMARY KEY (tenantId, sub)
);

CREATE TABLE TenantDetails (
  tenantId VARCHAR(255),
  tenantName VARCHAR(255),
  PRIMARY KEY (tenantId, tenantName)
);

CREATE TABLE ProjectReviews (
  tenantId VARCHAR(255),
  id VARCHAR(255),
  submittedBy VARCHAR(255),
  PRIMARY KEY (tenantId, id)
);

CREATE TABLE ProjectReviewScores (
  tenantId VARCHAR(255),
  reviewId VARCHAR(255),
  sub VARCHAR(255),
  score INT,
  projectSize INT,
  PRIMARY KEY (tenantId, reviewId)
);

CREATE TABLE EmployeePerformanceScores (
  tenantId VARCHAR(255),
  sub VARCHAR(255),
  PRIMARY KEY (tenantId, sub)
);

CREATE TABLE CompData (
  tenantId VARCHAR(255),
  sub VARCHAR(255),
  PRIMARY KEY (tenantId, sub)
);

CREATE TABLE Goals (
  tenantId VARCHAR(255),
  id VARCHAR(255),
  PRIMARY KEY (tenantId, id)
);

CREATE TABLE Paybands (
  tenantId VARCHAR(255),
  title VARCHAR(255),
  PRIMARY KEY (tenantId, title)
);
