import logging
import json
from azure.functions import HttpRequest, HttpResponse
from azure.cosmos import CosmosClient
from shared_code.str_utils import StringUtils

URL = "https://cosmos4quiplash.documents.azure.com:443/"
KEY = "MAS055fkgHmtlQcH0hxTZQ5FIkwe0B33mCV8sTLikSlxoT9payvASatqtAupocgz62N5xv0Q6CTkACDbKkfUeQ=="
DATABASE_NAME = "quiplashDB"
CONTAINER_NAME = "player"

def main(req: HttpRequest) -> HttpResponse:
    logging.info('Start player_register function')

    client = CosmosClient(URL, credential=KEY)
    database = client.get_database_client(DATABASE_NAME)
    container = database.get_container_client(CONTAINER_NAME)
    
    register_json = req.get_json()

    # {"username":  "string" , "password" : "string"}

    result = True
    msg = ""

    username = register_json["username"]
    password = register_json["password"]

    if list(container.query_items(query=f"SELECT 1 FROM c WHERE c.username = '{username}'")):
        result = False
        msg = "Username already exists"

    elif (len(username) < 4 | len(username) > 14):
        result = False
        msg = "Username less than 4 characters or more than 14 characters"

    elif (len(password) < 10 | len(password) > 20):
        result = False
        msg = "Password less than 10 characters or more than 20 characters" 

    else:
        result = True
        msg = "OK"
        
        player = {
            "username": username,
            "password": StringUtils.md5(password),
            "games_played": 0,
            "total_score": 0
        }
        container.create_item(body=player, enable_automatic_id_generation=True)


    return HttpResponse(json.dumps({"result": result, "msg": msg }))