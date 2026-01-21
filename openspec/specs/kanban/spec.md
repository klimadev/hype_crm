# kanban Specification

## Purpose
TBD - created by archiving change add-whatsapp-crm-features. Update Purpose after archive.
## Requirements
### Requirement: Kanban Board Display
The system SHALL display leads in a Kanban board organized by stages.

#### Scenario: Viewing Kanban board
- **WHEN** the user navigates to the Kanban page
- **THEN** the user SHALL see columns for each stage
- **AND** each column SHALL display leads assigned to that stage
- **AND** leads SHALL be displayed as cards within columns

#### Scenario: Stages without leads
- **WHEN** a stage exists but has no leads assigned
- **THEN** the stage column SHALL be displayed
- **AND** the column SHALL be empty
- **AND** the user SHALL still be able to add leads to this stage

### Requirement: Lead Movement
The system SHALL allow users to move leads between stages via drag-and-drop or actions.

#### Scenario: Moving lead to another stage via drag-and-drop
- **WHEN** the user drags the lead card to another stage column and drops it
- **THEN** the lead SHALL be reassigned to the new stage
- **AND** the stage entry event SHALL be triggered (if configured)
- **AND** the lead SHALL appear in the target column

#### Scenario: Moving lead via action menu
- **WHEN** the user clicks the action menu on the card and selects a different stage
- **THEN** the lead SHALL be reassigned to the selected stage
- **AND** the stage entry event SHALL be triggered (if configured)

### Requirement: Lead Card Content
The system SHALL display essential lead information on Kanban cards.

#### Scenario: Displaying lead card
- **WHEN** a lead is displayed in the Kanban board
- **THEN** the card SHALL show the lead's name
- **AND** the card SHALL show the lead's phone number
- **AND** the card SHALL show the associated product (if any)
- **AND** the card SHALL show time in current stage

### Requirement: WhatsApp Quick Action
The system SHALL provide a quick WhatsApp action on each Kanban card.

#### Scenario: Clicking WhatsApp button on card
- **WHEN** the user clicks the WhatsApp button on a lead card
- **THEN** a new browser tab SHALL open
- **AND** the tab SHALL navigate to `https://wa.me/{leadPhone}`
- **AND** the user SHALL be able to start a WhatsApp conversation

#### Scenario: Lead without phone number
- **WHEN** a lead exists without a phone number
- **THEN** the WhatsApp button SHALL be disabled or hidden
- **AND** clicking the area SHALL show a tooltip explaining missing phone

### Requirement: Stage Management
The system SHALL allow users to manage stages within the Kanban board.

#### Scenario: Adding a new stage
- **WHEN** the user adds a new stage with a name
- **THEN** the stage SHALL be created in the database
- **AND** a new column SHALL appear in the Kanban board
- **AND** the stage SHALL be positioned according to user selection

#### Scenario: Editing stage name
- **WHEN** the user modifies the stage name
- **THEN** the stage SHALL be updated
- **AND** the column header SHALL reflect the new name

#### Scenario: Deleting a stage
- **WHEN** the user deletes a stage with no leads assigned
- **THEN** the stage SHALL be removed from the database
- **AND** the column SHALL be removed from the Kanban board

#### Scenario: Cannot delete stage with leads
- **WHEN** the user attempts to delete a stage with leads assigned
- **THEN** the system SHALL prevent deletion
- **AND** show an error message about assigned leads

### Requirement: Kanban Responsiveness
The system SHALL provide a usable Kanban experience on different screen sizes.

#### Scenario: Viewing Kanban on desktop
- **WHEN** the user accesses the Kanban board from a desktop browser
- **THEN** all stage columns SHALL be visible horizontally
- **AND** the layout SHALL utilize available screen width

#### Scenario: Viewing Kanban on mobile
- **WHEN** the user accesses the Kanban board from a mobile device
- **THEN** stage columns SHALL stack vertically or be swipeable
- **AND** lead cards SHALL be touch-friendly

