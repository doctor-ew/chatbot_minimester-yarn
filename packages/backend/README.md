# Rick & Morty Backend

A GraphQL server that fetches data from the Rick and Morty API and provides additional functionality.

## Features

- Fetch characters by name with caching.
- Fetch episodes by IDs.
- Determine associations between Ricks and Morties based on shared episodes.

## Setup

### Prerequisites

- Node.js
- Redis

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/doctor-ew/rick-morty-backend.git

### Install dependencies:
    npm install

### Start the server:
    npm start

### Testing
Run the tests using:

    npm test

## Booking Schema

- `bookingId` (String!): Unique identifier for the booking.
- `noOfAdults` (Int): Number of adults.
- `noOfChildren` (Int): Number of children.
- `noOfWeekendNights` (Int): Number of weekend nights.
- `noOfWeekNights` (Int): Number of week nights.
- `typeOfMealPlan` (String): Type of meal plan.
- `requiredCarParkingSpace` (Boolean): Whether a car parking space is required.
- `roomTypeReserved` (String): Type of room reserved.
- `leadTime` (Int): Lead time for the booking.
- `arrivalYear` (Int): Year of arrival.
- `arrivalMonth` (Int): Month of arrival.
- `arrivalDate` (Int): Date of arrival.
- `marketSegmentType` (String): Market segment type.
- `repeatedGuest` (Boolean): Whether the guest is a repeated guest.
- `noOfPreviousCancellations` (Int): Number of previous cancellations.
- `noOfPreviousBookingsNotCanceled` (Int): Number of previous bookings not canceled.
- `avgPricePerRoom` (Float): Average price per room.
- `noOfSpecialRequests` (Int): Number of special requests.
- `bookingStatus` (String): Booking status.


### API Endpoints
/graphql: The main GraphQL endpoint.

### Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

