import pytest
from pydantic import ValidationError

from models.social import MessageCreate, PhraseCreate, ProfileUpsert, TranslateRequest


def valid_profile() -> dict:
    return {
        "display_name": "Alex",
        "bio": "Learning languages through conversation.",
        "main_photo": "data:image/png;base64,ZmFrZQ==",
        "gallery_photos": [],
        "city": "Paris",
        "country": "France",
        "country_code": "fr",
        "known_languages": [{"language": "French", "level": "native"}],
        "learning_languages": ["English", "Japanese"],
    }


def test_profile_requires_exactly_one_native_language():
    profile = ProfileUpsert(**valid_profile())
    assert profile.known_languages[0].level == "native"

    invalid = valid_profile()
    invalid["known_languages"] = [{"language": "French", "level": "fluent"}]
    with pytest.raises(ValidationError):
        ProfileUpsert(**invalid)


def test_profile_rejects_duplicate_learning_languages_case_insensitively():
    invalid = valid_profile()
    invalid["learning_languages"] = ["English", "english"]
    with pytest.raises(ValidationError):
        ProfileUpsert(**invalid)


def test_message_text_is_trimmed_and_cannot_be_blank():
    message = MessageCreate(recipient_user_id="user_123", text="  Hello there  ")
    assert message.text == "Hello there"
    with pytest.raises(ValidationError):
        MessageCreate(recipient_user_id="user_123", text="   ")


def test_translation_request_rejects_blank_text():
    with pytest.raises(ValidationError):
        TranslateRequest(text="  ", target_language="Spanish")


def test_profile_rejects_whitespace_only_display_name_and_language():
    invalid_name = valid_profile()
    invalid_name["display_name"] = "   "
    with pytest.raises(ValidationError):
        ProfileUpsert(**invalid_name)

    invalid_language = valid_profile()
    invalid_language["known_languages"] = [{"language": "   ", "level": "native"}]
    with pytest.raises(ValidationError):
        ProfileUpsert(**invalid_language)


def test_saved_phrase_fields_are_trimmed_and_nonempty():
    phrase = PhraseCreate(original=" hello ", translated=" bonjour ", target_language=" French ")
    assert phrase.original == "hello"
    assert phrase.translated == "bonjour"
    assert phrase.target_language == "French"
    with pytest.raises(ValidationError):
        PhraseCreate(original=" ", translated="bonjour", target_language="French")
