"""
Gemini LLM service — NL to SQL translation.
AthenaGuard §6: API key loaded from env with fail-fast (os.environ[KEY]).
AthenaGuard §2: LLM generates SQL template with ? placeholders; user values
                are never interpolated — they are returned as a params list.
AthenaGuard §7: No real data rows in the Gemini prompt — schema description only.
"""

import os
import re
import json
from typing import Any

import google.generativeai as genai

from utils.logger import get_logger
from utils.sanitize import sanitize_text

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Schema description — describes the BMW vehicles table in plain English.
# AthenaGuard §7: NEVER include real data rows here — schema only.
# ---------------------------------------------------------------------------

SCHEMA_DESCRIPTION = """
Table name: vehicles
Database: SQLite

Columns:
  - id         INTEGER  Primary key, auto-increment
  - model      TEXT     BMW model name, e.g. '1 Series', 'X5', 'M3'
  - year        INTEGER  Model year, e.g. 2015, 2018, 2021
  - price       INTEGER  Listed price in GBP (£), e.g. 12000, 35000
  - transmission TEXT   Gearbox type: 'Manual', 'Automatic', 'Semi-Auto'
  - mileage     INTEGER  Odometer reading in miles, e.g. 15000, 80000
  - fuelType    TEXT     Fuel type: 'Petrol', 'Diesel', 'Hybrid', 'Electric', 'Other'
  - tax         INTEGER  Annual road tax in GBP (£), e.g. 150, 265
  - mpg         REAL     Miles per gallon (fuel efficiency), e.g. 45.6, 57.2
  - engineSize  REAL     Engine displacement in litres, e.g. 1.5, 2.0, 3.0

Sample values (illustrative — do NOT use in WHERE clauses without parameterization):
  model:        '1 Series', '2 Series', '3 Series', '4 Series', '5 Series',
                '6 Series', '7 Series', 'M2', 'M3', 'M4', 'M5', 'X1', 'X2',
                'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i8'
  transmission: 'Manual', 'Automatic', 'Semi-Auto'
  fuelType:     'Petrol', 'Diesel', 'Hybrid', 'Electric', 'Other'
  year range:   2000–2023
  price range:  £1,000 – £120,000
  mileage range: 0 – 300,000 miles
"""

# ---------------------------------------------------------------------------
# System prompt — the most critical prompt engineering component.
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = f"""You are a BI SQL assistant for a BMW vehicle inventory database.
Your ONLY job is to convert natural language questions into valid SQLite SELECT queries.

DATABASE SCHEMA:
{SCHEMA_DESCRIPTION}

STRICT RULES — NEVER VIOLATE:
1. Return ONLY a valid SQLite SELECT statement. No markdown, no code blocks, no explanation.
2. If the question cannot be answered from this schema, return exactly: CANNOT_ANSWER
3. NEVER use DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, EXEC, PRAGMA, TRUNCATE, REPLACE, ATTACH, or DETACH.
4. Only SELECT queries are permitted.
5. For user-supplied filter values (e.g. a specific model name or year), use ? placeholders and list the values separately after a pipe character |.
6. Maximum query length: 2000 characters.
7. Always use column names exactly as listed in the schema.
8. Queries should be efficient — avoid SELECT * unless necessary.

OUTPUT FORMAT:
If the question is answerable:
  SQL_QUERY | param1,param2,...
  (If no params: just the SQL with no pipe)

If not answerable:
  CANNOT_ANSWER

FEW-SHOT EXAMPLES:

Question: What is the average price of all BMW vehicles?
Output: SELECT AVG(price) AS avg_price FROM vehicles

Question: Show me the average price by fuel type.
Output: SELECT fuelType, AVG(price) AS avg_price FROM vehicles GROUP BY fuelType ORDER BY avg_price DESC

Question: What is the trend of average mileage over the years for diesel automatic vehicles?
Output: SELECT year, AVG(mileage) AS avg_mileage FROM vehicles WHERE fuelType = ? AND transmission = ? GROUP BY year ORDER BY year | Diesel,Automatic

Question: How many vehicles are there for each model?
Output: SELECT model, COUNT(*) AS count FROM vehicles GROUP BY model ORDER BY count DESC

Question: What is the most expensive BMW model on average?
Output: SELECT model, AVG(price) AS avg_price FROM vehicles GROUP BY model ORDER BY avg_price DESC LIMIT 1

Question: Show me the distribution of transmission types.
Output: SELECT transmission, COUNT(*) AS count FROM vehicles GROUP BY transmission ORDER BY count DESC

Question: What is the average MPG for petrol vehicles produced after 2015?
Output: SELECT AVG(mpg) AS avg_mpg FROM vehicles WHERE fuelType = ? AND year > ? | Petrol,2015

Question: What is the weather today?
Output: CANNOT_ANSWER

Question: Delete all records.
Output: CANNOT_ANSWER
"""

