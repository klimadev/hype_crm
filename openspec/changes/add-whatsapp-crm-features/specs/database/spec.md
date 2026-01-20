## ADDED Requirements

### Requirement: Database Schema
The system SHALL use SQLite3 with a well-defined schema for all CRM entities.

#### Scenario: Database initialization
- **WHEN** the application starts and the database file does not exist
- **THEN** the system SHALL create the database file
- **AND** all required tables SHALL be created
- **AND** default data SHALL be seeded

#### Scenario: Schema migration
- **WHEN** the application starts with an existing database and the schema version has changed
- **THEN** the system SHALL apply necessary migrations
- **AND** existing data SHALL be preserved

### Requirement: Products Table
The system SHALL store products and services in the products table.

#### Scenario: Inserting a product
- **WHEN** valid product data is provided
- **THEN** the product SHALL be saved with auto-incremented ID
- **AND** created_at and updated_at timestamps SHALL be set automatically

#### Scenario: Querying products
- **WHEN** products are queried
- **THEN** results SHALL be returned in type-safe format
- **AND** filtering by type (product/service) SHALL be supported

#### Scenario: Updating a product
- **WHEN** a product is updated
- **THEN** the updated_at timestamp SHALL be modified
- **AND** all modified fields SHALL be persisted

### Requirement: Leads Table
The system SHALL store leads with relationships to products and stages.

#### Scenario: Creating a lead
- **WHEN** valid lead data is provided
- **THEN** the lead SHALL be saved with all fields including product_id and stage_id
- **AND** default status SHALL be set to "new"

#### Scenario: Lead with phone number
- **WHEN** a lead is created with a phone number
- **THEN** the number SHALL be stored in a standardized format
- **AND** SHALL be retrievable for WhatsApp integration

#### Scenario: Querying leads by stage
- **WHEN** leads are queried by stage ID
- **THEN** only leads in that stage SHALL be returned
- **AND** leads SHALL be ordered by creation date

### Requirement: Stages Table
The system SHALL store Kanban stages with ordering support.

#### Scenario: Creating a stage
- **WHEN** stage data is provided
- **THEN** the stage SHALL be saved with position value
- **AND** stages SHALL be queryable ordered by position

#### Scenario: Reordering stages
- **WHEN** stage positions are updated
- **THEN** the new order SHALL be persisted
- **AND** the Kanban board SHALL reflect the new order

### Requirement: WhatsApp Events Table
The system SHALL store WhatsApp event configurations.

#### Scenario: Creating a WhatsApp event
- **WHEN** event configuration is provided
- **THEN** the event SHALL be saved with trigger_type, stage_id, timeout_minutes, and message_template
- **AND** the event SHALL be linked to a product

#### Scenario: Querying active events
- **WHEN** active events are queried by stage and trigger type
- **THEN** only active (is_active=1) events SHALL be returned

### Requirement: Lead Stage History Table
The system SHALL track lead stage transitions for timeout calculations.

#### Scenario: Recording stage entry
- **WHEN** a lead enters a new stage
- **THEN** a new entry SHALL be created with entered_at timestamp
- **AND** exited_at SHALL be NULL until the lead leaves the stage

#### Scenario: Recording stage exit
- **WHEN** a lead exits a stage
- **THEN** the existing entry SHALL have exited_at set to current timestamp
- **AND** a new entry SHALL be created for the new stage

#### Scenario: Querying stage duration
- **WHEN** stage duration is calculated for a lead
- **THEN** the system SHALL use entered_at timestamp
- **AND** current time minus entered_at SHALL indicate time in stage

### Requirement: Data Integrity
The system SHALL maintain data integrity through foreign keys and constraints.

#### Scenario: Deleting a product with leads
- **WHEN** a product with associated leads is deleted
- **THEN** associated leads SHALL have product_id set to NULL
- **AND** no data loss SHALL occur for lead information

#### Scenario: Deleting a stage with leads
- **WHEN** the user attempts to delete a stage with leads assigned
- **THEN** the operation SHALL be rejected
- **AND** an error SHALL indicate the stage has leads

#### Scenario: Cascading deletes
- **WHEN** a lead is deleted
- **THEN** associated stage history records SHALL be deleted

### Requirement: Performance
The system SHALL use better-sqlite3 for synchronous, high-performance database operations.

#### Scenario: Concurrent reads
- **WHEN** multiple users are reading data simultaneously
- **THEN** the system SHALL handle concurrent reads efficiently
- **AND** data SHALL be consistent

#### Scenario: Write operations
- **WHEN** a write operation is in progress and another write is attempted
- **THEN** better-sqlite3 SHALL serialize the operations
- **AND** data integrity SHALL be maintained
