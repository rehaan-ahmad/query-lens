"""
Structured logging utility.
SECURITY: Never log secrets, API keys, passwords, or raw SQL with user data.
AthenaGuard §6: Credentials must never appear in log output.
"""

import logging
import sys


def get_logger(name: str) -> logging.Logger:
    """Return a named logger with a consistent format."""
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        # Prevent propagation to avoid duplicate output
        logger.propagate = False

    return logger
