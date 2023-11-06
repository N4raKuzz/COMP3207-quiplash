import logging
import json
from azure.functions import HttpRequest, HttpResponse
from azure.cosmos import CosmosClient

URL = "https://cosmos4quiplash.documents.azure.com:443/"
KEY = "MAS055fkgHmtlQcH0hxTZQ5FIkwe0B33mCV8sTLikSlxoT9payvASatqtAupocgz62N5xv0Q6CTkACDbKkfUeQ=="
DATABASE_NAME = "quiplashDB"
CONTAINER_NAME = "prompt"

def main(req: HttpRequest) -> HttpResponse:
    logging.info('Start prompt_get function')

    client = CosmosClient(URL, credential=KEY)
    database = client.get_database_client(DATABASE_NAME)
    container = database.get_container_client(CONTAINER_NAME)
    
    input = req.get_json()  # {"players":  [list of usernames], "language": "langcode"}
    players = input["players"]
    langcode = input["language"]

    query = f"""
    SELECT *
    FROM prompt p 
    WHERE p.username IN ({','.join([f"'{player}'" for player in players])}) AND ARRAY_LENGTH(
        ARRAY(SELECT VALUE t FROM t IN c.texts WHERE t.language = '{langcode}')
    ) > 0
    """

    # Execute the SQL query
    prompts = container.query_items(query=query, enable_cross_partition_query=True)

    output = []
    for p in prompts:
        texts = p["texts"]
        for text in texts:
            if text['language'] == langcode:
                new_item = {
                    "id": texts["id"],
                    "text": text['text'],
                    "username": texts["username"]
                }
                output.append(new_item)
    
    return HttpResponse(json.dumps(output))
