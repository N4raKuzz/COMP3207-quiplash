
import requests
import uuid
import json

key = "1b6c7be719824f4998acfa440cb5f77e"
endpoint = "https://api.cognitive.microsofttranslator.com/"
location = "uksouth"

def detect(text):
    
    url = endpoint + '/detect'
    params = {
        'api-version': '3.0'
    }

    headers = {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': str(uuid.uuid4())
    }

    body = [{
        'text': text
    }]

    request = requests.post(url, params=params, headers=headers, json=body)
    response = request.json()

    if "language" in response[0] and "score" in response[0]:
        language = response[0]['language']
        score = response[0]['score']

        return language,score
    else:
        return None, None

def translate(text, languages):

    url = endpoint + '/translate'

    params = {
        'api-version': '3.0',
        'to': languages
    }

    headers = {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': str(uuid.uuid4())
    }

    body = [{
        'text': text
    }]

    request = requests.post(url, params=params, headers=headers, json=body)
    response = request.json()

    # Extract and format the translations
    result = []
    for t in response[0]['translations']:
        result.append({
            "language": t['to'],
            "text": t['text']
        })

    return result

