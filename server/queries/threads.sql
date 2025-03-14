-- name: InsertThread :one
INSERT INTO threads (title, content, category, user_email, created_at)
VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
RETURNING id, uuid;

-- name: InsertThreadWithGrant :one
INSERT INTO threads (title, content, category, user_email, created_at, funding_opportunity_id)
VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
RETURNING id, uuid;

-- name: GetUpvotedThreadsByUserEmail :many
SELECT *
FROM threads
JOIN thread_upvotes ON threads.id = thread_upvotes.thread_id
WHERE thread_upvotes.user_email = $1
ORDER BY thread_upvotes.created_at DESC;

-- name: GetThreadsSortedByMostUpvotes :many
SELECT
    threads.*,
    COUNT(thread_upvotes.id) AS upvote_count
FROM 
    threads
LEFT JOIN
    thread_upvotes ON threads.id = thread_upvotes.thread_id
GROUP BY
    threads.id
ORDER BY 
    upvote_count DESC;

-- name: GetThreadsSortedByLeastUpvotes :many
SELECT
    threads.*,
    COUNT(thread_upvotes.id) AS upvote_count
FROM 
    threads
LEFT JOIN
    thread_upvotes ON threads.id = thread_upvotes.thread_id
GROUP BY
    threads.id
ORDER BY 
    upvote_count ASC;

-- name: GetThreadAndMessagesByThreadIDAndFullnameByUserEmail :many
SELECT 
    threads.id AS thread_id, 
    threads.title AS thread_title, 
    threads.content AS thread_content, 
    threads.category AS thread_category,
    threads.uuid AS thread_uuid,
    threads.created_at AS thread_created_at,
    threads.user_email AS thread_user_email,
    -- Messages in the thread
    messages.id AS message_id,
    messages.firstname AS message_firstname,
    messages.lastname AS message_lastname,
    messages.thread_id AS message_thread_id,
    messages.content AS message_content,
    messages.created_at AS message_created_at,
    (SELECT firstname || ' ' || lastname FROM users WHERE users.email = $2) AS user_fullname,
    -- Messages being replied to
    replying_message.id AS reply_id,
    replying_message.firstname AS reply_firstname,
    replying_message.lastname AS reply_lastname,
    replying_message.content AS reply_content,
    replying_message.created_at AS reply_created_at,
    -- The grant associated with the thread
    funding_opportunities.title AS funding_opportunity_title,
    -- Count of the thread's upvotes
    COUNT(thread_upvotes.id) AS upvote_count,
    array_agg(thread_upvotes.user_email) AS upvote_emails
FROM 
    threads
LEFT JOIN 
    messages ON threads.id = messages.thread_id
LEFT JOIN
    messages AS replying_message ON messages.message_id = replying_message.id
LEFT JOIN
    thread_upvotes ON threads.id = thread_upvotes.thread_id
LEFT JOIN
    funding_opportunities ON threads.funding_opportunity_id = funding_opportunities.id
WHERE 
    threads.id = $1
GROUP BY 
    threads.id, messages.id, replying_message.id, funding_opportunities.id
ORDER BY 
    messages.created_at ASC;

-- name: InsertThreadUpvote :exec
INSERT INTO thread_upvotes (thread_id, user_email, created_at)
VALUES ($1, $2, CURRENT_TIMESTAMP);

-- name: GetThreadUpvotesCount :one
SELECT COUNT(*)
FROM thread_upvotes
WHERE thread_id = $1;

-- name: GetThreadsByCategory :many
SELECT * 
FROM threads
WHERE category = $1
ORDER BY created_at DESC;


-- name: GetThreadsByCategorySortedByMostUpvotes :many
SELECT
    threads.*,
    COUNT(thread_upvotes.id) AS upvote_count 
FROM 
    threads
LEFT JOIN
    thread_upvotes ON threads.id = thread_upvotes.thread_id 
WHERE 
    threads.category = $1
GROUP BY
    threads.id
ORDER BY 
    upvote_count DESC;


-- name: GetThreadsByCategorySortedByLeastUpvotes :many
SELECT
    threads.*,
    COUNT(thread_upvotes.id) AS upvote_count
FROM 
    threads
LEFT JOIN
    thread_upvotes ON threads.id = thread_upvotes.thread_id
WHERE 
    threads.category = $1
GROUP BY
    threads.id
ORDER BY 
    upvote_count ASC;

-- name: GetThreadsByNameSortedByMostUpvotes :many
SELECT
    threads.*,
    COUNT(thread_upvotes.id) AS upvote_count 
FROM 
    threads
LEFT JOIN
    thread_upvotes ON threads.id = thread_upvotes.thread_id 
WHERE 
    threads.title ILIKE $1
GROUP BY
    threads.id
ORDER BY 
    upvote_count DESC;

-- name: GetThreadsByNameSortedByLeastUpvotes :many
SELECT
    threads.*,
    COUNT(thread_upvotes.id) AS upvote_count 
FROM 
    threads
LEFT JOIN
    thread_upvotes ON threads.id = thread_upvotes.thread_id 
WHERE 
    threads.title ILIKE $1
GROUP BY
    threads.id
ORDER BY 
    upvote_count ASC;

-- name: GetThreadCategoriesAndFundingOpportunities :many
SELECT DISTINCT t.category, fo.id, fo.title
FROM threads t
CROSS JOIN funding_opportunities fo;
