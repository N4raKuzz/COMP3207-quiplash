import logging
import json
from azure.cosmos import CosmosClient
from azure.functions import HttpRequest, HttpResponse
import shared_code.translator as translator

URL = "https://cosmos4quiplash.documents.azure.com:443/"
KEY = "MAS055fkgHmtlQcH0hxTZQ5FIkwe0B33mCV8sTLikSlxoT9payvASatqtAupocgz62N5xv0Q6CTkACDbKkfUeQ=="
DATABASE_NAME = "quiplashDB"
CONTAINER_PLAYER = "player"

supported_languages = set(["en", "es", "it", "sv", "ru", "id", "bg", "zh-Hans"])

def main(req: HttpRequest) -> HttpResponse:
    logging.info('Start prompt_get function')

    client = CosmosClient(URL, credential=KEY)
    database = client.get_database_client(DATABASE_NAME)
    player_container = database.get_container_client(CONTAINER_PLAYER)

    input = req.get_json()  # {"top": k}
    k = input['top']

    query = f"""
    SELECT TOP {k} p.username, p.games_played, p.total_score
    FROM player p
    ORDER BY p.total_score DESC, p.games_played ASC, p.username ASC
    """
    
    items = list(player_container.query_items(query=query, enable_cross_partition_query=True))
    
    return HttpResponse(json.dumps(items))