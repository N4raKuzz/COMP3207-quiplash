import logging
import json
import re
from azure.cosmos import CosmosClient
from azure.functions import HttpRequest, HttpResponse

URL = "https://cosmos4quiplash.documents.azure.com:443/"
KEY = "MAS055fkgHmtlQcH0hxTZQ5FIkwe0B33mCV8sTLikSlxoT9payvASatqtAupocgz62N5xv0Q6CTkACDbKkfUeQ=="
DATABASE_NAME = "quiplashDB"
CONTAINER_PLAYER = "player"
CONTAINER_PROMPT = "prompt"

supported_languages = set(["en", "es", "it", "sv", "ru", "id", "bg", "zh-Hans"])

def main(req: HttpRequest) -> HttpResponse:
    logging.info('Processing Get Prompts')

    client = CosmosClient(URL, credential=KEY)
    database = client.get_database_client(DATABASE_NAME)
    player_container = database.get_container_client(CONTAINER_PLAYER)
    prompt_container = database.get_container_client(CONTAINER_PROMPT)
    
    input = req.get_json()  # {"text": "string", "username": "string" }

    result = False
    msg = ""

    if "player" in input:
        query = f"SELECT * FROM prompt p WHERE p.username = {input['player']}"
        prompts = prompt_container.query_items(query=query, enable_cross_partition_query=True)

        for p in prompts:
            prompt_container.delete_item(p, partition_key = p['username'])

        result = True
        msg = f"{len(prompts)} prompts deleted"
   
    if "word" in input:
        count = 0
        word = input['word'] + '\b'

        query = f"SELECT * FROM prompt p"
        prompts = prompt_container.query_items(query=query, enable_cross_partition_query=True)

        for p in prompts:
            for t in p['texts']:
                if not ("text" in t and "language" in t):
                    continue
                if t['language'] == 'en' & re.search(word, t['text']):
                    prompt_container.delete_item(p, partition_key = p['username'])
                    count += 1

        result = True
        msg = f"{count} prompts deleted"       
         
    return HttpResponse(json.dumps({"result": result, "msg": msg }))
    
