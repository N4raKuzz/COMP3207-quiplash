import logging
import json
from azure.cosmos import CosmosClient
from azure.functions import HttpRequest, HttpResponse
import shared_code.translator as translator

URL = "https://cosmos4quiplash.documents.azure.com:443/"
KEY = "MAS055fkgHmtlQcH0hxTZQ5FIkwe0B33mCV8sTLikSlxoT9payvASatqtAupocgz62N5xv0Q6CTkACDbKkfUeQ=="
DATABASE_NAME = "quiplashDB"
CONTAINER_PLAYER = "player"
CONTAINER_PROMPT = "prompt"

supported_languages = set(["en", "es", "it", "sv", "ru", "id", "bg", "zh-Hans"])

def main(req: HttpRequest) -> HttpResponse:
    logging.info('Start prompt_get function')

    client = CosmosClient(URL, credential=KEY)
    database = client.get_database_client(DATABASE_NAME)
    player_container = database.get_container_client(CONTAINER_PLAYER)
    prompt_container = database.get_container_client(CONTAINER_PROMPT)
    
    input = req.get_json()  # {"text": "string", "username": "string" }
    text = input["text"]
    username = input["username"]

    langcode, score = translator.detect(text)
    result = False
    msg = ""

    # Find if player exists
    user = list(player_container.query_items(query=f"SELECT * FROM player p WHERE p.username = '{username}'", enable_cross_partition_query=True))
    if not user:
        result = False
        msg = "Player does not exist"
        return HttpResponse(json.dumps({"result": result, "msg": msg }))      

    # Find if text length valid
    if len(text) < 15 or len(text) > 80:
        result = False
        msg = "Prompt less than 15 characters or more than 80 characters"
        
    elif langcode in supported_languages and score > 0.3:
        result = True
        msg = "OK"

        texts = [{"language" : langcode, "text" : text}]
        for lan in (supported_languages - {langcode}):
            texts.append(translator.translate(text,lan))

        output = {
            "username": username,
            "texts": texts
        }
        
        prompt_container.create_item(body=output, enable_automatic_id_generation=True)
        
    else:
        result = False
        msg = "Unsupported language"
        
          
    return HttpResponse(json.dumps({"result": result, "msg": msg }))
    
