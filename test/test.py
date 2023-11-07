import requests
import json
import uuid

# 目标URL
endpoint = "https://quiplash-zz22u21.azurewebsites.net"
path_promptCreate = "prompt/create"
path_playerLogin = "player/login"
path_playerRegister = "player/register"
path_playerUpdate = "player/update"
path_utilsLearderboard = "utils/leaderboard"
path_utilsGet = "utils/get"
key = "?code=V9M5QmKZOkMpWODAfM-VnmWayt9bxNwHWMqpQIxH0aYVAzFud6K0OA=="


def checkEqual1(json_list1 ,json_list2 ):

    json_list1 = [{"text": item["text"], "username": item["username"]} for item in json_list1]
    json_list2 = [{"text": item["text"], "username": item["username"]} for item in json_list2]

    json_list1.sort(key=lambda x: (x["text"], x["username"]))
    json_list2.sort(key=lambda x: (x["text"], x["username"]))

    if json_list1 == json_list2:
        return True
    else:
        return False
    
def Getcheck1(url, payload, ans):

    response = requests.get(url, json=payload)

    if response.status_code != 200:
        print(f"Failed to get response")
        print(response)
        return
    

    a = json.loads(response.text)

    if(checkEqual1(a, ans)):
        print("Accept")
    else:
        print(f"**Wrong Answer** \nExpect:{ans} ** \nYour answer:{a}")



def Postcheck(url, payload, ans):

    response = requests.post(url, json=payload)

    if response.status_code != 200:
        print(f"Failed to get response")
        print(response)
        return
    

    a = json.loads(response.text)

    if(a == ans):
        print("Accept")
    else:
        print(f"**Wrong Answer** \nExpect:{ans} ** \nYour answer:{a}")

def Getcheck(url, payload, ans):

    response = requests.get(url, json=payload)

    if response.status_code != 200:
        print(f"Failed to get response")
        print(response)
        return
    

    a = json.loads(response.text)

    if(a == ans):
        print("Accept")
    else:
        print(f"**Wrong Answer** \nExpect:{ans} ** \nYour answer:{a}")


def TestpromptCreate():
    payload_promptCreate_1 = {"text": "don't forget to set the free tier and be mindful of its quota!", "username": "not_exist" }
    payload_promptCreate_2 = {"text": "don't forget", "username": "test_user" }
    payload_promptCreate_3 = {"text": "A prompt in each language. The languages the quiplash app supports are English, Spanish, Italian, Swedish, Russian, Indonesian, Bulgarian and Chinese Simplified", "username": "test_user" }
    payload_promptCreate_4 = {"text": "123456789101112131415", "username": "test_user" }
    payload_promptCreate_5 = {"text": "すべてはシュタインズ・ゲートの選択である", "username": "test_user" }
    payload_promptCreate_6 = {"text": "你说的都对，但是哈佛大学研究表明，原神是一款", "username": "test_user" }

    ans_promptCreate_1 = {"result": False, "msg": "Player does not exist"}
    ans_promptCreate_2 = {"result": False, "msg": "Prompt less than 15 characters or more than 80 characters"}
    ans_promptCreate_3 = {"result": False, "msg": "Prompt less than 15 characters or more than 80 characters"}
    ans_promptCreate_4 = {"result": False, "msg": "Unsupported language"}
    ans_promptCreate_5 = {"result": False, "msg": "Unsupported language"}
    ans_promptCreate_6 = {"result": True, "msg": "OK"}



    requests.post(endpoint+path_playerRegister+key, json={"username":  "test_user" , "password" : "1234567890"})

    print("\n-prompt create 1\n")
    Postcheck(endpoint+path_promptCreate+key, payload_promptCreate_1, ans_promptCreate_1)

    print("\n-prompt create 2\n")
    Postcheck(endpoint+path_promptCreate+key, payload_promptCreate_2, ans_promptCreate_2)

    print("\n-prompt create 3\n")
    Postcheck(endpoint+path_promptCreate+key, payload_promptCreate_3, ans_promptCreate_3)

    print("\n-prompt create 4\n")
    Postcheck(endpoint+path_promptCreate+key, payload_promptCreate_4, ans_promptCreate_4)

    print("\n-prompt create 5\n")
    Postcheck(endpoint+path_promptCreate+key, payload_promptCreate_5, ans_promptCreate_5)

    print("\n-prompt create 6 : Need to check the database yourself\n")
    Postcheck(endpoint+path_promptCreate+key, payload_promptCreate_6, ans_promptCreate_6)

