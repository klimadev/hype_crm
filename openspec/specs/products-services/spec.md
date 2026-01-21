# products-services Specification

## Purpose
TBD - created by archiving change add-whatsapp-crm-features. Update Purpose after archive.
## Requirements
### Requirement: Product/Service CRUD Operations
The system SHALL allow users to create, read, update, and delete products and services.

#### Scenario: Creating a new product
- **WHEN** the user fills in the product name, description, price, and selects "product" type
- **THEN** the product SHALL be saved to the database
- **AND** the user SHALL see a success notification
- **AND** the product SHALL appear in the products list

#### Scenario: Creating a new service
- **WHEN** the user fills in the service name, description, price, and selects "service" type
- **THEN** the service SHALL be saved to the database
- **AND** the user SHALL see a success notification
- **AND** the service SHALL appear in the products list

#### Scenario: Editing an existing product
- **WHEN** the user modifies any product field and clicks "Save"
- **THEN** the product SHALL be updated in the database
- **AND** the updated data SHALL be reflected in the UI

#### Scenario: Deleting a product
- **WHEN** the user clicks the delete button and confirms
- **THEN** the product SHALL be removed from the database
- **AND** associated leads SHALL have their product_id set to NULL

### Requirement: Product Listing
The system SHALL display all products and services in a list format.

#### Scenario: Viewing products list
- **WHEN** the user navigates to the products page
- **THEN** the user SHALL see all products displayed in a table or grid
- **AND** each entry SHALL show name, type, price, and description
- **AND** each entry SHALL have edit and delete actions

#### Scenario: Filtering by type
- **WHEN** the user filters by type "product"
- **THEN** only products SHALL be displayed
- **AND** services SHALL be hidden

### Requirement: Product Details
The system SHALL allow users to view detailed information about a product or service.

#### Scenario: Viewing product details
- **WHEN** the user clicks on a product
- **THEN** the user SHALL see full product details
- **AND** the user SHALL see associated leads (if any)
- **AND** the user SHALL see configured WhatsApp events (if any)

### Requirement: Price Management
The system SHALL support decimal prices with up to 2 decimal places.

#### Scenario: Setting product price
- **WHEN** the user enters a price value
- **THEN** the system SHALL validate the price format
- **AND** store the price with up to 2 decimal precision
- **AND** display the price with proper currency formatting

