# TicketBoss API: Event Ticketing System

This is a high-performance, concurrent-safe Node.js API for reserving event tickets, built for the Powerplay backend challenge.

The API handles real-time seat reservations with a "first-come, first-served" guarantee, ensuring that seats are never oversold, even under extreme concurrent load.

**GitHub Repository:** `[https://github.com/SahillRazaa/Ticket-Boss](https://github.com/SahillRazaa/Ticket-Boss)`

## Key Features

* **RESTful API:** A clean, 4-endpoint API for managing event reservations.
* **Concurrency Control:** Uses pessimistic row-locking (`SELECT ... FOR UPDATE`) within PostgreSQL transactions to serialize concurrent requests, guaranteeing data integrity and preventing race conditions.
* **Robust Error Handling:** Gracefully handles business logic errors (e.g., "Not enough seats") and server overload errors (e.g., "Connection pool timeout"), returning appropriate `409` and `503` status codes without crashing.
* **Production-Ready Structure:** Built with a scalable, production-grade project structure (controllers, routes, models, migrations, seeders) using `sequelize-cli`.
* **Input Validation:** Uses `Joi` to validate all incoming request bodies and parameters, providing clear `400 Bad Request` errors.

## API Documentation

### 1. Event Summary

Retrieves the current status of the event.

* **Endpoint:** `GET /api/reservations/`
* **Success Response (200 OK):**
    ```json
    {
      "eventId": "node-meetup-2025",
      "name": "Node.js Meet-up",
      "totalSeats": 500,
      "availableSeats": 490,
      "reservationCount": 10,
      "version": 10
    }
    ```

### 2. Reserve Seats

Reserves a number of seats for a partner.

* **Endpoint:** `POST /api/reservations/`
* **Request Body:**
    ```json
    {
      "partnerId": "abc-corp",
      "seats": 5
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
      "reservationId": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
      "seats": 5,
      "status": "confirmed"
    }
    ```
* **Error Responses:**
    * **400 Bad Request:** Invalid input (e.g., seats > 10, missing `partnerId`).
    * **409 Conflict:** Not enough seats left to fulfill the request.
    * **503 Service Unavailable:** Server is too busy; please try again.

### 3. Cancel Reservation

Cancels an existing reservation, returning its seats to the available pool.

* **Endpoint:** `DELETE /api/reservations/:reservationId`
* **Success Response (204 No Content):**
    * Returns an empty body, indicating the cancellation was successful.
* **Error Responses:**
    * **400 Bad Request:** `reservationId` is not a valid UUID.
    * **404 Not Found:** No "confirmed" reservation exists with this ID.

## Technical Decisions & Architecture

* **Stack:** Node.js, Express.js, PostgreSQL, Sequelize
* **Database:** PostgreSQL was chosen for its mature support for ACID-compliant transactions and row-level locking, which are essential for this concurrency problem.
* **Concurrency Strategy:** The core of the API is the `POST /api/reservations` endpoint. It solves the race condition by using a **pessimistic lock**.
    1.  A database transaction (`sequelize.transaction`) is started.
    2.  The `Event` row is fetched using `SELECT ... FOR UPDATE` (`lock: t.LOCK.UPDATE`). This forces any other concurrent transactions to *wait* in a queue.
    3.  Once the transaction has the lock, it safely checks if `availableSeats >= seatsToBook`.
    4.  If yes, it updates the `Event` table, creates the `Reservation` row, and commits.
    5.  If no, it throws an error, which triggers a `ROLLBACK` and returns a `409 Conflict`.
    This approach guarantees that requests are processed serially and data integrity is maintained 100% of the time.
* **Scalability:** The Sequelize connection pool was increased to handle high-volume load (`max: 100`). The controller catches `SequelizeConnectionAcquireTimeoutError` to prevent crashes under load and return a `503` status.

## Setup & Run Instructions

1.  **Clone the repository:**
    ```bash
    git clone [YOUR_REPO_URL]
    cd ticketboss-api
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** and set up your PostgreSQL database:
    ```.env
    DB_NAME=ticketboss
    DB_USER=postgres
    DB_PASSWORD=your_password
    DB_HOST=localhost
    DB_POOL_MAX=100
    ```
4.  **Create and seed the database:**
    ```bash
    npx sequelize-cli db:create
    npx sequelize-cli db:migrate
    npx sequelize-cli db:seed:all
    ```
5.  **Run the server:**
    ```bash
    npm run dev
    ```
    The API will be running at `http://localhost:8000`.

## Stress Test (k6)

To prove the API's robustness, a `k6` stress test was performed.

* **Script:** `stress_test.js`
* **Load:** 100 concurrent users (VUs) all trying to book 10 seats for 10 seconds.
* **Result:** The server **did not crash** (`0 interrupted iterations`) and correctly processed all 1,000 requests, returning a mix of `201 Created` (for successful bookings), `409 Conflict` (for "sold out" rejections), and `503 Service Unavailable` (for pool timeouts).
