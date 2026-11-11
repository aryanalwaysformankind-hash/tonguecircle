from datetime import datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator, model_validator


class ClerkConfig(BaseModel):
    enabled: bool
    publishable_key: str
    proxy_url: str


class LanguageSkill(BaseModel):
    language: str = Field(min_length=1, max_length=40)
    level: Literal["native", "fluent"]

    @field_validator("language")
    @classmethod
    def strip_language(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Language cannot be empty")
        return cleaned


class ProfileUpsert(BaseModel):
    display_name: str = Field(min_length=1, max_length=60)
    bio: str = Field(default="", max_length=500)
    main_photo: str = Field(min_length=1, max_length=1_400_000)
    gallery_photos: list[str] = Field(default_factory=list, max_length=5)
    city: str = Field(default="", max_length=100)
    country: str = Field(default="", max_length=100)
    country_code: str = Field(default="", max_length=2, pattern=r"^([a-z]{2})?$")
    known_languages: list[LanguageSkill] = Field(min_length=1, max_length=2)
    learning_languages: list[str] = Field(default_factory=list, max_length=5)
    birth_date: str | None = Field(default=None, max_length=10)
    sex: Literal["male", "female"] | None = None

    @field_validator("display_name")
    @classmethod
    def strip_display_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Display name cannot be empty")
        return cleaned

    @field_validator("gallery_photos")
    @classmethod
    def validate_gallery_photos(cls, photos: list[str]) -> list[str]:
        if any(not photo or len(photo) > 1_400_000 for photo in photos):
            raise ValueError("Each photo must be a valid image under 1 MB")
        return photos

    @field_validator("learning_languages")
    @classmethod
    def validate_learning_languages(cls, languages: list[str]) -> list[str]:
        cleaned = [language.strip() for language in languages if language.strip()]
        if len({language.casefold() for language in cleaned}) != len(cleaned):
            raise ValueError("Learning languages must be unique")
        return cleaned

    @model_validator(mode="after")
    def validate_known_languages(self) -> "ProfileUpsert":
        levels = [skill.level for skill in self.known_languages]
        names = [skill.language.casefold() for skill in self.known_languages]
        if levels.count("native") != 1 or levels.count("fluent") > 1:
            raise ValueError("Choose one native language and at most one fluent language")
        if len(set(names)) != len(names):
            raise ValueError("Known languages must be unique")
        return self


class ProfileResponse(ProfileUpsert):
    user_id: str
    updated_at: datetime


class DiscoverProfile(ProfileResponse):
    match_score: int = 0
    match_reasons: list[str] = Field(default_factory=list)


class UnreadCount(BaseModel):
    count: int


class PhraseCreate(BaseModel):
    original: str = Field(min_length=1, max_length=1200)
    translated: str = Field(min_length=1, max_length=2400)
    target_language: str = Field(min_length=1, max_length=40)
    partner_name: str = Field(default="", max_length=60)

    @field_validator("original", "translated", "target_language")
    @classmethod
    def strip_phrase_value(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Phrase text and language cannot be empty")
        return cleaned


class Phrase(PhraseCreate):
    id: str
    created_at: datetime


class LocationResolveRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class LocationResolveResponse(BaseModel):
    city: str
    country: str
    country_code: str = ""


class TypingStatus(BaseModel):
    typing: bool


class MessageCreate(BaseModel):
    recipient_user_id: str = Field(min_length=1, max_length=200)
    text: str = Field(default="", max_length=1200)
    message_type: Literal["text", "audio"] = "text"
    audio_data: str | None = Field(default=None, max_length=14_000_000)

    @model_validator(mode="after")
    def validate_message_content(self) -> "MessageCreate":
        self.text = self.text.strip()
        if self.message_type == "text" and not self.text:
            raise ValueError("Message cannot be empty")
        if self.message_type == "audio" and (not self.audio_data or not self.audio_data.startswith("data:audio/")):
            raise ValueError("A valid audio recording is required")
        if self.message_type == "text" and self.audio_data:
            raise ValueError("Audio data is only valid for audio messages")
        return self


class MessageResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    conversation_id: str
    sender_user_id: str
    recipient_user_id: str
    text: str = ""
    message_type: Literal["text", "audio"] = "text"
    audio_data: str | None = None
    created_at: datetime
    read: bool = False


class ConversationResponse(BaseModel):
    id: str
    other_user_id: str
    other_display_name: str
    other_main_photo: str
    last_message: str
    updated_at: datetime
    unread_count: int = 0


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1200)
    target_language: str = Field(default="English", min_length=1, max_length=40)
    mode: Literal["translate", "transliterate"] = "translate"
    source_language: str | None = Field(default=None, max_length=40)

    @field_validator("text", "target_language")
    @classmethod
    def strip_value(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Value cannot be empty")
        return cleaned