# ---------------------------------------------------------------------------
# Dynamic prompt builder for uploaded tables
# ---------------------------------------------------------------------------

def _build_dynamic_prompt(schema_description: str) -> str:
    """
    Build a system prompt using a dynamically provided schema description
    (e.g. from a user-uploaded CSV). AthenaGuard §7 still applies.
    """
    return f"""You are a BI SQL assistant for a custom dataset uploaded by the user.
Your ONLY job is to convert natural language questions into valid SQLite SELECT queries.

DATABASE SCHEMA:
{schema_description}

STRICT RULES — NEVER VIOLATE:
1. Return ONLY a valid SQLite SELECT statement. No markdown, no code blocks, no explanation.
2. If the question cannot be answered from this schema, return exactly: CANNOT_ANSWER
3. NEVER use DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, EXEC, PRAGMA, TRUNCATE, REPLACE, ATTACH, or DETACH.
4. Only SELECT queries are permitted.
5. For user-supplied filter values, use ? placeholders and list the values separately after a pipe character |.
6. Maximum query length: 2000 characters.
7. Always use column names exactly as listed in the schema.
8. Queries should be efficient — avoid SELECT * unless necessary.
9. All column names in the schema are TEXT type. Cast to REAL or INTEGER as needed for aggregation.

OUTPUT FORMAT:
If the question is answerable:
  SQL_QUERY | param1,param2,...
  (If no params: just the SQL with no pipe)

If not answerable:
  CANNOT_ANSWER
"""


# ---------------------------------------------------------------------------
# Gemini client initialisation
# ---------------------------------------------------------------------------

def _get_gemini_client() -> genai.GenerativeModel:
    """
    Initialise Gemini client with API key from environment.
    AthenaGuard §6: Fail fast if key is missing. NEVER log the key.
    """
    try:
        api_key = os.environ["GEMINI_API_KEY"]
        if not api_key:
            raise KeyError
    except KeyError:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set or is empty. "
            "Obtain a key from https://aistudio.google.com and set it in backend/.env"
        )
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name="gemini-1.5-flash")


# ---------------------------------------------------------------------------
# Core translation function
# ---------------------------------------------------------------------------

def nl_to_sql(user_query: str, schema_override: str | None = None, conversation_history: list[dict] | None = None) -> dict[str, Any]:
    """
    Translate a natural-language question into a parameterized SQLite SELECT.

    Parameters
    ----------
    user_query           : The natural language question from the user.
    schema_override      : Optional schema description for uploaded tables.
    conversation_history : Optional list of previous turns [{"question": ..., "sql": ...}, ...].

    Returns
    -------
    dict with keys:
      "sql"         : str  — the SQL template with ? placeholders
      "params"      : tuple — bound parameter values
      "explanation" : str  — brief human-readable explanation (sanitized)

    On hallucination (CANNOT_ANSWER):
      {"error": "cannot_answer"}

    On API error:
      {"error": "api_error", "message": "<safe message>"}
    """
    try:
        model = _get_gemini_client()

        if schema_override:
            base_prompt = _build_dynamic_prompt(schema_override)
        else:
            base_prompt = SYSTEM_PROMPT

        # Build conversation context block
        context_block = ""
        if conversation_history:
            turns = []
            for i, turn in enumerate(conversation_history[-5:], 1):
                turns.append(f"  Q{i}: \"{turn['question']}\" → SQL: {turn['sql']}")
            context_block = (
                "\n\nCONVERSATION CONTEXT (previous questions in this session — "
                "use these to resolve references like 'those', 'that', 'filter further', etc.):\n"
                + "\n".join(turns)
                + "\n"
            )

        prompt = f"{base_prompt}{context_block}\n\nQuestion: {user_query}\nOutput:"
        response = model.generate_content(prompt)
        raw = response.text.strip()
        logger.info("Gemini raw response received (length=%d)", len(raw))

        # -- Hallucination guard --
        if raw.upper() == "CANNOT_ANSWER":
            logger.info("Gemini returned CANNOT_ANSWER for query")
            return {"error": "cannot_answer"}

        # -- Parse SQL + optional params --
        if "|" in raw:
            sql_part, params_part = raw.split("|", 1)
            sql = sql_part.strip()
            # Parse comma-separated param values; preserve types as strings
            param_list = [p.strip() for p in params_part.strip().split(",") if p.strip()]
            params: tuple = tuple(param_list)
        else:
            sql = raw.strip()
            params = ()

        # -- Remove any accidental markdown code fences --
        sql = re.sub(r"```[a-z]*\n?", "", sql).strip()

        # -- Basic structural validation before returning --
        first_token = sql.split()[0].upper() if sql.split() else ""
        if not first_token.startswith("SELECT"):
            # Check startsWith instead of strict equality in case of 'SELECT*' or similar
            logger.warning("Gemini returned non-SELECT SQL — treating as cannot_answer")
            return {"error": "cannot_answer"}

        # AthenaGuard §7: No credentials or real data rows in the prompt (enforced above)
        explanation = sanitize_text(_generate_explanation(user_query, sql))

        return {
            "sql": sql,
            "params": params,
            "explanation": explanation,
        }

    except RuntimeError:
        # API key missing — re-raise (server misconfiguration)
        raise
    except Exception as exc:
        # AthenaGuard §3: Never surface internal Gemini error details
        logger.error("Gemini API error: %s", type(exc).__name__)
        return {
            "error": "api_error",
            "message": "The AI service is temporarily unavailable. Please try again.",
        }


