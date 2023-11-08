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
    logging.info('Processing Player Login')

    client = CosmosClient(URL, credential=KEY)
    db = client.get_database_client(DATABASE_NAME)
    player_container = db.get_container_client(CONTAINER_NAME)
    
    input = req.get_json() # Input: {"username":  "string" , "password" : "string"}        
    username = input["username"]
    password = input["password"]

    user = list(player_container.query_items(query=f"SELECT * FROM player p WHERE p.username = '{username}'", enable_cross_partition_query=True))

    result = False
    msg = "Username or password incorrect"
    if user:
        if user[0]["password"] == StringUtils.md5(password):
            result = True
            msg = "OK"
            
    return HttpResponse(json.dumps({"result": result, "msg": msg }))
