import logging
import json
from azure.functions import HttpRequest, HttpResponse
from azure.cosmos import CosmosClient
from shared_code.pwd_encrypt_md5 import md5

URL = "https://cosmos4quiplash.documents.azure.com:443/"
KEY = "MAS055fkgHmtlQcH0hxTZQ5FIkwe0B33mCV8sTLikSlxoT9payvASatqtAupocgz62N5xv0Q6CTkACDbKkfUeQ=="
DATABASE_NAME = "quiplashDB"
CONTAINER_NAME = "player"

def main(req: HttpRequest) -> HttpResponse:
    logging.info('Processing Player_Login request.')

    logging.info('Start player_login function')

    client = CosmosClient(URL, credential=KEY)
    db = client.get_database_client(DATABASE_NAME)
    player_container = db.get_container_client(CONTAINER_NAME)
    
    register_json = req.get_json()

    # {"username":  "string" , "password" : "string"}    
    username = register_json["account"]
    password = register_json["password"]

    user = list(container.query_items(query=f"SELECT * FROM c WHERE c.username = '{username}' ", enable_cross_partition_query=True))

    result = False
    msg = ""
    if user["password"] == md5(password):
        result = True
        msg = "Cridential Verified"
    else:       
        msg = "Username or password incorrect"


    return func.HttpResponse(json.dumps({"result": result, "msg": msg }))
