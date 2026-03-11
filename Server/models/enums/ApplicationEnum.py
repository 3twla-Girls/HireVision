from enum import Enum

class ApplicationStatusEnum(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"