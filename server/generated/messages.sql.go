// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: messages.sql

package queries

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const deleteThreadMessageAndRepliesByID = `-- name: DeleteThreadMessageAndRepliesByID :exec
WITH RECURSIVE deleted_replies AS (
  -- Base case -> get the direct replies
  SELECT id
  FROM messages
  WHERE message_id = $1
  
  -- Allow duplicate values that are in both the base and recursive cases
  UNION ALL
  
  -- Recursive case -> get the nested replies
  SELECT m.id
  FROM messages m
  INNER JOIN deleted_replies dr ON dr.id = m.message_id
)
DELETE FROM messages
WHERE messages.id IN (SELECT id FROM deleted_replies)
  OR messages.id = $1
`

func (q *Queries) DeleteThreadMessageAndRepliesByID(ctx context.Context, id int32) error {
	_, err := q.db.Exec(ctx, deleteThreadMessageAndRepliesByID, id)
	return err
}

const editThreadMessageByID = `-- name: EditThreadMessageByID :exec
UPDATE messages
SET content = $1
WHERE id = $2
`

type EditThreadMessageByIDParams struct {
	Content string
	ID      int32
}

func (q *Queries) EditThreadMessageByID(ctx context.Context, arg EditThreadMessageByIDParams) error {
	_, err := q.db.Exec(ctx, editThreadMessageByID, arg.Content, arg.ID)
	return err
}

const selectReplyingMessageByID = `-- name: SelectReplyingMessageByID :many
SELECT id, firstname, lastname, content, created_at
FROM messages
WHERE id = $1
`

type SelectReplyingMessageByIDRow struct {
	ID        int32
	Firstname string
	Lastname  string
	Content   string
	CreatedAt pgtype.Timestamp
}

func (q *Queries) SelectReplyingMessageByID(ctx context.Context, id int32) ([]SelectReplyingMessageByIDRow, error) {
	rows, err := q.db.Query(ctx, selectReplyingMessageByID, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []SelectReplyingMessageByIDRow
	for rows.Next() {
		var i SelectReplyingMessageByIDRow
		if err := rows.Scan(
			&i.ID,
			&i.Firstname,
			&i.Lastname,
			&i.Content,
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

const storeThreadMessage = `-- name: StoreThreadMessage :one
INSERT INTO messages (firstname, lastname, thread_id, content, message_id, reply)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, created_at
`

type StoreThreadMessageParams struct {
	Firstname string
	Lastname  string
	ThreadID  int32
	Content   string
	MessageID pgtype.Int4
	Reply     pgtype.Bool
}

type StoreThreadMessageRow struct {
	ID        int32
	CreatedAt pgtype.Timestamp
}

func (q *Queries) StoreThreadMessage(ctx context.Context, arg StoreThreadMessageParams) (StoreThreadMessageRow, error) {
	row := q.db.QueryRow(ctx, storeThreadMessage,
		arg.Firstname,
		arg.Lastname,
		arg.ThreadID,
		arg.Content,
		arg.MessageID,
		arg.Reply,
	)
	var i StoreThreadMessageRow
	err := row.Scan(&i.ID, &i.CreatedAt)
	return i, err
}