########################################
########################################

def TestplayerLogin():
    payload_playerLogin_1 = {"username": "test_user" , "password" : "1234567890"}
    payload_playerLogin_2 = {"username": "test_user" , "password" : "0000000000"}
    payload_playerLogin_3 = {"username": "not_exist" , "password" : "1234567890"}


    ans_playerLogin_1 = {"result": True , "msg" : "OK"}
    ans_playerLogin_2 = {"result": False , "msg": "Username or password incorrect"}
    ans_playerLogin_3 = {"result": False , "msg": "Username or password incorrect"}

    requests.post(endpoint+path_playerRegister+key, json={"username":  "test_user" , "password" : "1234567890"})

    print("\n-player login 1\n")
    Getcheck(endpoint+path_playerLogin+key, payload_playerLogin_1, ans_playerLogin_1)

    print("\n-player login 2\n")
    Getcheck(endpoint+path_playerLogin+key, payload_playerLogin_2, ans_playerLogin_2)

    print("\n-player login 3\n")
    Getcheck(endpoint+path_playerLogin+key, payload_playerLogin_3, ans_playerLogin_3)

############################################
########################################

def TestutilsGet():

    print("**ensure db is empty")

    payload_utilsGet_1 = {"players":  ["test_user","test_user1"], "language": "en"}
    payload_utilsGet_2 = {"players":  ["test_user","test_user1","test_user2"], "language": "en"}
    payload_utilsGet_3 = {"players":  ["test_user2"], "language": "en"}
    payload_utilsGet_4 = {"players":  ["test_user2"], "language": "zh-Hans"}

    ans_utilsGet_1 = [
    {"id": "auto-gen-4" , "text" : "don't forget to set the free tier and be mindful of its quota!" , "username" : "test_user"},
    {"id": "auto-gen-3" , "text": "If none of the usernames in the list exist or have prompts", "username": "test_user"},
    {"id": "auto-gen-5" , "text": "Added auto-gen-5 above to specify the output in the case a player", "username": "test_user1"},
    ]

    ans_utilsGet_2 = ans_utilsGet_1

    ans_utilsGet_3 = []

    ans_utilsGet_4 =  [
    {"id": "auto-gen-4" , "text" : "你说的都对，但是哈佛大学研究表明，原神是一款" , "username" : "test_user2"},
    {"id": "auto-gen-3" , "text": "您可以比较两个JSON对象的内容而不考虑它们的元素顺序", "username": "test_user2"},
    ]



    requests.post(endpoint+path_playerRegister+key, json={"username":  "test_user" , "password" : "1234567890"})
    requests.post(endpoint+path_playerRegister+key, json={"username":  "test_user1" , "password" : "1234567890"})
    requests.post(endpoint+path_playerRegister+key, json={"username":  "test_user2" , "password" : "1234567890"})

    requests.post(endpoint+path_promptCreate+key, json={"text": "don't forget to set the free tier and be mindful of its quota!", "username": "test_user" })
    requests.post(endpoint+path_promptCreate+key, json={"text": "If none of the usernames in the list exist or have prompts", "username": "test_user" })
    requests.post(endpoint+path_promptCreate+key, json={"text": "Added auto-gen-5 above to specify the output in the case a player", "username": "test_user1" })

    print("\n-utils get 1\n")
    Getcheck1(endpoint+path_utilsGet+key, payload_utilsGet_1, ans_utilsGet_1)

    print("\n-utils get 2\n")
    Getcheck1(endpoint+path_utilsGet+key, payload_utilsGet_2, ans_utilsGet_2)

    print("\n-utils get 3\n")
    Getcheck1(endpoint+path_utilsGet+key, payload_utilsGet_3, ans_utilsGet_3)


    requests.post(endpoint+path_promptCreate+key, json={"text": "你说的都对，但是哈佛大学研究表明，原神是一款", "username": "test_user2" })
    requests.post(endpoint+path_promptCreate+key, json={"text": "您可以比较两个JSON对象的内容而不考虑它们的元素顺序", "username": "test_user2" })

    print("\n-utils get 4\n")
    Getcheck1(endpoint+path_utilsGet+key, payload_utilsGet_4, ans_utilsGet_4)

