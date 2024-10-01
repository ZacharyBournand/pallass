// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: user.sql

package queries

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const createUser = `-- name: CreateUser :exec
INSERT INTO users (firstname, lastname, email, password, organization, fieldOfStudy, jobTitle)
VALUES ($1, $2, $3, $4, $5, $6, $7)
`

type CreateUserParams struct {
	Firstname    string
	Lastname     string
	Email        string
	Password     string
	Organization pgtype.Text
	Fieldofstudy string
	Jobtitle     pgtype.Text
}

func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) error {
	_, err := q.db.Exec(ctx, createUser,
		arg.Firstname,
		arg.Lastname,
		arg.Email,
		arg.Password,
		arg.Organization,
		arg.Fieldofstudy,
		arg.Jobtitle,
	)
	return err
}

const getUserByEmail = `-- name: GetUserByEmail :one
SELECT id, firstname, lastname, email, password, organization, fieldOfStudy, jobTitle
FROM users
WHERE email = $1
`

type GetUserByEmailRow struct {
	ID           int32
	Firstname    string
	Lastname     string
	Email        string
	Password     string
	Organization pgtype.Text
	Fieldofstudy string
	Jobtitle     pgtype.Text
}

func (q *Queries) GetUserByEmail(ctx context.Context, email string) (GetUserByEmailRow, error) {
	row := q.db.QueryRow(ctx, getUserByEmail, email)
	var i GetUserByEmailRow
	err := row.Scan(
		&i.ID,
		&i.Firstname,
		&i.Lastname,
		&i.Email,
		&i.Password,
		&i.Organization,
		&i.Fieldofstudy,
		&i.Jobtitle,
	)
	return i, err
}

const insertUserSocialLink = `-- name: InsertUserSocialLink :exec
INSERT INTO user_social_links(user_email, social_link)
VALUES ($1, $2)
`

type InsertUserSocialLinkParams struct {
	UserEmail  string
	SocialLink string
}

func (q *Queries) InsertUserSocialLink(ctx context.Context, arg InsertUserSocialLinkParams) error {
	_, err := q.db.Exec(ctx, insertUserSocialLink, arg.UserEmail, arg.SocialLink)
	return err
}
