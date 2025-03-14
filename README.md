# pallass

Pallas’s Hub is an innovative web application designed to serve as a comprehensive platform for researchers and scholars to collaborate, share knowledge, and secure funding opportunities. It addresses the fragmented nature of current tools by offering integrated features tailored to the needs of the scientific community. 

Here is a [demo video](https://youtu.be/X_bikxs6rh8) of our web app, Pallas’s Hub.

## Development Set Up

### Prerequisites

- bash
- ssh client
- [goose](https://pressly.github.io/goose/installation/)
- [sqlc](https://docs.sqlc.dev/en/stable/overview/install.html)
- [Node.js](https://nodejs.org/en/) v20.17.0
- [Go](https://go.dev/) v1.22.4+
- (optional) [Air](https://github.com/air-verse/air)

### Database

#### To start the database server (ssh into AWS RDS)

```bash
chmod +x ./db.sh
./db.sh [PRIVATE_KEY_FILE] [RDS_ENDPOINT] [IP_ADDRESS]
```

Then, connect in your database client on localhost:5432 using the credentials.

#### Migrations (schema changes)

##### To create a new empty SQL migration file

```bash
goose -dir migrations create [MIGRATION_NAME] sql
```

In the 'up' portion of the file add the queries (usually DDL statements). Do not use the 'down' portion to undo changes in 'up' Instead, simply create another migration. This will ensure an easy trail of changes to the database (since we're always connecting directly to the production instance via SSH).

##### To apply new schema changes

```bash
goose -dir migrations postgres [SQL_CONNECTION_STRING] up
```

Check the output of goose to see if the migrations run successfully and adjust the queries if an error occurred.

See more information about goose usage in [its documentation](https://pressly.github.io/goose/documentation/annotations/).

#### Creating Database Queries

First, create/update the SQL queries inside `server/queries`. See [documentation](https://docs.sqlc.dev/en/latest/howto/select.html) on how to use [annotations](https://docs.sqlc.dev/en/latest/howto/named_parameters.html) to tell sqlc what code to generate.

Then, use sqlc to generate Go code based on those SQL queries:

```bash
cd server
sqlc generate
```

Make sure you commit all the code added/removed by sqlc and yourself in `server/queries` and `server/generated` directories.

### Client

#### To run react.js dev server

```bash
cd client
npm i
npm run dev
```

### Server

#### Set environment variables

```bash
export DB="<get the database connection string from a peer>"
export GMAL_USERNAME="<get the credential from a peer>"
export GMAIL_PASSWORD="[<get the credential from a peer>"
export JWT_SECRET_KEY="[<get the key from a peer>"
```

#### To run dev server

```bash
cd server
go run .
```

Alternatively, run live reload dev server using Air:

```bash
cd server
air
```

## Wireframes

Links to the wireframes:

- https://whimsical.com/pallas-s-hub-LnWKcsU2XitfD4pW3dvw4t

- https://whimsical.com/wireframes-DXojwAJLUYZzp9LyYJf1Zq
