import logging
import json
from azure.functions import HttpRequest, HttpResponse
from azure.cosmos import CosmosClient

URL = "https://cosmos4quiplash.documents.azure.com:443/"
KEY = "MAS055fkgHmtlQcH0hxTZQ5FIkwe0B33mCV8sTLikSlxoT9payvASatqtAupocgz62N5xv0Q6CTkACDbKkfUeQ=="
DATABASE_NAME = "quiplashDB"
CONTAINER_NAME = "player"

def main(req: HttpRequest) -> HttpResponse:

    logging.info('Start player_update function')

    client = CosmosClient(URL, credential=KEY)
    database = client.get_database_client(DATABASE_NAME)
    container = database.get_container_client(CONTAINER_NAME)
    
    input = req.get_json() #Input: {"username": string, "add_to_games_played": int , "add_to_score" : int }
    result = True
    msg = ""

    username = input["username"]    
    addgames = input["add_to_games_played"]
    addscore = input["add_to_score"]

    player = list(container.query_items(query=f"SELECT * FROM c WHERE c.username = '{username}'"))

    if player:

        # Update and Insert the new player info
        player = player[0]
        player["games_played"] += addgames
        player["total_score"] += addscore
        container.upsert_item(player)
        
        result = True
        msg = "OK"

    else:
        result = False
        msg = "Player does not exist"

    return HttpResponse(json.dumps({"result": result, "msg": msg }))