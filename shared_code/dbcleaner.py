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

def clean_player_db():
    client = CosmosClient(URL, credential=KEY)
    database = client.get_database_client(DATABASE_NAME)
    player_container = database.get_container_client(CONTAINER_PLAYER)

    query = f"SELECT * FROM player p"
    players = player_container.query_items(query=query, enable_cross_partition_query=True)
    for p in players:
        player_container.delete_item(p, partition_key = p['id'])

def clean_prompt_db():
    client = CosmosClient(URL, credential=KEY)
    database = client.get_database_client(DATABASE_NAME)
    prompt_container = database.get_container_client(CONTAINER_PROMPT)

    query = f"SELECT * FROM prompt p"
    prompts = prompt_container.query_items(query=query, enable_cross_partition_query=True)
    for p in prompts:
        prompt_container.delete_item(p, partition_key = p['username'])


clean_player_db()
clean_prompt_db()