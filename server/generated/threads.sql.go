// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: threads.sql

package queries

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const getThreadAndMessagesByThreadIDAndFullnameByUserEmail = `-- name: GetThreadAndMessagesByThreadIDAndFullnameByUserEmail :many
SELECT 
    threads.id AS thread_id, 
    threads.firstname AS thread_firstname,
    threads.lastname AS thread_lastname, 
    threads.title AS thread_title, 
    threads.content AS thread_content, 
    threads.category AS thread_category,
    threads.upvotes AS thread_upvotes,
    threads.uuid AS thread_uuid,
    threads.created_at AS thread_created_at,
    messages.firstname AS message_firstname,
    messages.lastname AS message_lastname,
    messages.thread_id AS message_thread_id,
    messages.content AS message_content,
    messages.created_at AS message_created_at,
    (SELECT firstname || ' ' || lastname FROM users WHERE users.email = $2) AS user_fullname
FROM 
    threads
LEFT JOIN 
    messages ON threads.id = messages.thread_id
WHERE 
    threads.id = $1
ORDER BY 
    messages.created_at ASC
`

type GetThreadAndMessagesByThreadIDAndFullnameByUserEmailParams struct {
	ID    int32
	Email string
}

type GetThreadAndMessagesByThreadIDAndFullnameByUserEmailRow struct {
	ThreadID         int32
	ThreadFirstname  string
	ThreadLastname   string
	ThreadTitle      string
	ThreadContent    string
	ThreadCategory   string
	ThreadUpvotes    pgtype.Int4
	ThreadUuid       pgtype.UUID
	ThreadCreatedAt  pgtype.Timestamp
	MessageFirstname pgtype.Text
	MessageLastname  pgtype.Text
	MessageThreadID  pgtype.Int4
	MessageContent   pgtype.Text
	MessageCreatedAt pgtype.Timestamp
	UserFullname     interface{}
}

func (q *Queries) GetThreadAndMessagesByThreadIDAndFullnameByUserEmail(ctx context.Context, arg GetThreadAndMessagesByThreadIDAndFullnameByUserEmailParams) ([]GetThreadAndMessagesByThreadIDAndFullnameByUserEmailRow, error) {
	rows, err := q.db.Query(ctx, getThreadAndMessagesByThreadIDAndFullnameByUserEmail, arg.ID, arg.Email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetThreadAndMessagesByThreadIDAndFullnameByUserEmailRow
	for rows.Next() {
		var i GetThreadAndMessagesByThreadIDAndFullnameByUserEmailRow
		if err := rows.Scan(
			&i.ThreadID,
			&i.ThreadFirstname,
			&i.ThreadLastname,
			&i.ThreadTitle,
			&i.ThreadContent,
			&i.ThreadCategory,
			&i.ThreadUpvotes,
			&i.ThreadUuid,
			&i.ThreadCreatedAt,
			&i.MessageFirstname,
			&i.MessageLastname,
			&i.MessageThreadID,
			&i.MessageContent,
			&i.MessageCreatedAt,
			&i.UserFullname,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getThreads = `-- name: GetThreads :many
SELECT id, firstname, lastname, title, content, category, upvotes, uuid, created_at
FROM threads
ORDER BY created_at DESC
`

type GetThreadsRow struct {
	ID        int32
	Firstname string
	Lastname  string
	Title     string
	Content   string
	Category  string
	Upvotes   pgtype.Int4
	Uuid      pgtype.UUID
	CreatedAt pgtype.Timestamp
}

func (q *Queries) GetThreads(ctx context.Context) ([]GetThreadsRow, error) {
	rows, err := q.db.Query(ctx, getThreads)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetThreadsRow
	for rows.Next() {
		var i GetThreadsRow
		if err := rows.Scan(
			&i.ID,
			&i.Firstname,
			&i.Lastname,
			&i.Title,
			&i.Content,
			&i.Category,
			&i.Upvotes,
			&i.Uuid,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const insertThread = `-- name: InsertThread :one
INSERT INTO threads (firstname, lastname, title, content, category, upvotes, created_at)
VALUES ($1, $2, $3, $4, $5, 0, CURRENT_TIMESTAMP)
RETURNING id, uuid
`

type InsertThreadParams struct {
	Firstname string
	Lastname  string
	Title     string
	Content   string
	Category  string
}

type InsertThreadRow struct {
	ID   int32
	Uuid pgtype.UUID
}

func (q *Queries) InsertThread(ctx context.Context, arg InsertThreadParams) (InsertThreadRow, error) {
	row := q.db.QueryRow(ctx, insertThread,
		arg.Firstname,
		arg.Lastname,
		arg.Title,
		arg.Content,
		arg.Category,
	)
	var i InsertThreadRow
	err := row.Scan(&i.ID, &i.Uuid)
	return i, err
}
