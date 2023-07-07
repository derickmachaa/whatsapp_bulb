# required modules
import random
import json
import pickle
import numpy as np
import nltk
from keras.models import load_model
from nltk.stem import WordNetLemmatizer
import datetime

lemmatizer = WordNetLemmatizer()
  
# loading the files we made previously
intents = json.loads(open("intense.json").read())
words = pickle.load(open('words.pkl', 'rb'))
classes = pickle.load(open('classes.pkl', 'rb'))
model = load_model('chatbotmodel.h5')

def gettime():
    time=""
    current_time = datetime.datetime.now().time()
    if current_time.hour < 12:
        time="morning",current_time.hour,current_time.minute,current_time.second
    elif current_time.hour < 18:
        time="afternoon",current_time.hour,current_time.minute,current_time.second
    else:
        time="evening",current_time.hour,current_time.minute,current_time.second
    return time

def clean_up_sentences(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word)
                      for word in sentence_words]
    return sentence_words

def bagw(sentence):

    # separate out words from the input sentence
    sentence_words = clean_up_sentences(sentence)
    bag = [0]*len(words)
    for w in sentence_words:
        for i, word in enumerate(words):

            # check whether the word
            # is present in the input as well
            if word == w:

                # as the list of words
                # created earlier.
                bag[i] = 1

    # return a numpy array
    return np.array(bag)

def get_response(intents_list, intents_json):
    tag = intents_list[0]['intent']
    gr,hr,mins,sec=gettime()
    if(tag=="greetings_goodmorning" and not gr=="morning"):
        return intents_json['greetings_correction'].format(hr,mins,sec,gr)
    elif(tag=="greetings_goodafternoon" and not gr=="afternoon"):
        return intents_json['greetings_correction'].format(hr,mins,sec,gr)
    elif(tag=="greetings_goodevening" and not gr=="evening"):
        return intents_json['greetings_correction'].format(hr,mins,sec,gr)
    elif(tag=="greetings_goodnight" and not gr=="evening"):
        return intents_json['greetings_correction'].format(hr,mins,sec,gr)
    else:
        list_of_intents = intents_json['intents']
        result = ""
        for i in list_of_intents:
            if i['tag'] == tag:
                  # prints a random response
                result = random.choice(i['responses'])
                break
        return result

def predict_class(sentence):
    bow = bagw(sentence)
    res = model.predict(np.array([bow]))[0]
    ERROR_THRESHOLD = 0.998
    results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({'intent': classes[r[0]],'probability': str(r[1])})
    return return_list

if "__name__" == "__main__":
    print("Chatbot is up!")
    while True:
        message = input(">")
        ints = predict_class(message)
        print(ints)
        if ints:
            res = get_response(ints, intents)
            print(res)
