# COMP3207-quiplash
UoS COMP3207 Cloud Application Coursework1

## Player:

Username (unique),  minimum 4 characters, maximum, 14 characters  
Password, minimum 10 characters, maximum, 20 characters  
games_played: Counter of games played by this player. Integer >=0.  
total_score: accumulator of score of all games played by this player. Integer >=0.  
  
{"id": "auto-gen-by-Cosmos", "username" : "py_luis", "password": "pythonrulz" , "games_played" : 542 , "total_score" : 3744   }  

## Prompt:
Username: player that created this Prompt  
Texts: Unordered list of pairs {language, text} of a Prompt and its translations to multiple languages.  
Language is a code on the table of languages supported by Azure Translation. In this coursework we focus on ["en", "es"........]  
Text is a string of minimum 15 characters, maximum 80 characters  

{"id": "auto-gen-by-Cosmos" ,"username": "py_luis" , "texts" : [{"language" : "en", "text": "The most useless Python one-line program" }]}

## Functions：
### player/register
HTTP POST
Input: 
{"username":  "string" , "password" : "string"}
Output: one of the following:
{"result" : true, "msg": "OK" } if player successfully registered. games_played and total_score must be set to 0 in the DB
{"result": false, "msg": "Username already exists" } if username already exists 
{"result": false, "msg": "Username less than 4 characters or more than 14 characters"  } if username below/above the limit 
{"result": false, "msg": "Password less than 10 characters or more than 20 characters"  } if password below/above the limit
