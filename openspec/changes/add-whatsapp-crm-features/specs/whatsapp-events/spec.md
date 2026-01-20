## ADDED Requirements

### Requirement: WhatsApp Event Creation
The system SHALL allow users to configure WhatsApp events for products/services.

#### Scenario: Creating a stage entry event
- **WHEN** the user creates a new WhatsApp event with trigger type "stage_entry"
- **AND** selects a target stage
- **AND** enters a message template
- **THEN** the event SHALL be saved to the database
- **AND** the event SHALL be linked to the product

#### Scenario: Creating a stage timeout event
- **WHEN** the user creates a new WhatsApp event with trigger type "stage_timeout"
- **AND** selects a target stage
- **AND** sets timeout duration in minutes
- **AND** enters a message template
- **THEN** the event SHALL be saved to the database
- **AND** the timeout SHALL be tracked for leads in that stage

### Requirement: Template Variable Support
The system SHALL support basic variables in message templates.

#### Scenario: Using lead name variable
- **WHEN** a WhatsApp event template contains `{{leadName}}`
- **AND** the event is triggered
- **THEN** `{{leadName}}` SHALL be replaced with the lead's actual name
- **AND** the message SHALL be sent with the resolved value

#### Scenario: Using lead phone variable
- **WHEN** a WhatsApp event template contains `{{leadPhone}}`
- **AND** the event is triggered
- **THEN** `{{leadPhone}}` SHALL be replaced with the lead's phone number
- **AND** the message SHALL be sent to that phone number

#### Scenario: Using product name variable
- **WHEN** a WhatsApp event template contains `{{productName}}`
- **AND** the event is triggered
- **THEN** `{{productName}}` SHALL be replaced with the product's name
- **AND** the message SHALL contain the resolved value

#### Scenario: Using stage name variable
- **WHEN** a WhatsApp event template contains `{{stageName}}`
- **AND** the event is triggered
- **THEN** `{{stageName}}` SHALL be replaced with the stage's name
- **AND** the message SHALL contain the resolved value

### Requirement: Event Activation
The system SHALL allow users to enable/disable WhatsApp events.

#### Scenario: Activating an event
- **WHEN** the user toggles an inactive event to active
- **THEN** the event SHALL process triggers immediately
- **AND** the event SHALL show as active in the UI

#### Scenario: Deactivating an event
- **WHEN** the user toggles an active event to inactive
- **THEN** the event SHALL stop processing triggers
- **AND** the event SHALL show as inactive in the UI
- **AND** no messages SHALL be sent for this event

### Requirement: Stage Entry Trigger
The system SHALL send WhatsApp messages when leads enter a configured stage.

#### Scenario: Triggering on stage entry
- **WHEN** a lead enters a stage with an active "stage_entry" event
- **THEN** the event SHALL be triggered
- **AND** a WhatsApp message SHALL be sent to the lead
- **AND** the message SHALL use the configured template with resolved variables

#### Scenario: No trigger for inactive event
- **WHEN** a lead enters a stage with an inactive "stage_entry" event
- **THEN** no message SHALL be sent for this event
- **AND** the event SHALL be skipped

### Requirement: Stage Timeout Trigger
The system SHALL send WhatsApp messages when leads stagnate in a stage.

#### Scenario: Triggering on stage timeout
- **WHEN** a lead has been in a stage for longer than the configured timeout
- **AND** an active "stage_timeout" event exists for that stage
- **THEN** the event SHALL be triggered
- **AND** a WhatsApp message SHALL be sent to the lead
- **AND** the message SHALL use the configured template with resolved variables

#### Scenario: No duplicate timeout triggers
- **WHEN** a timeout check runs for an event that has already triggered for a lead
- **THEN** no duplicate message SHALL be sent for the same lead and event
- **AND** the system SHALL track triggered events per lead

### Requirement: EvolutionAPI Integration
The system SHALL communicate with EvolutionAPI to send WhatsApp messages.

#### Scenario: Sending message via EvolutionAPI
- **WHEN** a WhatsApp event is triggered
- **AND** the EvolutionAPI service is running on localhost:8888
- **THEN** the system SHALL send a POST request to EvolutionAPI
- **AND** the request SHALL include the phone number and message
- **AND** the message SHALL be delivered via WhatsApp

#### Scenario: EvolutionAPI unavailable
- **WHEN** a WhatsApp event is triggered
- **AND** the EvolutionAPI service is not available
- **THEN** the system SHALL log the error
- **AND** no exception SHALL crash the application
