from backend.auth import hash_password, verify_password


def test_hash_and_verify_password():
    password = "Secret123!"
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True
    assert verify_password("wrong", hashed) is False

