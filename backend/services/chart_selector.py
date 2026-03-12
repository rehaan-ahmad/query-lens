"""
Chart type selector.
Analyses the SQL query and result shape to pick the most appropriate
Recharts component for the frontend.
"""

from utils.logger import get_logger

logger = get_logger(__name__)

# Time/year-related column name fragments
TIME_KEYWORDS = {"year", "date", "month", "quarter", "week", "time", "period"}

# Aggregate measure keywords
AGGREGATE_KEYWORDS = {"count", "sum", "avg", "average", "total", "mean"}


def select_chart(sql: str, result_data: list[dict]) -> str:
    """
    Determine the best chart type based on SQL and result shape.

    Priority order (as specified in the TODO):
    1. time/year grouping  → line
    2. single categorical breakdown with counts/sums → bar
    3. percentage / parts-of-whole → pie
    4. 2 continuous numeric columns → scatter
    5. single aggregate value → stat_card
    6. fallback → bar

    Returns a chart type string consumed by the frontend ChartRouter.
    """
    if not result_data:
        logger.info("No result data — defaulting to stat_card")
        return "stat_card"

    sql_lower = sql.lower()
    columns = list(result_data[0].keys())
    num_columns = len(columns)

    # -- Rule 1: time/year grouping → line chart --
    has_time_col = any(
        any(kw in col.lower() for kw in TIME_KEYWORDS)
        for col in columns
    )
    if has_time_col and "group by" in sql_lower:
        logger.info("Chart selected: line (time-based grouping)")
        return "line"

    # -- Rule 2: single categorical + aggregate → bar chart --
    has_group_by = "group by" in sql_lower
    has_aggregate = any(kw in sql_lower for kw in AGGREGATE_KEYWORDS)
    if has_group_by and has_aggregate and num_columns == 2:
        logger.info("Chart selected: bar (categorical breakdown)")
        return "bar"

    # -- Rule 3: percentage / parts-of-whole → pie chart --
    pct_keywords = {"percent", "percentage", "share", "proportion", "ratio", "pie"}
    if any(kw in sql_lower for kw in pct_keywords):
        logger.info("Chart selected: pie (percentage/proportion)")
        return "pie"

    # -- Rule 4: two continuous numeric columns → scatter --
    if num_columns == 2:
        numeric_types = (int, float)
        col_a, col_b = columns[0], columns[1]
        if all(
            isinstance(row.get(col_a), numeric_types)
            and isinstance(row.get(col_b), numeric_types)
            for row in result_data[:5]  # Spot-check first 5 rows
        ):
            logger.info("Chart selected: scatter (2 continuous numeric columns)")
            return "scatter"

    # -- Rule 5: single aggregate value → stat_card --
    if num_columns == 1 and len(result_data) == 1:
        logger.info("Chart selected: stat_card (single KPI value)")
        return "stat_card"

    # -- Fallback → bar --
    logger.info("Chart selected: bar (fallback)")
    return "bar"
