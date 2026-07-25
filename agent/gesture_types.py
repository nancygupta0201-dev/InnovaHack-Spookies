# tools/gesture_types.py
from typing import Optional
from pydantic import BaseModel, Field

class GestureData(BaseModel):
    eye_contact_ratio: Optional[float] = Field(default=None, description="Fraction of time eye contact was maintained")
    smile_intensity: Optional[float] = Field(default=None, description="Average smile intensity, 0-1")
    fidget_count: Optional[int] = Field(default=None, description="Number of fidgeting events detected")
    posture_score: Optional[float] = Field(default=None, description="Posture openness/confidence score, 0-1")
    blink_rate: Optional[float] = Field(default=None, description="Blinks per minute")