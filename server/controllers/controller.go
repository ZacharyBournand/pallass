package controller

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	queries "sih/pallass/generated"
)

var e *echo.Echo
var dbc context.Context
var sql *queries.Queries

type Thread struct {
	Title     string `json:"title"`
	Content   string `json:"content"`
	Category  string `json:"category"`
	UserEmail string `json:"useremail"`
	Upvotes   int    `json:"upvotes"` // defaults to 0
}

type Message struct {
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	ThreadID  int32  `json:"thread_id"`
	Content   string `json:"content"`
}

type RegisterResponse struct {
	Message string `json:"message"`
}

type ErrorPayload struct {
	Error string `json:"error"`
}

type ThreadMessage struct {
	ID             string `json:"id"`
	Firstname      string `json:"firstname"`
	Lastname       string `json:"lastname"`
	ThreadID       string `json:"threadid"`
	Content        string `json:"content"`
	ReplyMessageID string `json:"replymessageid"`
}

type GroupMessage struct {
	ID             string `json:"id"`
	Firstname      string `json:"firstname"`
	Lastname       string `json:"lastname"`
	GroupID        string `json:"groupid"`
	Content        string `json:"content"`
	ReplyMessageID string `json:"replymessageid"`
}

type GroupMember struct {
	GroupID   string `json:"groupid"`
	UserEmail string `json:"useremail"`
	Role      string `json:"role"`
}

type JoinGroupRequest struct {
	GroupID   string `json:"groupid"`
	UserEmail string `json:"useremail"`
}

type User struct {
	ID           int32    `json:"id"`
	Firstname    string   `json:"firstName"`
	Lastname     string   `json:"lastName"`
	Email        string   `json:"email"`
	Password     string   `json:"password"`
	Organization string   `json:"organization"`
	Fieldofstudy string   `json:"fieldOfStudy"`
	Jobtitle     string   `json:"jobTitle"`
	SocialLinks  []string `json:"socialLinks"`
	TempCode     string   `json:"tempCode"`
	Token        string   `json:"token"`
}

type LogInUser struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type GetUserPayload struct {
	Email string `json:"email"`
	Token string `json:"token"`
}

type Group struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	Privacy       bool   `json:"privacy"`
	Notifications bool   `json:"notifications"`
}

type FundingOpportunity struct {
	Title        string `json:"title"`
	Description  string `json:"description"`
	TargetAmount string `json:"target_amount"`
	MinAmount string `json:"min_amount"`
	MaxAmount string `json:"max_amount"`
	Link         string `json:"link"`
	DeadlineDate string `json:"deadline_date"`
}

func SetGlobalContext(echoInstance *echo.Echo, queriesInstance *queries.Queries, dbContext context.Context) {
	e = echoInstance
	sql = queriesInstance
	dbc = dbContext
}

type PostPayload struct {
	UserID  int32  `json:"userId"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

// FlagController handles flag-related actions
func FlagController(c echo.Context) error {
	return c.String(http.StatusOK, "Flag added")
}

// PlaylistController handles playlist retrieval
func PlaylistController(c echo.Context) error {
	return c.String(http.StatusOK, "Here is the playlist")
}

// UpdateMessageController handles message updates
func UpdateMessageController(c echo.Context) error {
	return c.String(http.StatusOK, "Message updated")
}

func GetFundingOpportunities(c echo.Context) error {
	results, err := sql.GetAllFundingOpportunities(dbc)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorPayload{Error: err.Error()})
	}
	return c.JSON(http.StatusOK, results)
}

func GetPost(c echo.Context) error {
	postID, _ := strconv.Atoi(c.Param("postID"))
	fmt.Println("GetPost: ", postID)

	post, err := sql.GetPost(dbc, int32(postID))
	if err != nil {
		if err.Error() == "no rows in result set" {
			return c.JSON(http.StatusNotFound, "Post not found")
		}
		return c.JSON(http.StatusInternalServerError, "Error retrieving the post")
	}
	return c.JSON(http.StatusOK, post)
}

func GetUserPosts(c echo.Context) error {
	userID, _ := strconv.Atoi(c.Param("userID"))
	fmt.Println("GetUserPosts: ", userID)

	posts, err := sql.GetUserPosts(dbc, int32(userID))
	if err != nil {
		if err.Error() == "no rows in result set" {
			return c.JSON(http.StatusNotFound, "Post not found")
		}
		return c.JSON(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, posts)
}

func CreatePost(c echo.Context) error {
	var payload PostPayload
	if err := c.Bind(&payload); err != nil {
		e.Logger.Error("invalid body")
		return c.JSON(http.StatusBadRequest, ErrorPayload{Error: "could not parse body"})
	}
	params := queries.InsertPostParams{
		UserID:  payload.UserID,
		Title:   payload.Title,
		Content: payload.Content,
	}
	result, err := sql.InsertPost(dbc, params)
	if err != nil {
		e.Logger.Error(err)
		return c.JSON(http.StatusInternalServerError, ErrorPayload{Error: err.Error()})
	}
	return c.JSON(http.StatusCreated, result)
}
