from enum import Enum

class JobStatus(str, Enum):
    OPEN = "open"                # Accepting applications
    CLOSED = "closed"            # No longer accepting applications
    EXPIRED = "expired"          # Deadline passed automatically