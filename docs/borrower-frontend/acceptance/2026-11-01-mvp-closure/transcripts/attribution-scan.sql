-- Distinct user prompts under the candidate conversations, for attribution against the harness sources.
SELECT COUNT(DISTINCT m.text) AS distinct_user_prompts
FROM `tabAdvisory Message` m
JOIN `tabAdvisory Conversation` c ON c.name = m.parent
WHERE c.owner = 'review.demo@example.invalid' AND c.creation >= '2026-11-01 00:00:00' AND m.role = 'user';

SELECT LEFT(m.text, 90) AS user_prompt, COUNT(*) AS times
FROM `tabAdvisory Message` m
JOIN `tabAdvisory Conversation` c ON c.name = m.parent
WHERE c.owner = 'review.demo@example.invalid' AND c.creation >= '2026-11-01 00:00:00' AND m.role = 'user'
GROUP BY LEFT(m.text, 90)
ORDER BY times DESC;

SELECT LEFT(m.text, 70) AS assistant_shape, COUNT(*) AS times
FROM `tabAdvisory Message` m
JOIN `tabAdvisory Conversation` c ON c.name = m.parent
WHERE c.owner = 'review.demo@example.invalid' AND c.creation >= '2026-11-01 00:00:00' AND m.role = 'assistant'
GROUP BY LEFT(m.text, 70)
ORDER BY times DESC
LIMIT 25;

SELECT '=== conversations outside the cutoff (must survive) ===' AS s;
SELECT name, creation, turn_count, LEFT(title, 60) AS title
FROM `tabAdvisory Conversation`
WHERE owner = 'review.demo@example.invalid' AND creation < '2026-11-01 00:00:00'
ORDER BY creation;

SELECT '=== other owners (must survive) ===' AS s;
SELECT owner, COUNT(*) AS conversations, MIN(creation) AS first_seen, MAX(creation) AS last_seen
FROM `tabAdvisory Conversation`
WHERE owner <> 'review.demo@example.invalid'
GROUP BY owner ORDER BY conversations DESC;
