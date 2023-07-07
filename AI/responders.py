import chatgpt  
from time import sleep
from flask import Flask, request, json

app = Flask(__name__)

@app.route('/respond',methods=['POST'])
def respond():
    response=False
    try:
        data = json.loads(request.data)
        print(data)
        ints = chatgpt.predict_class(data['message'])
        print(ints)
        if ints:
            res = chatgpt.get_response(ints, chatgpt.intents)
            response={"response":res,"intension":ints[0]['intent']}
        else:
            response=json.dumps({"response":response})
    except :
        response=json.dumps({"response":False})
    return response

if __name__ == '__main__':
    app.run(host="unix:///tmp/app.sock")
