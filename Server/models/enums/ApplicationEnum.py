from enum import Enum

class ApplicationStatusEnum(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ACCEPTED_FOR_INTERVIEW = "accepted_for_interview"