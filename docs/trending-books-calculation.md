# How the "Em destaque!" (Trending Books) Calculation Works

The "Em destaque!" section on the home page highlights trending books using a weighted score based on recent user activity. This ensures that books gaining attention in the last 14 days are surfaced, balancing different types of engagement.

## Data Sources
- **Views**: Number of times the book was viewed.
- **Ratings**: Weighted score based on the number of ratings multiplied by the average rating.
- **Comments**: Number of comments posted.

All metrics are aggregated for each book over the last 14 days.

## Weighted Trending Score Formula
Each metric is assigned a weight reflecting its importance:

- **Views**: 0.2
- **Ratings**: 0.45
- **Comments**: 0.35

The trending score for each book is calculated as:

```
score = (views * 0.2) + (ratings * 0.45) + (comments * 0.35)
```

- **views**: Normalized number of views in the last 14 days.
- **ratings**: Normalized weighted score of ratings (number of ratings × average rating) in the last 14 days.
- **comments**: Normalized number of comments in the last 14 days.

## Normalization and Truncation
To ensure fairness, each metric is normalized to a scale of 0 to 1 based on its range:

```
normalized_value = (value - min) / (max - min)
```

Outliers are truncated to the 98th percentile for views, 95th percentile for ratings, and 95th percentile for comments to prevent extreme values from skewing the results.

## Ranking
Books are sorted in descending order by their trending score. The top N books (where N is the number of slots in the carousel) are displayed in the "Em destaque!" section.

## Why This Approach?
- **Recency**: Only recent activity (last 14 days) is considered, so the list reflects current trends.
- **Balanced Engagement**: By weighting different actions, the score rewards books that are not just popular (views) but also generate deeper engagement (ratings, comments).
- **Fairness**: No single metric dominates; a book with many comments or high ratings can outrank one with only high views.

## Example
Suppose a book in the last 14 days has:
- 100 views
- 10 ratings with an average score of 4.5
- 5 comments

Its trending score would be:

```
normalized_views = (100 - min_views) / (max_views - min_views)
normalized_ratings = ((10 * 4.5) - min_ratings) / (max_ratings - min_ratings)
normalized_comments = (5 - min_comments) / (max_comments - min_comments)

score = (normalized_views * 0.2) + (normalized_ratings * 0.45) + (normalized_comments * 0.35)
```

This score is then compared to other books to determine its position in the carousel.

---

**Summary:**
The "Em destaque!" carousel uses a weighted, recency-based formula to highlight books that are currently trending, ensuring a dynamic and engaging selection for users.