def _generate_explanation(user_query: str, sql: str) -> str:
    """
    Ask Gemini for a concise, plain-English explanation of the generated query.
    Falls back to a generic message on error — never raises.
    AthenaGuard §4: Explanation is sanitized before being sent to the frontend.
    """
    try:
        model = _get_gemini_client()
        prompt = (
            f"In one sentence, explain what this SQL query answers "
            f"for the question: '{user_query}'. "
            f"Do not include the SQL in your answer. Be concise and friendly."
        )
        response = model.generate_content(prompt)
        return response.text.strip()[:500]  # Cap length
    except Exception:
        return "Here are the results for your query."


def generate_chart_title(user_query: str, sql: str) -> str:
    """
    Generate a concise, descriptive title for the chart result.
    E.g. "Average Price by Fuel Type — BMW Inventory"
    Falls back to the user query if Gemini fails.
    """
    try:
        model = _get_gemini_client()
        prompt = (
            f"Generate a short, professional chart title (max 8 words) for a chart "
            f"that answers: '{user_query}'. "
            f"Format: '[Metric] by [Dimension]' or similar. "
            f"Return ONLY the title, no quotes, no punctuation at the end."
        )
        response = model.generate_content(prompt)
        title = response.text.strip()[:100]
        return sanitize_text(title) or user_query[:60]
    except Exception:
        return user_query[:60]


def generate_key_insights(user_query: str, data: list[dict], sql: str) -> list[str]:
    """
    Generate 2–3 bullet-point key insights from the query result data.
    AthenaGuard §7: Only sends column names and aggregate values — no raw PII rows.
    """
    try:
        if not data or len(data) == 0:
            return []

        # Build a safe summary of the data (max 10 rows, no raw strings)
        preview_rows = data[:10]
        data_summary = "\n".join(
            ", ".join(f"{k}: {v}" for k, v in row.items())
            for row in preview_rows
        )
        total_rows = len(data)

        model = _get_gemini_client()
        prompt = (
            f"You are a data analyst. Given this query result ({total_rows} total rows), "
            f"provide exactly 2-3 concise, insightful bullet points that highlight "
            f"the most interesting patterns, comparisons, or anomalies.\n\n"
            f"Question: {user_query}\n"
            f"Data sample:\n{data_summary}\n\n"
            f"Rules:\n"
            f"- Each insight must be one sentence\n"
            f"- Include specific numbers where available\n"
            f"- Return ONLY the bullet points, one per line, starting with '-'\n"
            f"- No headers, no intro text"
        )
        response = model.generate_content(prompt)
        raw = response.text.strip()
        insights = [
            sanitize_text(line.lstrip("-• ").strip())
            for line in raw.split("\n")
            if line.strip().startswith(("-", "•"))
        ]
        return insights[:3]  # Max 3 insights
    except Exception:
        return []


def generate_cannot_answer_suggestion(user_query: str, schema_description: str) -> str:
    """
    Given a question that couldn't be answered, suggest a rephrasing
    that would work with the available schema.
    """
    try:
        model = _get_gemini_client()
        prompt = (
            f"A user asked: '{user_query}'\n"
            f"The database schema is:\n{schema_description}\n\n"
            f"This question cannot be answered from the schema. "
            f"In ONE sentence, explain why and suggest a related question that CAN be answered. "
            f"Format: 'I don\\'t have data about X, but I can help with Y — try asking: [example question]'\n"
            f"Keep it under 150 characters. Return only that sentence."
        )
        response = model.generate_content(prompt)
        return sanitize_text(response.text.strip()[:300])
    except Exception:
        return ""