############################################
########################################

def TestutilsLeaderboard():
    print("**ensure db is empty")

    payload_utilsLeaderboard_1 = {"top" : 5}
    payload_utilsLeaderboard_2 = {"top" : 0}

    ans_utilsLeaderboard_1 = [ {"username": "X-player", "games_played" : 50, "total_score": 100} ,
        {"username": "D-player", "games_played" : 10, "total_score": 80} ,
        {"username": "C-player", "games_played" : 20, "total_score": 80} ,
        {"username": "A-player", "games_played" : 10, "total_score": 40} ,
        {"username": "B-player", "games_played" : 10, "total_score": 40} ,
    ]
    ans_utilsLeaderboard_2 = []

    requests.post(endpoint+path_playerRegister+key, json={"username":  "A-player" , "password" : "1234567890"})
    requests.post(endpoint+path_playerRegister+key, json={"username":  "B-player" , "password" : "1234567890"})
    requests.post(endpoint+path_playerRegister+key, json={"username":  "C-player" , "password" : "1234567890"})
    requests.post(endpoint+path_playerRegister+key, json={"username":  "D-player" , "password" : "1234567890"})
    requests.post(endpoint+path_playerRegister+key, json={"username":  "X-player" , "password" : "1234567890"})
    requests.post(endpoint+path_playerRegister+key, json={"username":  "Y-player" , "password" : "1234567890"})
    requests.post(endpoint+path_playerRegister+key, json={"username":  "Z-player" , "password" : "1234567890"})

    requests.put(endpoint+path_playerUpdate+key, json={"username": "A-player" , "password": "pwd" , "add_to_games_played": 10 , "add_to_score" : 40 })
    requests.put(endpoint+path_playerUpdate+key, json={"username": "B-player" , "password": "pwd" , "add_to_games_played": 10 , "add_to_score" : 40 })
    requests.put(endpoint+path_playerUpdate+key, json={"username": "C-player" , "password": "pwd" , "add_to_games_played": 20 , "add_to_score" : 80 })
    requests.put(endpoint+path_playerUpdate+key, json={"username": "D-player" , "password": "pwd" , "add_to_games_played": 10 , "add_to_score" : 80 })
    requests.put(endpoint+path_playerUpdate+key, json={"username": "X-player" , "password": "pwd" , "add_to_games_played": 50 , "add_to_score" : 100 })
    requests.put(endpoint+path_playerUpdate+key, json={"username": "Y-player" , "password": "pwd" , "add_to_games_played": 10 , "add_to_score" : 40 })
    requests.put(endpoint+path_playerUpdate+key, json={"username": "Z-player" , "password": "pwd" , "add_to_games_played": 1 , "add_to_score" : 10 })

    print("\n-utils Leaderboard 1\n")
    Getcheck(endpoint+path_utilsLearderboard+key, payload_utilsLeaderboard_1,ans_utilsLeaderboard_1)

    print("\n-utils Leaderboard 2\n")
    Getcheck(endpoint+path_utilsLearderboard+key, payload_utilsLeaderboard_2,ans_utilsLeaderboard_2)


TestplayerLogin()
TestpromptCreate()
TestutilsGet()
TestutilsLeaderboard()