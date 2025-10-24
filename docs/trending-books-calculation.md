# How the "Em destaque!" (Trending Books) Calculation Works

The "Em destaque!" section on the home page highlights trending books using a weighted score based on recent user activity. This ensures that books gaining attention in the last 14 days are surfaced, balancing different types of engagement.

## Data Sources
- **Views**: Number of times the book was viewed.
- **Ratings**: Number of ratings received.
- **Comments**: Number of comments posted.
- **Follows**: Number of users following the book.

All metrics are aggregated for each book over the last 14 days.

## Weighted Trending Score Formula
Each metric is assigned a weight reflecting its importance:

- **Views**: 0.5
- **Ratings**: 0.2
- **Comments**: 0.2
- **Follows**: 0.1

The trending score for each book is calculated as:

```
score = (views * 0.5) + (ratings * 0.2) + (comments * 0.2) + (follows * 0.1)
```

- **views**: Number of views in the last 14 days
- **ratings**: Number of ratings in the last 14 days
- **comments**: Number of comments in the last 14 days
- **follows**: Number of follows in the last 14 days

## Ranking
Books are sorted in descending order by their trending score. The top N books (where N is the number of slots in the carousel) are displayed in the "Em destaque!" section.

## Why This Approach?
- **Recency**: Only recent activity (last 14 days) is considered, so the list reflects current trends.
- **Balanced Engagement**: By weighting different actions, the score rewards books that are not just popular (views) but also generate deeper engagement (ratings, comments, follows).
- **Fairness**: No single metric dominates; a book with many comments or follows can outrank one with only high views.

## Example
Suppose a book in the last 14 days has:
- 100 views
- 10 ratings
- 5 comments
- 2 follows

Its trending score would be:

```
score = (100 * 0.5) + (10 * 0.2) + (5 * 0.2) + (2 * 0.1)
      = 50 + 2 + 1 + 0.2
      = 53.2
```

This score is then compared to other books to determine its position in the carousel.

---

**Summary:**
The "Em destaque!" carousel uses a weighted, recency-based formula to highlight books that are currently trending, ensuring a dynamic and engaging selection for users.