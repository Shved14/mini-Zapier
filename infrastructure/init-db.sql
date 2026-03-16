-- Create databases for each service
CREATE DATABASE minizapier_auth;
CREATE DATABASE minizapier_workflows;
CREATE DATABASE minizapier_executions;
CREATE DATABASE minizapier_triggers;
CREATE DATABASE minizapier_actions;
CREATE DATABASE minizapier_notifications;

-- Create users for each service (optional, for better isolation)
CREATE USER auth_user WITH PASSWORD 'auth_password';
CREATE USER workflow_user WITH PASSWORD 'workflow_password';
CREATE USER execution_user WITH PASSWORD 'execution_password';
CREATE USER trigger_user WITH PASSWORD 'trigger_password';
CREATE USER action_user WITH PASSWORD 'action_password';
CREATE USER notification_user WITH PASSWORD 'notification_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE minizapier_auth TO auth_user;
GRANT ALL PRIVILEGES ON DATABASE minizapier_workflows TO workflow_user;
GRANT ALL PRIVILEGES ON DATABASE minizapier_executions TO execution_user;
GRANT ALL PRIVILEGES ON DATABASE minizapier_triggers TO trigger_user;
GRANT ALL PRIVILEGES ON DATABASE minizapier_actions TO action_user;
GRANT ALL PRIVILEGES ON DATABASE minizapier_notifications TO notification_user;
