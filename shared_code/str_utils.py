import hashlib

class StringUtils:

    def __init__(self) -> None:
        pass

    @staticmethod
    def md5(password):
        hash_object = hashlib.md5()
        hash_object.update(password.encode('utf-8'))
        hashed_password = hash_object.hexdigest()
    
        return hashed_password
    
