"""
Rate limiter configuration using slowapi.
AthenaGuard §3 / §5: Rate limiting is mandatory on all routes.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Key function: rate-limit by remote IP address
limiter = Limiter(key_func=get_remote_address)
